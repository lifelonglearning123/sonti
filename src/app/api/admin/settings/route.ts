import { getOrgAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

// Manual (private integration) agency tokens don't expire or refresh.
const FAR_FUTURE = () => new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

export async function GET() {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const conn = await prisma.ghlConnection.findUnique({
    where: { organizationId: ctx.organizationId },
    select: { companyId: true, agencyName: true },
  });

  return Response.json({
    hasToken: !!conn,
    companyId: conn?.companyId || null,
    agencyName: conn?.agencyName || null,
  });
}

/** Connect via a manually pasted agency (private integration) token. */
export async function PUT(req: Request) {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const agencyToken: string = body?.agencyToken;
  if (!agencyToken) {
    return Response.json({ error: "Agency token is required" }, { status: 400 });
  }

  try {
    const headers = { Authorization: `Bearer ${agencyToken}`, Version: "2021-07-28" };
    const res = await fetch(`${GHL_BASE_URL}/locations/search?limit=1`, { headers });
    if (!res.ok) {
      return Response.json(
        {
          error: `Invalid token: GHL returned ${res.status}. Use an agency-level token with locations.readonly scope.`,
        },
        { status: 400 }
      );
    }

    const data = await res.json();
    const firstLoc = data.locations?.[0];
    const companyId: string = firstLoc?.companyId || "";
    const locationCount = data.locations?.length || 0;
    let agencyName = `Agency (${locationCount} location${locationCount !== 1 ? "s" : ""})`;

    if (companyId) {
      try {
        const compRes = await fetch(`${GHL_BASE_URL}/companies/${companyId}`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          agencyName = compData.company?.name || compData.name || agencyName;
        }
      } catch {}
    }

    await prisma.ghlConnection.upsert({
      where: { organizationId: ctx.organizationId },
      create: {
        organizationId: ctx.organizationId,
        companyId: companyId || "auto",
        agencyName,
        accessToken: encryptSecret(agencyToken),
        refreshToken: encryptSecret(""),
        expiresAt: FAR_FUTURE(),
      },
      update: {
        companyId: companyId || "auto",
        agencyName,
        accessToken: encryptSecret(agencyToken),
        refreshToken: encryptSecret(""),
        expiresAt: FAR_FUTURE(),
      },
    });

    return Response.json({ success: true, companyId: companyId || "auto", agencyName });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown error";
    return Response.json({ error: `Could not reach GHL API: ${message}` }, { status: 500 });
  }
}

export async function DELETE() {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  // Cascade removes cached location tokens via the relation.
  await prisma.ghlConnection.deleteMany({ where: { organizationId: ctx.organizationId } });
  await prisma.ghlLocationToken.deleteMany({ where: { organizationId: ctx.organizationId } });

  return Response.json({ success: true });
}
