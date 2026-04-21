import { auth } from "@/lib/auth";
import { settingsQueries } from "@/lib/db";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

async function requireAdmin() {
  const session = await auth();
  const role = getSessionRole(session);
  if (role !== "admin") return null;
  return session;
}

function getSessionRole(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const s = session as Record<string, unknown>;

  const direct = s["role"];
  if (typeof direct === "string") return direct;

  const user = s["user"];
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    const nested = u["role"];
    if (typeof nested === "string") return nested;
  }

  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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

function parseLocationList(raw: string | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function getAllowedLocationIds(session: unknown) {
  const adminLocationId = getSessionLocationId(session);
  if (!adminLocationId) return null;

  const key = `childLocations:${adminLocationId}`;
  const raw = await settingsQueries.get(key);
  const children = parseLocationList(raw);
  return uniq([adminLocationId, ...children]);
}

async function getAgencyHeaders() {
  const token = await settingsQueries.get("agencyToken");
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

// List all sub-accounts (locations) from GHL agency
export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const headers = await getAgencyHeaders();
  if (!headers) {
    return Response.json({ error: "Agency token not configured. Go to Settings first." }, { status: 400 });
  }

  const companyId = await settingsQueries.get("companyId");

  try {
    let url = `${GHL_BASE_URL}/locations/search?limit=100`;
    if (companyId && companyId !== "auto") {
      url += `&companyId=${companyId}`;
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
      .filter((loc): loc is NonNullable<typeof loc> => !!loc)
      .filter((loc) => !!loc);

    const allowed = await getAllowedLocationIds(session);
    const filtered = allowed ? locations.filter((l) => allowed.includes(l.id)) : locations;

    return Response.json({ locations: filtered });
  } catch {
    return Response.json({ error: "Could not reach GHL API" }, { status: 500 });
  }
}

// Create a new sub-account (location) in GHL
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const headers = await getAgencyHeaders();
  if (!headers) {
    return Response.json({ error: "Agency token not configured" }, { status: 400 });
  }

  const companyId = await settingsQueries.get("companyId");

  const body = await req.json();
  const { name, email, phone, address, city, country } = body;

  if (!name) {
    return Response.json({ error: "Business name is required" }, { status: 400 });
  }

  try {
    const payload: Record<string, string | undefined> = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      city: city || undefined,
      country: country || undefined,
    };
    if (companyId && companyId !== "auto") payload.companyId = companyId;

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

    const adminLocationId = getSessionLocationId(session);
    if (adminLocationId) {
      const key = `childLocations:${adminLocationId}`;
      const raw = await settingsQueries.get(key);
      const current = parseLocationList(raw);
      const idValue = typeof location.id === "string" ? location.id : "";
      const next = uniq([...current, idValue]);
      await settingsQueries.set(key, JSON.stringify(next));
    }

    return Response.json({
      location: {
        id: location.id,
        name: location.name,
        email: location.email,
      },
    }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not reach GHL API" }, { status: 500 });
  }
}
