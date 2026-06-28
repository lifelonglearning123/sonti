import { getOrgAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { baseUrlFromRequest } from "@/lib/request-url";

/** The org's sub-account location (each org is bound to exactly one). */
async function orgLocationId(organizationId: string): Promise<string | null> {
  const row = await prisma.orgLocation.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: { ghlLocationId: true },
  });
  return row?.ghlLocationId ?? null;
}

// List members of the caller's organization.
export async function GET() {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const memberships = await prisma.membership.findMany({
    where: { organizationId: ctx.organizationId },
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  });

  const users = memberships.map((m) => ({
    id: m.profileId,
    email: m.profile.email,
    fullName: m.profile.fullName,
    role: m.role,
    ghlLocationId: m.ghlLocationId,
    createdAt: m.createdAt,
  }));

  return Response.json({ users });
}

// Invite a new member to the organization.
export async function POST(req: Request) {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const email: string = (body?.email || "").trim().toLowerCase();
  const fullName: string | null = body?.fullName || null;
  const orgRole = body?.role === "admin" ? "admin" : "member";

  if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

  // Members are automatically scoped to the org's single sub-account location.
  const ghlLocationId = await orgLocationId(ctx.organizationId);

  const admin = createSupabaseAdminClient();

  let profile = await prisma.profile.findUnique({ where: { email } });

  if (!profile) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrlFromRequest(req)}/auth/callback?type=invite`,
      data: { fullName },
    });
    if (error || !data?.user) {
      return Response.json(
        { error: error?.message || "Could not invite this user" },
        { status: 400 }
      );
    }
    profile = await prisma.profile.create({
      data: { id: data.user.id, email, fullName },
    });
  } else if (fullName && !profile.fullName) {
    profile = await prisma.profile.update({
      where: { id: profile.id },
      data: { fullName },
    });
  }

  const existing = await prisma.membership.findUnique({
    where: {
      profileId_organizationId: {
        profileId: profile.id,
        organizationId: ctx.organizationId,
      },
    },
  });
  if (existing) {
    return Response.json({ error: "This person is already a member" }, { status: 409 });
  }

  await prisma.membership.create({
    data: {
      profileId: profile.id,
      organizationId: ctx.organizationId,
      role: orgRole,
      ghlLocationId,
    },
  });

  return Response.json(
    { user: { id: profile.id, email, role: orgRole } },
    { status: 201 }
  );
}
