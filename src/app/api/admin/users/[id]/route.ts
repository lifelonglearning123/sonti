import { NextRequest } from "next/server";
import { getOrgAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function locationInOrg(organizationId: string, ghlLocationId: string) {
  const row = await prisma.orgLocation.findUnique({
    where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
    select: { id: true },
  });
  return !!row;
}

// Update a member's role, assigned location, name, or password.
export async function PUT(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: profileId } = await ctxArg.params;
  const body = await req.json();

  const membership = await prisma.membership.findUnique({
    where: {
      profileId_organizationId: { profileId, organizationId: ctx.organizationId },
    },
  });
  if (!membership) return Response.json({ error: "Member not found" }, { status: 404 });

  // The owner role can't be reassigned here.
  if (membership.role === "owner" && body.role && body.role !== "owner") {
    return Response.json({ error: "Cannot change the owner's role" }, { status: 400 });
  }

  const membershipData: { role?: "admin" | "member"; ghlLocationId?: string | null } = {};
  if (body.role === "admin" || body.role === "member") membershipData.role = body.role;
  if (body.ghlLocationId !== undefined) {
    const loc = body.ghlLocationId || null;
    if (loc && !(await locationInOrg(ctx.organizationId, loc))) {
      return Response.json({ error: "Location is not in your workspace" }, { status: 400 });
    }
    membershipData.ghlLocationId = loc;
  }
  if (Object.keys(membershipData).length > 0) {
    await prisma.membership.update({ where: { id: membership.id }, data: membershipData });
  }

  if (typeof body.fullName === "string") {
    await prisma.profile.update({ where: { id: profileId }, data: { fullName: body.fullName } });
  }

  if (typeof body.password === "string" && body.password) {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(profileId, {
      password: body.password,
    });
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ user: { id: profileId } });
}

// Remove a member from the organization (deletes the account if no orgs remain).
export async function DELETE(_req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: profileId } = await ctxArg.params;

  const membership = await prisma.membership.findUnique({
    where: {
      profileId_organizationId: { profileId, organizationId: ctx.organizationId },
    },
  });
  if (!membership) return Response.json({ error: "Member not found" }, { status: 404 });

  if (membership.role === "owner") {
    return Response.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
  }
  if (profileId === ctx.userId) {
    return Response.json({ error: "You cannot remove yourself" }, { status: 400 });
  }

  await prisma.membership.delete({ where: { id: membership.id } });

  // Fully delete the account if it no longer belongs to any org and isn't a super-admin.
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { memberships: true },
  });
  if (profile && profile.memberships.length === 0 && profile.platformRole !== "superadmin") {
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.deleteUser(profileId).catch(() => {});
    await prisma.profile.delete({ where: { id: profileId } }).catch(() => {});
  }

  return Response.json({ success: true });
}
