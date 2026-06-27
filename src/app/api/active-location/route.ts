import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/dal";
import { isLocationInOrg } from "@/lib/ghl-tokens";
import { ACTIVE_LOCATION_COOKIE } from "@/lib/active-location";

/** Set the active GHL location for the current user (validated against their org). */
export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx || !ctx.organizationId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const locationId = typeof body?.locationId === "string" ? body.locationId : "";
  if (!locationId) {
    return Response.json({ error: "locationId is required" }, { status: 400 });
  }

  const allowed = await isLocationInOrg(ctx.organizationId, locationId);
  if (!allowed) {
    return Response.json({ error: "Location not in your organization" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_LOCATION_COOKIE, locationId, {
    httpOnly: false, // read client-side for query keys; server still re-validates
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return Response.json({ success: true, activeLocationId: locationId });
}
