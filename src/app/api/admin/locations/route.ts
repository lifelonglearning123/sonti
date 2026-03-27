import { auth } from "@/lib/auth";
import { settingsQueries } from "@/lib/db";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

async function requireAdmin() {
  const session = await auth();
  const role = (session as any)?.role || (session?.user as any)?.role;
  if (role !== "admin") return null;
  return session;
}

function getAgencyHeaders() {
  const token = settingsQueries.get("agencyToken");
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

  const headers = getAgencyHeaders();
  if (!headers) {
    return Response.json({ error: "Agency token not configured. Go to Settings first." }, { status: 400 });
  }

  const companyId = settingsQueries.get("companyId");

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

    const data = await res.json();
    const locations = (data.locations || []).map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      email: loc.email || null,
      phone: loc.phone || null,
      address: loc.address || null,
      city: loc.city || null,
      country: loc.country || null,
    }));

    return Response.json({ locations });
  } catch (error) {
    return Response.json({ error: "Could not reach GHL API" }, { status: 500 });
  }
}

// Create a new sub-account (location) in GHL
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const headers = getAgencyHeaders();
  if (!headers) {
    return Response.json({ error: "Agency token not configured" }, { status: 400 });
  }

  const companyId = settingsQueries.get("companyId");

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

    return Response.json({
      location: {
        id: location.id,
        name: location.name,
        email: location.email,
      },
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Could not reach GHL API" }, { status: 500 });
  }
}
