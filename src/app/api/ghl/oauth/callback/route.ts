import { getSuperAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { ghlExchangeAuthorizationCode, getGhlOAuthRedirectUri } from "@/lib/ghl";
import { NextRequest, NextResponse } from "next/server";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const AGENCY_ID = "singleton";

async function hydrateAgencyInfo(
  accessToken: string,
  fallbackCompanyId: string
): Promise<{ companyId: string; agencyName: string }> {
  const headers = { Authorization: `Bearer ${accessToken}`, Version: "2021-07-28" };
  let companyId = fallbackCompanyId;
  let agencyName = "Agency";
  try {
    const res = await fetch(`${GHL_BASE_URL}/locations/search?limit=1`, { headers });
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as {
        locations?: { companyId?: string }[];
      } | null;
      const firstLoc = data?.locations?.[0];
      if (typeof firstLoc?.companyId === "string") companyId = firstLoc.companyId;
    }
    if (companyId) {
      const compRes = await fetch(`${GHL_BASE_URL}/companies/${companyId}`, { headers });
      if (compRes.ok) {
        const compData = (await compRes.json().catch(() => null)) as {
          company?: { name?: string };
          name?: string;
        } | null;
        agencyName = compData?.company?.name || compData?.name || agencyName;
      }
    }
  } catch {}
  return { companyId, agencyName };
}

export async function GET(req: NextRequest) {
  const ctx = await getSuperAdminContext();
  if (!ctx) {
    return NextResponse.redirect(new URL("/superadmin?error=Forbidden", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get("ghl_oauth_state")?.value;
  const returnTo = req.cookies.get("ghl_oauth_return_to")?.value || "/superadmin";

  if (!code) return NextResponse.redirect(new URL(`${returnTo}?error=NoCode`, req.url));
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL(`${returnTo}?error=InvalidState`, req.url));
  }

  try {
    const token = await ghlExchangeAuthorizationCode({
      code,
      userType: "Company",
      redirectUri: getGhlOAuthRedirectUri(),
    });

    const expiresAt = new Date(Date.now() + (token.expires_in || 0) * 1000);
    const info = await hydrateAgencyInfo(token.access_token, token.companyId || "");

    await prisma.agencyConnection.upsert({
      where: { id: AGENCY_ID },
      create: {
        id: AGENCY_ID,
        companyId: info.companyId || token.companyId || "auto",
        agencyName: info.agencyName,
        accessToken: encryptSecret(token.access_token),
        refreshToken: encryptSecret(token.refresh_token),
        scope: token.scope ?? null,
        expiresAt,
      },
      update: {
        companyId: info.companyId || token.companyId || "auto",
        agencyName: info.agencyName,
        accessToken: encryptSecret(token.access_token),
        refreshToken: encryptSecret(token.refresh_token),
        scope: token.scope ?? null,
        expiresAt,
      },
    });

    const res = NextResponse.redirect(new URL(`${returnTo}?connected=1`, req.url));
    res.cookies.delete("ghl_oauth_state");
    res.cookies.delete("ghl_oauth_return_to");
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "TokenExchangeFailed";
    const res = NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(message)}`, req.url)
    );
    res.cookies.delete("ghl_oauth_state");
    res.cookies.delete("ghl_oauth_return_to");
    return res;
  }
}
