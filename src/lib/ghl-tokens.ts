import "server-only";
import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import {
  ghlGetLocationAccessTokenFromAgency,
  ghlRefreshAccessToken,
  getGhlOAuthRedirectUri,
} from "@/lib/ghl";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const AGENCY_ID = "singleton";
const REFRESH_SKEW_MS = 60_000;

function nearExpiry(expiresAt: Date): boolean {
  return expiresAt.getTime() - Date.now() < REFRESH_SKEW_MS;
}

// ─── Env PIT (agency-level Private Integration Token) ────────
export function getAgencyApiToken(): string | null {
  return process.env.GHL_AGENCY_API_TOKEN || null;
}
export function getCompanyId(): string | null {
  return process.env.GHL_COMPANY_ID || null;
}
export function hasEnvPit(): boolean {
  return !!getAgencyApiToken();
}

// ─── Agency OAuth connection (optional) ─────────────────────
export async function isOAuthConnected(): Promise<boolean> {
  const row = await prisma.agencyConnection.findUnique({
    where: { id: AGENCY_ID },
    select: { id: true },
  });
  return !!row;
}

/** A valid agency OAuth access token (refreshed/persisted), or null. */
export async function getAgencyOAuthToken(): Promise<{
  accessToken: string;
  companyId: string;
} | null> {
  const conn = await prisma.agencyConnection.findUnique({ where: { id: AGENCY_ID } });
  if (!conn) return null;

  if (!nearExpiry(conn.expiresAt)) {
    return { accessToken: decryptSecret(conn.accessToken), companyId: conn.companyId };
  }
  try {
    const refreshed = await ghlRefreshAccessToken({
      refreshToken: decryptSecret(conn.refreshToken),
      userType: "Company",
      redirectUri: getGhlOAuthRedirectUri(),
    });
    const updated = await prisma.agencyConnection.update({
      where: { id: AGENCY_ID },
      data: {
        accessToken: encryptSecret(refreshed.access_token),
        refreshToken: encryptSecret(refreshed.refresh_token),
        expiresAt: new Date(Date.now() + (refreshed.expires_in || 0) * 1000),
        companyId: refreshed.companyId || conn.companyId,
        scope: refreshed.scope ?? conn.scope,
      },
    });
    return { accessToken: refreshed.access_token, companyId: updated.companyId };
  } catch {
    return { accessToken: decryptSecret(conn.accessToken), companyId: conn.companyId };
  }
}

/** Whether the agency is reachable by either method. */
export async function isAgencyConnected(): Promise<boolean> {
  return hasEnvPit() || (await isOAuthConnected());
}

/**
 * An agency-level access token for create/list sub-account operations.
 * Prefers the OAuth connection, falls back to the env PIT.
 */
async function getAgencyAccess(): Promise<{ accessToken: string; companyId: string | null } | null> {
  const oauth = await getAgencyOAuthToken();
  if (oauth) return oauth;
  const pit = getAgencyApiToken();
  if (pit) return { accessToken: pit, companyId: getCompanyId() };
  return null;
}

function agencyHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
  };
}

// ─── Tenant isolation boundary ──────────────────────────────
export async function isLocationInOrg(
  organizationId: string,
  ghlLocationId: string
): Promise<boolean> {
  const row = await prisma.orgLocation.findUnique({
    where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
    select: { id: true },
  });
  return !!row;
}

// ─── Agency-level operations ────────────────────────────────
export type AgencySubAccount = { id: string; name: string; email: string | null };

export async function listAgencySubAccounts(): Promise<AgencySubAccount[]> {
  const agency = await getAgencyAccess();
  if (!agency) throw new Error("Agency is not connected");

  let url = `${GHL_BASE_URL}/locations/search?limit=100`;
  if (agency.companyId) url += `&companyId=${agency.companyId}`;

  const res = await fetch(url, { headers: agencyHeaders(agency.accessToken) });
  if (!res.ok) throw new Error(`GHL locations/search failed (${res.status})`);
  const data = (await res.json()) as { locations?: unknown };
  const raw = Array.isArray(data.locations) ? data.locations : [];
  return raw
    .map((l) => {
      if (!l || typeof l !== "object") return null;
      const r = l as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id : null;
      const name = typeof r.name === "string" ? r.name : null;
      if (!id || !name) return null;
      return { id, name, email: typeof r.email === "string" ? r.email : null };
    })
    .filter((l): l is AgencySubAccount => !!l);
}

