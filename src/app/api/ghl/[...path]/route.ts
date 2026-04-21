import { auth } from "@/lib/auth";
import { userQueries } from "@/lib/db";
import { NextRequest } from "next/server";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

function getSessionAccessToken(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const s = session as Record<string, unknown>;
  const direct = s["accessToken"];
  if (typeof direct === "string" && direct) return direct;
  const user = s["user"];
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    const nested = u["accessToken"];
    if (typeof nested === "string" && nested) return nested;
  }
  return null;
}

function getSessionLocationId(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const s = session as Record<string, unknown>;
  const direct = s["locationId"];
  if (typeof direct === "string" && direct) return direct;
  const user = s["user"];
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    const nested = u["locationId"];
    if (typeof nested === "string" && nested) return nested;
  }
  return null;
}

async function proxyToGHL(req: NextRequest) {
  const session = await auth();
  let accessToken = getSessionAccessToken(session);
  if (!accessToken) {
    const locationId = getSessionLocationId(session);
    if (locationId) {
      const adminForLocation = await userQueries.findAdminWithTokenByLocationId(locationId);
      accessToken = adminForLocation?.ghlAccessToken || null;
    }
  }

  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pathSegments = req.nextUrl.pathname.replace("/api/ghl/", "");

  // GHL API requires trailing slash on certain root-level list endpoints
  const NEEDS_TRAILING_SLASH = ["calendars", "users", "workflows", "opportunities"];
  const baseSegment = pathSegments.split("/")[0].split("?")[0];
  if (NEEDS_TRAILING_SLASH.includes(baseSegment) && !pathSegments.includes("/") && !pathSegments.endsWith("/")) {
    pathSegments += "/";
  }

  const url = new URL(`${GHL_BASE_URL}/${pathSegments}`);

  // Forward query params
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const body = await req.text();
      if (body) fetchOptions.body = body;
    } catch {}
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.text();

    console.log(`[GHL Proxy] ${req.method} ${url.pathname} -> ${response.status}`);

    if (!response.ok) {
      console.log(`[GHL Proxy] Error body: ${data.substring(0, 500)}`);
    }

    return new Response(data, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
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
