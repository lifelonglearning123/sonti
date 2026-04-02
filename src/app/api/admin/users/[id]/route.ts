import { auth } from "@/lib/auth";
import { userQueries } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";

async function verifyGhlToken(locationId: string, token: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${GHL_BASE_URL}/locations/${locationId}`, {
      headers: { Authorization: `Bearer ${token}`, Version: "2021-07-28" },
    });
    if (!res.ok) return { valid: false, error: `GHL returned ${res.status}` };
    return { valid: true };
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const adminLocationId = getSessionLocationId(session);
  const { id } = await params;
  const user = await userQueries.findById(id);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  if (adminLocationId && user.ghlLocationId !== adminLocationId) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      ghlLocationId: user.ghlLocationId,
      ghlAccessToken: user.ghlAccessToken,
      createdAt: user.createdAt,
    },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const adminLocationId = getSessionLocationId(session);
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.username) data.username = body.username;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
  if (body.role) data.role = body.role;
  if (body.ghlLocationId !== undefined) data.ghlLocationId = body.ghlLocationId || null;
  if (body.ghlAccessToken !== undefined) data.ghlAccessToken = body.ghlAccessToken || null;

  const existingUser = await userQueries.findById(id);
  if (!existingUser) return Response.json({ error: "User not found" }, { status: 404 });
  if (adminLocationId && existingUser.ghlLocationId !== adminLocationId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (adminLocationId && body.ghlLocationId !== undefined && body.ghlLocationId !== adminLocationId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify GHL credentials if both are provided
  const locId = (data.ghlLocationId as string) || existingUser.ghlLocationId;
  const token =
    (data.ghlAccessToken as string) ||
    (body.ghlAccessToken === undefined ? existingUser.ghlAccessToken : null);
  if (locId && token && (body.ghlLocationId || body.ghlAccessToken)) {
    const check = await verifyGhlToken(locId, token);
    if (!check.valid) {
      return Response.json({ error: `Invalid GHL credentials: ${check.error}` }, { status: 400 });
    }
  }

  const user = await userQueries.update(id, data);
  return Response.json({ user: { id: user.id, username: user.username, role: user.role } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const adminLocationId = getSessionLocationId(session);
  const { id } = await params;
  const user = await userQueries.findById(id);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  if (adminLocationId && user.ghlLocationId !== adminLocationId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminCount = adminLocationId
    ? await userQueries.countByRoleAndLocationId("admin", adminLocationId)
    : await userQueries.countByRole("admin");
  if (user?.role === "admin" && adminCount <= 1) {
    return Response.json({ error: "Cannot delete the last admin user" }, { status: 400 });
  }

  await userQueries.delete(id);
  return Response.json({ success: true });
}