export async function createAgencySubAccount(payload: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}): Promise<AgencySubAccount> {
  const agency = await getAgencyAccess();
  if (!agency) throw new Error("Agency is not connected");

  const body: Record<string, string | undefined> = { ...payload };
  if (agency.companyId) body.companyId = agency.companyId;

  const res = await fetch(`${GHL_BASE_URL}/locations/`, {
    method: "POST",
    headers: agencyHeaders(agency.accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = `GHL create location failed (${res.status})`;
    try {
      const err = JSON.parse(text);
      message = err.message || err.error || message;
    } catch {}
    throw new Error(message);
  }
  const data = await res.json();
  const loc = data.location || data;
  const id = typeof loc.id === "string" ? loc.id : "";
  if (!id) throw new Error("GHL did not return a location id");
  return { id, name: loc.name || payload.name, email: loc.email ?? payload.email ?? null };
}

// ─── Per-sub-account location PIT (direct) ──────────────────
export async function getLocationApiToken(
  organizationId: string,
  ghlLocationId: string
): Promise<string | null> {
  const row = await prisma.orgLocation.findUnique({
    where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
    select: { apiToken: true },
  });
  return row?.apiToken ? decryptSecret(row.apiToken) : null;
}

export async function setLocationApiToken(
  organizationId: string,
  ghlLocationId: string,
  token: string | null
): Promise<void> {
  await prisma.orgLocation.update({
    where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
    data: { apiToken: token ? encryptSecret(token) : null },
  });
}

export async function verifyLocationToken(
  ghlLocationId: string,
  token: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${GHL_BASE_URL}/locations/${ghlLocationId}`, {
      headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION },
    });
    if (!res.ok) return { valid: false, error: `GHL returned ${res.status}` };
    return { valid: true };
  } catch {
    return { valid: false, error: "Could not reach GHL" };
  }
}

// ─── Effective location token (hybrid) ──────────────────────
/**
 * Resolve a usable token for a sub-account's CRM data:
 *   1) a pasted location PIT (OrgLocation.apiToken) — used directly, or
 *   2) a token minted from the agency OAuth connection (cached + refreshed).
 * Caller MUST have validated the location belongs to the org.
 */
export async function getLocationAccessToken(
  organizationId: string,
  ghlLocationId: string
): Promise<string | null> {
  const pit = await getLocationApiToken(organizationId, ghlLocationId);
  if (pit) return pit;
  return mintFromOAuth(organizationId, ghlLocationId);
}

async function mintFromOAuth(
  organizationId: string,
  ghlLocationId: string
): Promise<string | null> {
  const cached = await prisma.ghlLocationToken.findUnique({
    where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
  });
  if (cached) {
    if (!nearExpiry(cached.expiresAt)) return decryptSecret(cached.accessToken);
    if (cached.refreshToken) {
      try {
        const refreshed = await ghlRefreshAccessToken({
          refreshToken: decryptSecret(cached.refreshToken),
          userType: "Location",
          redirectUri: getGhlOAuthRedirectUri(),
        });
        await prisma.ghlLocationToken.update({
          where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
          data: {
            accessToken: encryptSecret(refreshed.access_token),
            refreshToken: encryptSecret(refreshed.refresh_token),
            expiresAt: new Date(Date.now() + (refreshed.expires_in || 0) * 1000),
            companyId: refreshed.companyId ?? cached.companyId,
          },
        });
        return refreshed.access_token;
      } catch {
        /* fall through to mint */
      }
    }
  }

  const agency = await getAgencyOAuthToken();
  if (!agency) return null; // No OAuth connection and no PIT — caller 400s.

  const token = await ghlGetLocationAccessTokenFromAgency({
    agencyAccessToken: agency.accessToken,
    companyId: agency.companyId,
    locationId: ghlLocationId,
  });
  await prisma.ghlLocationToken.upsert({
    where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
    create: {
      organizationId,
      ghlLocationId,
      accessToken: encryptSecret(token.access_token),
      refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : null,
      companyId: token.companyId || agency.companyId,
      expiresAt: new Date(Date.now() + (token.expires_in || 0) * 1000),
    },
    update: {
      accessToken: encryptSecret(token.access_token),
      refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : null,
      companyId: token.companyId || agency.companyId,
      expiresAt: new Date(Date.now() + (token.expires_in || 0) * 1000),
    },
  });
  return token.access_token;
}

/** After a live 401: refresh/re-mint the OAuth location token. PITs can't refresh. */
export async function forceRefreshLocationToken(
  organizationId: string,
  ghlLocationId: string
): Promise<string | null> {
  const pit = await getLocationApiToken(organizationId, ghlLocationId);
  if (pit) return null; // a PIT is static; nothing to refresh
  await prisma.ghlLocationToken
    .delete({ where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } } })
    .catch(() => {});
  return mintFromOAuth(organizationId, ghlLocationId).catch(() => null);
}

/** Disconnect the OAuth connection (clears minted-token cache too). */
export async function disconnectAgencyOAuth(): Promise<void> {
  await prisma.agencyConnection.deleteMany({ where: { id: AGENCY_ID } });
  await prisma.ghlLocationToken.deleteMany({});
}
