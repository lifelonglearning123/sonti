import { getSuperAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { baseUrlFromRequest } from "@/lib/request-url";
import {
  createAgencySubAccount,
  isAgencyConnected,
  listAgencySubAccounts,
  verifyLocationToken,
} from "@/lib/ghl-tokens";
import type { PlanTier } from "@prisma/client";

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
      _count: { select: { memberships: true } },
      locations: { take: 1, orderBy: { createdAt: "asc" } },
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
    locationName: o.locations[0]?.name ?? null,
    ghlLocationId: o.locations[0]?.ghlLocationId ?? null,
    ownerEmail: o.memberships[0]?.profile.email ?? null,
    createdAt: o.createdAt,
  }));

  return Response.json({ organizations });
}

/**
 * Provision a tenant: create a GHL sub-account under the platform agency, then
 * an Organization bound to it, invite the owner/admin, and register the location.
 */
export async function POST(req: Request) {
  const ctx = await getSuperAdminContext();
  if (!ctx) return Response.json({ error: "Forbidden" }, { status: 403 });

  if (!(await isAgencyConnected())) {
    return Response.json(
      { error: "Agency is not connected (set GHL_AGENCY_API_TOKEN or connect via OAuth)." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const name: string = (body?.name || "").trim();
  const ownerEmail: string = (body?.ownerEmail || "").trim().toLowerCase();
  const ownerName: string | null = body?.ownerName || null;
  const plan: PlanTier = VALID_PLANS.includes(body?.plan) ? body.plan : "free";
  const slug = slugify(body?.slug || name);
  // "create" makes a new GHL sub-account; "existing" binds one that already exists.
  const mode: "create" | "existing" = body?.mode === "existing" ? "existing" : "create";
  const existingLocationId: string = (body?.ghlLocationId || "").trim();
  // Sub-account details (for create mode; default business name to the org name).
  const subName: string = (body?.subAccountName || name).trim();
  const subEmail: string | undefined = body?.subAccountEmail || ownerEmail || undefined;
  const subPhone: string | undefined = body?.subAccountPhone || undefined;
  // The sub-account's own location PIT (for CRM data access).
  const locationApiToken: string = (body?.locationApiToken || "").trim();

  if (!name) return Response.json({ error: "Organization name is required" }, { status: 400 });
  if (!ownerEmail) return Response.json({ error: "Owner email is required" }, { status: 400 });
  if (!slug) return Response.json({ error: "A valid slug could not be derived" }, { status: 400 });

  const slugTaken = await prisma.organization.findUnique({ where: { slug } });
  if (slugTaken) return Response.json({ error: "That slug is already taken" }, { status: 409 });

  // 1. Resolve the GHL sub-account — either create a new one or bind an existing one.
  let subAccount: { id: string; name: string };
  if (mode === "existing") {
    if (!existingLocationId) {
      return Response.json({ error: "Select a sub-account to bind" }, { status: 400 });
    }
    const alreadyBound = await prisma.orgLocation.findFirst({
      where: { ghlLocationId: existingLocationId },
      select: { id: true },
    });
    if (alreadyBound) {
      return Response.json(
        { error: "That sub-account is already linked to a workspace" },
        { status: 409 }
      );
    }
    try {
      const subs = await listAgencySubAccounts();
      const found = subs.find((s) => s.id === existingLocationId);
      if (!found) {
        return Response.json({ error: "Sub-account not found under this agency" }, { status: 404 });
      }
      subAccount = { id: found.id, name: found.name };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to read sub-accounts";
      return Response.json({ error: message }, { status: 400 });
    }
  } else {
    try {
      subAccount = await createAgencySubAccount({
        name: subName,
        email: subEmail,
        phone: subPhone,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create sub-account";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  // Validate the location PIT (if provided) against the resolved sub-account.
  if (locationApiToken) {
    const check = await verifyLocationToken(subAccount.id, locationApiToken);
    if (!check.valid) {
      return Response.json(
        { error: `The sub-account API token is invalid: ${check.error}` },
        { status: 400 }
      );
    }
  }

  const admin = createSupabaseAdminClient();

  // 2. Ensure the owner's auth user / profile exists (invite if new).
  let profile = await prisma.profile.findUnique({ where: { email: ownerEmail } });
  let createdAuthUser = false;
  if (!profile) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(ownerEmail, {
      redirectTo: `${baseUrlFromRequest(req)}/auth/callback?type=invite`,
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

  // 3. Create org + owner membership + bind the sub-account, transactionally.
  try {
    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, slug, plan, isActive: true },
      });
      await tx.membership.create({
        data: {
          profileId: profile!.id,
          organizationId: org.id,
          role: "owner",
          ghlLocationId: subAccount.id,
        },
      });
      await tx.orgLocation.create({
        data: {
          organizationId: org.id,
          ghlLocationId: subAccount.id,
          name: subAccount.name,
          apiToken: locationApiToken ? encryptSecret(locationApiToken) : null,
        },
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
          ghlLocationId: subAccount.id,
          locationName: subAccount.name,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    // Compensate: the Supabase auth user was created outside the Prisma tx.
    // (The GHL sub-account is left in place — deleting sub-accounts is destructive
    // and may not be reversible; it can be reused on retry.)
    if (createdAuthUser && profile) {
      await admin.auth.admin.deleteUser(profile.id).catch(() => {});
      await prisma.profile.delete({ where: { id: profile.id } }).catch(() => {});
    }
    const message = e instanceof Error ? e.message : "Provisioning failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
