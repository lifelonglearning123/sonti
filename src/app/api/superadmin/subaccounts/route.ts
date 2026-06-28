import { getSuperAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { listAgencySubAccounts } from "@/lib/ghl-tokens";

// List the agency's GHL sub-accounts, marking which are already bound to a workspace.
export async function GET() {
  const ctx = await getSuperAdminContext();
  if (!ctx) return Response.json({ error: "Forbidden" }, { status: 403 });

  let subs;
  try {
    subs = await listAgencySubAccounts();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list sub-accounts";
    return Response.json({ error: message }, { status: 400 });
  }

  const bound = await prisma.orgLocation.findMany({ select: { ghlLocationId: true } });
  const boundSet = new Set(bound.map((b) => b.ghlLocationId));

  return Response.json({
    subAccounts: subs.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      bound: boundSet.has(s.id),
    })),
  });
}
