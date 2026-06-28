import { NextRequest } from "next/server";
import { getAuthContext } from "@/lib/dal";
import {
  getLocationAccessToken,
  forceRefreshLocationToken,
  isLocationInOrg,
} from "@/lib/ghl-tokens";
import { resolveActiveLocationId } from "@/lib/active-location";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

// GHL API requires a trailing slash on certain root-level list endpoints.
const NEEDS_TRAILING_SLASH = ["calendars", "users", "workflows", "opportunities"];

/**
 * Resolve the GHL location this request targets, scoped to the caller's org.
 * Prefers an explicit locationId/location_id from the request (validated against
 * the org), otherwise the active-location cookie. Returns null on any violation.
 */
async function resolveOperativeLocation(
  req: NextRequest,
  organizationId: string,
  membershipLocationId: string | null
): Promise<string | null> {
  const requested =
    req.nextUrl.searchParams.get("locationId") ||
    req.nextUrl.searchParams.get("location_id") ||
    null;

  if (requested) {
    const allowed = await isLocationInOrg(organizationId, requested);
    return allowed ? requested : null;
  }

  return resolveActiveLocationId(organizationId, membershipLocationId);
}

async function proxyToGHL(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx || !ctx.organizationId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.organization && !ctx.organization.isActive) {
    return Response.json({ error: "Workspace is inactive" }, { status: 403 });
  }

  const organizationId = ctx.organizationId;
  const locationId = await resolveOperativeLocation(
    req,
    organizationId,
    ctx.membershipLocationId
  );
  if (!locationId) {
    return Response.json(
      { error: "No accessible location for this request" },
      { status: 403 }
    );
  }

  const accessToken = await getLocationAccessToken(organizationId, locationId).catch(
    () => null
  );
  if (!accessToken) {
    return Response.json(
      {
        error:
          "This sub-account isn't connected to GHL. Add its API token, or connect the agency via OAuth.",
      },
      { status: 400 }
    );
  }

  let pathSegments = req.nextUrl.pathname.replace("/api/ghl/", "");
  const baseSegment = pathSegments.split("/")[0].split("?")[0];
  if (
    NEEDS_TRAILING_SLASH.includes(baseSegment) &&
    !pathSegments.includes("/") &&
    !pathSegments.endsWith("/")
  ) {
    pathSegments += "/";
  }

  const url = new URL(`${GHL_BASE_URL}/${pathSegments}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const body = await req.text();
      if (body) fetchOptions.body = body;
    } catch {}
  }

  try {
    let response = await fetch(url.toString(), fetchOptions);

    // A minted (OAuth) token may have gone stale — refresh once and retry.
    // (No-op for pasted location PITs, which can't be refreshed.)
    if (response.status === 401) {
      const refreshed = await forceRefreshLocationToken(
        organizationId,
        locationId
      ).catch(() => null);
      if (refreshed) {
        headers["Authorization"] = `Bearer ${refreshed}`;
        response = await fetch(url.toString(), fetchOptions);
      }
    }

    const data = await response.text();
    if (!response.ok) {
      console.log(
        `[GHL Proxy] ${req.method} ${url.pathname} -> ${response.status}: ${data.substring(0, 300)}`
      );
    }
    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.log(`[GHL Proxy] ${req.method} ${url.pathname} -> FETCH ERROR:`, error);
    return Response.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}

export const GET = proxyToGHL;
export const POST = proxyToGHL;
export const PUT = proxyToGHL;
export const DELETE = proxyToGHL;
export const PATCH = proxyToGHL;
