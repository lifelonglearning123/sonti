import { getOrgAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import {
  isOAuthConnected,
  setLocationApiToken,
  verifyLocationToken,
} from "@/lib/ghl-tokens";

/** The org's single sub-account location. */
async function orgLocation(organizationId: string) {
  return prisma.orgLocation.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

// Status of the sub-account's GHL connection (its location PIT).
export async function GET() {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const loc = await orgLocation(ctx.organizationId);
  const oauthAvailable = await isOAuthConnected();
  return Response.json({
    locationName: loc?.name ?? null,
    ghlLocationId: loc?.ghlLocationId ?? null,
    hasToken: !!loc?.apiToken,
    oauthAvailable,
    // Effective: data works if a PIT is set OR the agency OAuth can mint a token.
    connected: !!loc?.apiToken || oauthAvailable,
  });
}

// Set/replace the sub-account's location PIT.
export async function PUT(req: Request) {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const token: string = (body?.apiToken || "").trim();
  if (!token) return Response.json({ error: "API token is required" }, { status: 400 });

  const loc = await orgLocation(ctx.organizationId);
  if (!loc) return Response.json({ error: "No sub-account for this workspace" }, { status: 400 });

  const check = await verifyLocationToken(loc.ghlLocationId, token);
  if (!check.valid) {
    return Response.json({ error: `Invalid token: ${check.error}` }, { status: 400 });
  }

  await setLocationApiToken(ctx.organizationId, loc.ghlLocationId, token);
  return Response.json({ success: true });
}

// Clear the sub-account's location PIT.
export async function DELETE() {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const loc = await orgLocation(ctx.organizationId);
  if (loc) await setLocationApiToken(ctx.organizationId, loc.ghlLocationId, null);
  return Response.json({ success: true });
}
