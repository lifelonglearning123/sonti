import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

async function proxyToGHL(req: NextRequest) {
  const session = await auth();
  console.log("[GHL Proxy] Session:", JSON.stringify({
    hasSession: !!session,
    hasAccessToken: !!(session as any)?.accessToken,
    locationId: (session as any)?.locationId,
    tokenPreview: (session as any)?.accessToken?.substring(0, 10) + "...",
  }));

  if (!session || !(session as any).accessToken) {
    return Response.json({ error: "Unauthorized", debug: "No access token in session" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string;
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

    if (!response.ok) {
      console.log(`[GHL Proxy] ${req.method} ${url.toString()} -> ${response.status}: ${data.substring(0, 200)}`);
    }

    return new Response(data, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
    });
  } catch (error) {
    return Response.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}

export const GET = proxyToGHL;
export const POST = proxyToGHL;
export const PUT = proxyToGHL;
export const DELETE = proxyToGHL;
export const PATCH = proxyToGHL;
