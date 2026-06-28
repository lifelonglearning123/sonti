import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Organization, OrgRole, PlatformRole } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export type AuthContext = {
  userId: string;
  email: string;
  fullName: string | null;
  platformRole: PlatformRole;
  organization: Organization | null;
  organizationId: string | null;
  orgRole: OrgRole | null;
  /** GHL location this membership is scoped to, if any (members). */
  membershipLocationId: string | null;
};

/**
 * Resolve the current request's auth context from the Supabase session + the
 * Prisma Profile/Membership. Memoized per-request via React cache(). This is the
 * single replacement for next-auth's auth() across the whole app.
 *
 * Returns null when there is no authenticated user or no matching profile.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: { memberships: { include: { organization: true } } },
  });
  if (!profile) return null;

  // Single-org for now: take the first membership.
  const membership = profile.memberships[0] ?? null;

  return {
    userId: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    platformRole: profile.platformRole,
    organization: membership?.organization ?? null,
    organizationId: membership?.organizationId ?? null,
    orgRole: membership?.role ?? null,
    membershipLocationId: membership?.ghlLocationId ?? null,
  };
});

/**
 * Require an authenticated user with an active organization. Redirects to /login
 * when unauthenticated and to /suspended when the org is deactivated.
 * Super-admins without an org are allowed through (org may be null).
 */
export const requireAuth = cache(async (): Promise<AuthContext> => {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.organization && !ctx.organization.isActive) redirect("/suspended");
  if (!ctx.organization && ctx.platformRole !== "superadmin") {
    // Authenticated but not attached to any org and not a super-admin.
    redirect("/login?error=NoOrganization");
  }
  return ctx;
});

/** For Server Components/pages: require org owner or admin, else redirect. */
export async function requireOrgAdminPage(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.orgRole !== "owner" && ctx.orgRole !== "admin") redirect("/dashboard");
  return ctx;
}

/** For Server Components/pages: require super-admin, else redirect. */
export async function requireSuperAdminPage(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.platformRole !== "superadmin") redirect("/dashboard");
  return ctx;
}

/** For Route Handlers: returns the context if org admin, else null (caller 403s). */
export async function getOrgAdminContext(): Promise<AuthContext | null> {
  const ctx = await getAuthContext();
  if (!ctx || !ctx.organizationId) return null;
  if (ctx.organization && !ctx.organization.isActive) return null;
  if (ctx.orgRole !== "owner" && ctx.orgRole !== "admin") return null;
  return ctx;
}

/** For Route Handlers: returns the context if super-admin, else null (caller 403s). */
export async function getSuperAdminContext(): Promise<AuthContext | null> {
  const ctx = await getAuthContext();
  if (!ctx || ctx.platformRole !== "superadmin") return null;
  return ctx;
}
