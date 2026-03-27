import { auth } from "@/lib/auth";
import { userQueries } from "@/lib/db";
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
  const role = (session as any)?.role || (session?.user as any)?.role;
  if (role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const users = userQueries.findAll().map((u) => ({
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

  const existing = userQueries.findByUsername(username);
  if (existing) {
    return Response.json({ error: "Username already exists" }, { status: 409 });
  }

  // Verify GHL credentials if provided
  let locationName: string | undefined;
  if (ghlLocationId && ghlAccessToken) {
    const check = await verifyGhlToken(ghlLocationId, ghlAccessToken);
    if (!check.valid) {
      return Response.json({ error: `Invalid GHL credentials: ${check.error}` }, { status: 400 });
    }
    locationName = check.name;
  }

  const id = randomBytes(12).toString("hex");
  const passwordHash = await bcrypt.hash(password, 10);
  userQueries.create({
    id,
    username,
    passwordHash,
    role: role || "user",
    ghlLocationId: ghlLocationId || null,
    ghlAccessToken: ghlAccessToken || null,
  });

  return Response.json({ user: { id, username, role: role || "user", locationName } }, { status: 201 });
}
