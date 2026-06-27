import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const ACTIVE_LOCATION_COOKIE = "active_location";

/**
 * Resolve the GHL location the current request should operate on, for a given
 * organization. Reads the active_location cookie and validates it belongs to the
 * org; otherwise falls back to the membership's location, then the org's first
 * location. Returns null if the org has no locations.
 *
 * This is the tenant-isolation boundary for location selection: a location is
 * only ever used after confirming it is one of the org's own OrgLocation rows.
 */
export async function resolveActiveLocationId(
  organizationId: string,
  membershipLocationId: string | null
): Promise<string | null> {
  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_LOCATION_COOKIE)?.value || null;

  const locations = await prisma.orgLocation.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: { ghlLocationId: true },
  });
  const allowed = new Set(locations.map((l) => l.ghlLocationId));

  if (requested && allowed.has(requested)) return requested;
  if (membershipLocationId && allowed.has(membershipLocationId)) {
    return membershipLocationId;
  }
  return locations[0]?.ghlLocationId ?? null;
}
