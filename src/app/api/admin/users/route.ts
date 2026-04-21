import { auth } from "@/lib/auth";
import { settingsQueries, userQueries } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

async function verifyGhlToken(locationId: string, token: string): Promise<{ valid: boolean; name?: string; error?: string }> {
  try {
    const res = await fetch(`${GHL_BASE_URL}/locations/${locationId}`, {
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28" },
    });
    if (!res.ok) return { valid: false, error: `GHL returned ${res.status}` };
    const data = await res.json();
    return { valid: true, name: data.location?.name || data.name };
  } catch {
    return { valid: false, error: "Could not reach GHL API" };
  }
}

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
  const raw = await settingsQueries.get(`childLocations:${adminLocationId}`);
  const children = parseLocationList(raw);
  return uniq([adminLocationId, ...children]);
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const allowed = await getAllowedLocationIds(session);
  const users = (await userQueries.findAll())
    .filter((u) => (allowed ? (u.ghlLocationId ? allowed.includes(u.ghlLocationId) : false) : true))
    .map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    ghlLocationId: u.ghlLocationId,
    hasToken: !!u.ghlAccessToken,
    createdAt: u.createdAt,
    }));

  return Response.json({ users });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { username, password, role, ghlLocationId, ghlAccessToken } = body;

  if (!username || !password) {
    return Response.json({ error: "Username and password are required" }, { status: 400 });
  }

  const effectiveLocationId = ghlLocationId || null;
  const allowed = await getAllowedLocationIds(session);
  if (allowed && effectiveLocationId && !allowed.includes(effectiveLocationId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await userQueries.findByUsername(username);
  if (existing) {
    return Response.json({ error: "Username already exists" }, { status: 409 });
  }

  // Verify GHL credentials if provided
  let locationName: string | undefined;
  if (ghlAccessToken && !effectiveLocationId) {
    return Response.json({ error: "ghlLocationId is required when providing ghlAccessToken" }, { status: 400 });
  }

  if (effectiveLocationId && ghlAccessToken) {
    const check = await verifyGhlToken(effectiveLocationId, ghlAccessToken);
    if (!check.valid) {
      return Response.json({ error: `Invalid GHL credentials: ${check.error}` }, { status: 400 });
    }
    locationName = check.name;
  }

  const id = randomBytes(12).toString("hex");
  const passwordHash = await bcrypt.hash(password, 10);
  await userQueries.create({
    id,
    username,
    passwordHash,
    role: role || "user",
    ghlLocationId: effectiveLocationId,
    ghlAccessToken: ghlAccessToken || null,
  });

  return Response.json({ user: { id, username, role: role || "user", locationName } }, { status: 201 });
}
