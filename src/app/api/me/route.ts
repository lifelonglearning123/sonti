import { getAuthContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { resolveActiveLocationId } from "@/lib/active-location";

/**
 * Returns the current user's auth context for client components: identity, org,
 * role, the org's locations, the active location, and branding. Replaces
 * next-auth's useSession() on the client.
 */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  let locations: { ghlLocationId: string; name: string | null }[] = [];
  let activeLocationId: string | null = null;
  let hasGhlConnection = false;

  if (ctx.organizationId) {
    locations = await prisma.orgLocation.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "asc" },
      select: { ghlLocationId: true, name: true },
    });
    activeLocationId = await resolveActiveLocationId(
      ctx.organizationId,
      ctx.membershipLocationId
    );
    // The active sub-account is "connected" when its location PIT is set.
    if (activeLocationId) {
      const loc = await prisma.orgLocation.findUnique({
        where: {
          organizationId_ghlLocationId: {
            organizationId: ctx.organizationId,
            ghlLocationId: activeLocationId,
          },
        },
        select: { apiToken: true },
      });
      hasGhlConnection = !!loc?.apiToken;
    }
  }

  return Response.json({
    authenticated: true,
    userId: ctx.userId,
    email: ctx.email,
    fullName: ctx.fullName,
    platformRole: ctx.platformRole,
    orgRole: ctx.orgRole,
    organization: ctx.organization
      ? {
          id: ctx.organization.id,
          name: ctx.organization.name,
          slug: ctx.organization.slug,
          plan: ctx.organization.plan,
          isActive: ctx.organization.isActive,
          brandName: ctx.organization.brandName,
          brandColor: ctx.organization.brandColor,
          brandLogoUrl: ctx.organization.brandLogoUrl,
        }
      : null,
    hasGhlConnection,
    locations,
    activeLocationId,
  });
}
