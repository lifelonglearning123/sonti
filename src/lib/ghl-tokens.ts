import "server-only";
import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import {
  ghlGetLocationAccessTokenFromAgency,
  ghlRefreshAccessToken,
  getGhlOAuthRedirectUri,
} from "@/lib/ghl";

const REFRESH_SKEW_MS = 60_000;

function nearExpiry(expiresAt: Date): boolean {
  return expiresAt.getTime() - Date.now() < REFRESH_SKEW_MS;
}

/** True if the given location belongs to the org. The tenant-isolation boundary. */
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

/**
 * Return a valid agency (Company) access token for the org, refreshing and
 * persisting if it is near expiry. Returns null if the org has no connection.
 */
export async function getValidAgencyToken(
  organizationId: string
): Promise<{ accessToken: string; companyId: string } | null> {
  const conn = await prisma.ghlConnection.findUnique({
    where: { organizationId },
  });
  if (!conn) return null;

  if (!nearExpiry(conn.expiresAt)) {
    return { accessToken: decryptSecret(conn.accessToken), companyId: conn.companyId };
  }

  // Refresh.
  try {
    const refreshed = await ghlRefreshAccessToken({
      refreshToken: decryptSecret(conn.refreshToken),
      userType: "Company",
      redirectUri: getGhlOAuthRedirectUri(),
    });
    const updated = await prisma.ghlConnection.update({
      where: { organizationId },
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
    // Fall back to the (possibly stale) stored token.
    return { accessToken: decryptSecret(conn.accessToken), companyId: conn.companyId };
  }
}

/**
 * Resolve a usable GHL Location access token for (org, location). Caller MUST
 * have already validated that the location belongs to the org.
 *
 * Order: cached token (fresh) -> refresh cached -> mint from agency token.
 */
export async function getLocationAccessToken(
  organizationId: string,
  ghlLocationId: string
): Promise<string> {
  const cached = await prisma.ghlLocationToken.findUnique({
    where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
  });

  if (cached) {
    if (!nearExpiry(cached.expiresAt)) {
      return decryptSecret(cached.accessToken);
    }
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
        // fall through to mint a fresh one from the agency token
      }
    }
  }

  return mintAndCacheLocationToken(organizationId, ghlLocationId);
}

/** Force a fresh location token (used after a live 401 from GHL). */
export async function forceRefreshLocationToken(
  organizationId: string,
  ghlLocationId: string
): Promise<string | null> {
  const cached = await prisma.ghlLocationToken.findUnique({
    where: { organizationId_ghlLocationId: { organizationId, ghlLocationId } },
  });
  if (cached?.refreshToken) {
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
      // fall through to mint
    }
  }
  return mintAndCacheLocationToken(organizationId, ghlLocationId).catch(() => null);
}

async function mintAndCacheLocationToken(
  organizationId: string,
  ghlLocationId: string
): Promise<string> {
  const agency = await getValidAgencyToken(organizationId);
  if (!agency) {
    throw new Error("GHL not connected for this organization");
  }

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
