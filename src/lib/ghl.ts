const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const GHL_OAUTH_TOKEN_URL = `${GHL_BASE_URL}/oauth/token`;
const GHL_OAUTH_LOCATION_TOKEN_URL = `${GHL_BASE_URL}/oauth/locationToken`;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function getAppBaseUrl(): string {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) return nextAuthUrl.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  throw new Error("NEXTAUTH_URL is required");
}

export type GhlOAuthUserType = "Company" | "Location";

export type GhlOAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
  userType?: string;
  companyId?: string;
  locationId?: string;
  userId?: string;
  refreshTokenId?: string;
  traceId?: string;
  isBulkInstallation?: boolean;
};

export function getGhlOAuthRedirectUri(): string {
  const configured = process.env.GHL_OAUTH_REDIRECT_URI;
  if (configured) return configured;
  return `${getAppBaseUrl()}/api/ghl/oauth/callback`;
}

export function getGhlOAuthClient(): { clientId: string; clientSecret: string } {
  return {
    clientId: getRequiredEnv("GHL_OAUTH_CLIENT_ID"),
    clientSecret: getRequiredEnv("GHL_OAUTH_CLIENT_SECRET"),
  };
}

export async function ghlExchangeAuthorizationCode(params: {
  code: string;
  userType: GhlOAuthUserType;
  redirectUri?: string;
}): Promise<GhlOAuthTokenResponse> {
  const { clientId, clientSecret } = getGhlOAuthClient();
  const redirectUri = params.redirectUri || getGhlOAuthRedirectUri();

  const res = await fetch(GHL_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: params.code,
      user_type: params.userType,
      redirect_uri: redirectUri,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GHL token exchange failed (${res.status}): ${text.substring(0, 300)}`);
  }
  return JSON.parse(text) as GhlOAuthTokenResponse;
}

export async function ghlRefreshAccessToken(params: {
  refreshToken: string;
  userType: GhlOAuthUserType;
  redirectUri?: string;
}): Promise<GhlOAuthTokenResponse> {
  const { clientId, clientSecret } = getGhlOAuthClient();
  const redirectUri = params.redirectUri || getGhlOAuthRedirectUri();

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", params.refreshToken);
  body.set("user_type", params.userType);
  body.set("redirect_uri", redirectUri);

  const res = await fetch(GHL_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GHL token refresh failed (${res.status}): ${text.substring(0, 300)}`);
  }
  return JSON.parse(text) as GhlOAuthTokenResponse;
}

export async function ghlGetLocationAccessTokenFromAgency(params: {
  agencyAccessToken: string;
  companyId: string;
  locationId: string;
}): Promise<GhlOAuthTokenResponse> {
  const res = await fetch(GHL_OAUTH_LOCATION_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Version: GHL_VERSION,
      Authorization: `Bearer ${params.agencyAccessToken}`,
    },
    body: JSON.stringify({ companyId: params.companyId, locationId: params.locationId }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GHL location token failed (${res.status}): ${text.substring(0, 300)}`);
  }
  return JSON.parse(text) as GhlOAuthTokenResponse;
}
