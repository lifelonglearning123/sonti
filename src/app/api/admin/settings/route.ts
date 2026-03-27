import { auth } from "@/lib/auth";
import { settingsQueries } from "@/lib/db";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

async function requireAdmin() {
  const session = await auth();
  const role = (session as any)?.role || (session?.user as any)?.role;
  if (role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const agencyToken = settingsQueries.get("agencyToken");
  const companyId = settingsQueries.get("companyId");
  const agencyName = settingsQueries.get("agencyName");

  return Response.json({
    hasToken: !!agencyToken,
    companyId: companyId || null,
    agencyName: agencyName || null,
  });
}

export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { agencyToken } = body;

  if (!agencyToken) {
    return Response.json({ error: "Agency token is required" }, { status: 400 });
  }

  // Verify the token by trying GHL endpoints
  try {
    const headers = {
      Authorization: `Bearer ${agencyToken}`,
      Version: "2021-07-28",
    };

    let companyId = "";
    let agencyName = "Agency";

    // Try /locations/search — works with both agency OAuth and private integration tokens
    const res = await fetch(`${GHL_BASE_URL}/locations/search?limit=1`, { headers });
    console.log("[Settings] /locations/search response:", res.status);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log("[Settings] Error body:", text.substring(0, 200));
      return Response.json({
        error: `Invalid token: GHL returned ${res.status}. Make sure this is an agency-level token with locations.readonly scope.`,
      }, { status: 400 });
    }

    const data = await res.json();
    const firstLoc = data.locations?.[0];
    companyId = firstLoc?.companyId || "";
    const locationCount = data.locations?.length || 0;
    agencyName = `Agency (${locationCount} location${locationCount !== 1 ? "s" : ""})`;

    // Try to get company name if we have a companyId
    if (companyId) {
      try {
        const compRes = await fetch(`${GHL_BASE_URL}/companies/${companyId}`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          agencyName = compData.company?.name || compData.name || agencyName;
        }
      } catch {}
    }

    // Store everything
    settingsQueries.set("agencyToken", agencyToken);
    if (companyId) settingsQueries.set("companyId", companyId);
    settingsQueries.set("agencyName", agencyName);

    return Response.json({
      success: true,
      companyId: companyId || "auto",
      agencyName,
    });
  } catch (error: any) {
    console.error("[Settings] GHL API error:", error?.message || error);
    return Response.json({ error: `Could not reach GHL API: ${error?.message || "unknown error"}` }, { status: 500 });
  }
}
