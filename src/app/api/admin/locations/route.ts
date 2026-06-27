import { getOrgAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { getValidAgencyToken } from "@/lib/ghl-tokens";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Upsert the org's sub-accounts so they appear in the location switcher. */
async function syncOrgLocations(
  organizationId: string,
  locations: { id: string; name: string }[]
) {
  await Promise.all(
    locations.map((loc) =>
      prisma.orgLocation.upsert({
        where: {
          organizationId_ghlLocationId: { organizationId, ghlLocationId: loc.id },
        },
        create: { organizationId, ghlLocationId: loc.id, name: loc.name },
        update: { name: loc.name },
      })
    )
  );
}

// List all sub-accounts (locations) under the org's connected GHL agency.
export async function GET() {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const agency = await getValidAgencyToken(ctx.organizationId);
  if (!agency) {
    return Response.json(
      { error: "GHL is not connected. Connect your agency first." },
      { status: 400 }
    );
  }

  const headers = {
    Authorization: `Bearer ${agency.accessToken}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };

  try {
    let url = `${GHL_BASE_URL}/locations/search?limit=100`;
    if (agency.companyId && agency.companyId !== "auto") {
      url += `&companyId=${agency.companyId}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      console.log("[Locations API] GHL error:", res.status, text.substring(0, 200));
      return Response.json({ error: `GHL API error: ${res.status}` }, { status: res.status });
    }

    const data = (await res.json()) as { locations?: unknown };
    const rawLocations = Array.isArray(data.locations) ? data.locations : [];

    const locations = rawLocations
      .map((loc) => {
        if (!loc || typeof loc !== "object") return null;
        const r = loc as Record<string, unknown>;
        const id = asString(r.id);
        const name = asString(r.name);
        if (!id || !name) return null;
        return {
          id,
          name,
          email: asString(r.email),
          phone: asString(r.phone),
          address: asString(r.address),
          city: asString(r.city),
          country: asString(r.country),
        };
      })
      .filter((loc): loc is NonNullable<typeof loc> => !!loc);

    await syncOrgLocations(
      ctx.organizationId,
      locations.map((l) => ({ id: l.id, name: l.name }))
    );

    return Response.json({ locations });
  } catch {
    return Response.json({ error: "Could not reach GHL API" }, { status: 500 });
  }
}

// Create a new sub-account (location) in GHL and register it to the org.
export async function POST(req: Request) {
  const ctx = await getOrgAdminContext();
  if (!ctx?.organizationId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const agency = await getValidAgencyToken(ctx.organizationId);
  if (!agency) {
    return Response.json({ error: "GHL is not connected" }, { status: 400 });
  }

  const body = await req.json();
  const { name, email, phone, address, city, country } = body;
  if (!name) {
    return Response.json({ error: "Business name is required" }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${agency.accessToken}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };

  try {
    const payload: Record<string, string | undefined> = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      country: country || undefined,
    };
    if (agency.companyId && agency.companyId !== "auto") payload.companyId = agency.companyId;

    const res = await fetch(`${GHL_BASE_URL}/locations/`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log("[Locations API] Create error:", res.status, text.substring(0, 300));
      let message = `GHL API error: ${res.status}`;
      try {
        const err = JSON.parse(text);
        message = err.message || err.error || message;
      } catch {}
      return Response.json({ error: message }, { status: res.status });
    }

    const data = await res.json();
    const location = data.location || data;
    const id = asString(location.id);

    if (id) {
      await prisma.orgLocation.upsert({
        where: {
          organizationId_ghlLocationId: {
            organizationId: ctx.organizationId,
            ghlLocationId: id,
          },
        },
        create: { organizationId: ctx.organizationId, ghlLocationId: id, name: location.name || name },
        update: { name: location.name || name },
      });
    }

    return Response.json(
      { location: { id, name: location.name, email: location.email } },
      { status: 201 }
    );
  } catch {
    return Response.json({ error: "Could not reach GHL API" }, { status: 500 });
  }
}
