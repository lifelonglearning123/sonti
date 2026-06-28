import { getSuperAdminContext } from "@/lib/dal";
import { getGhlOAuthRedirectUri } from "@/lib/ghl";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function getScopes(): string {
  return (
    process.env.GHL_OAUTH_SCOPE ||
    [
      "locations.readonly",
      "locations.write",
      "companies.readonly",
      "contacts.readonly",
      "contacts.write",
      "conversations.readonly",
      "conversations.write",
      "opportunities.readonly",
      "opportunities.write",
      "calendars.readonly",
      "calendars.write",
      "calendars/events.readonly",
      "calendars/events.write",
      "users.readonly",
    ].join(" ")
  );
}

export async function GET(req: NextRequest) {
  const ctx = await getSuperAdminContext();
  if (!ctx) {
    return NextResponse.redirect(new URL("/superadmin?error=Forbidden", req.url));
  }

  const clientId = process.env.GHL_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/superadmin?error=MissingGhlClientId", req.url));
  }

  const authorizeUrl =
    process.env.GHL_OAUTH_AUTHORIZE_URL ||
    "https://marketplace.gohighlevel.com/oauth/chooselocation";

  const state = randomBytes(24).toString("hex");
  const url = new URL(authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", getGhlOAuthRedirectUri());
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", getScopes());
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
  res.cookies.set("ghl_oauth_state", state, cookieOpts);
  res.cookies.set("ghl_oauth_return_to", "/superadmin", cookieOpts);
  return res;
}
