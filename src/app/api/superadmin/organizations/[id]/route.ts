import { NextRequest } from "next/server";
import { getSuperAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlanTier } from "@prisma/client";

const VALID_PLANS: PlanTier[] = ["free", "starter", "pro"];

// Update an organization's plan or active state (suspend / reactivate).
export async function PATCH(req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const ctx = await getSuperAdminContext();
  if (!ctx) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctxArg.params;
  const body = await req.json();

  const data: { plan?: PlanTier; isActive?: boolean } = {};
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (VALID_PLANS.includes(body.plan)) data.plan = body.plan;
  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const org = await prisma.organization.update({ where: { id }, data }).catch(() => null);
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  return Response.json({ organization: { id: org.id, plan: org.plan, isActive: org.isActive } });
}

// Delete an organization and all its members' accounts.
export async function DELETE(_req: NextRequest, ctxArg: { params: Promise<{ id: string }> }) {
  const ctx = await getSuperAdminContext();
  if (!ctx) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctxArg.params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: { memberships: { include: { profile: { include: { memberships: true } } } } },
  });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  const admin = createSupabaseAdminClient();

  // Delete the org (cascades memberships, connection, locations, tokens).
  await prisma.organization.delete({ where: { id } });

  // Clean up auth users / profiles that no longer belong to any org.
  for (const m of org.memberships) {
    const profile = m.profile;
    const remaining = profile.memberships.filter((mm) => mm.organizationId !== id);
    if (remaining.length === 0 && profile.platformRole !== "superadmin") {
      await admin.auth.admin.deleteUser(profile.id).catch(() => {});
      await prisma.profile.delete({ where: { id: profile.id } }).catch(() => {});
    }
  }

  return Response.json({ success: true });
}
