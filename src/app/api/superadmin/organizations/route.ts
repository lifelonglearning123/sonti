import { getSuperAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlanTier } from "@prisma/client";

function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const VALID_PLANS: PlanTier[] = ["free", "starter", "pro"];

export async function GET() {
  const ctx = await getSuperAdminContext();
  if (!ctx) return Response.json({ error: "Forbidden" }, { status: 403 });

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, locations: true } },
      ghlConnection: { select: { id: true } },
      memberships: {
        where: { role: "owner" },
        include: { profile: { select: { email: true } } },
        take: 1,
      },
    },
  });

  const organizations = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    plan: o.plan,
    isActive: o.isActive,
    memberCount: o._count.memberships,
    locationCount: o._count.locations,
    ghlConnected: !!o.ghlConnection,
    ownerEmail: o.memberships[0]?.profile.email ?? null,
    createdAt: o.createdAt,
  }));

  return Response.json({ organizations });
}

export async function POST(req: Request) {
  const ctx = await getSuperAdminContext();
  if (!ctx) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const name: string = (body?.name || "").trim();
  const ownerEmail: string = (body?.ownerEmail || "").trim().toLowerCase();
  const ownerName: string | null = body?.ownerName || null;
  const plan: PlanTier = VALID_PLANS.includes(body?.plan) ? body.plan : "free";
  const slug = slugify(body?.slug || name);

  if (!name) return Response.json({ error: "Organization name is required" }, { status: 400 });
  if (!ownerEmail) return Response.json({ error: "Owner email is required" }, { status: 400 });
  if (!slug) return Response.json({ error: "A valid slug could not be derived" }, { status: 400 });

  const slugTaken = await prisma.organization.findUnique({ where: { slug } });
  if (slugTaken) return Response.json({ error: "That slug is already taken" }, { status: 409 });

  const admin = createSupabaseAdminClient();

  // Reuse an existing profile/auth user if the owner already has an account.
  let profile = await prisma.profile.findUnique({ where: { email: ownerEmail } });
  let createdAuthUser = false;

  if (!profile) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(ownerEmail, {
      redirectTo: `${appBaseUrl()}/auth/callback?type=invite`,
      data: { fullName: ownerName },
    });
    if (error || !data?.user) {
      return Response.json(
        { error: error?.message || "Could not invite the owner" },
        { status: 400 }
      );
    }
    createdAuthUser = true;
    profile = await prisma.profile.create({
      data: { id: data.user.id, email: ownerEmail, fullName: ownerName },
    });
  }

  try {
    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, slug, plan, isActive: true },
      });
      await tx.membership.create({
        data: { profileId: profile!.id, organizationId: org.id, role: "owner" },
      });
      return org;
    });

    return Response.json(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
          ownerEmail,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    // Compensate: the Supabase auth user was created outside the Prisma tx.
    if (createdAuthUser && profile) {
      await admin.auth.admin.deleteUser(profile.id).catch(() => {});
      await prisma.profile.delete({ where: { id: profile.id } }).catch(() => {});
    }
    const message = e instanceof Error ? e.message : "Provisioning failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
