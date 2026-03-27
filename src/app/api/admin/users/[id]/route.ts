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
  const role = (session as any)?.role || (session?.user as any)?.role;
  if (role !== "admin") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = userQueries.findById(id);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

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

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.username) data.username = body.username;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);
  if (body.role) data.role = body.role;
  if (body.ghlLocationId !== undefined) data.ghlLocationId = body.ghlLocationId || null;
  if (body.ghlAccessToken !== undefined) data.ghlAccessToken = body.ghlAccessToken || null;

  // Verify GHL credentials if both are provided
  const locId = (data.ghlLocationId as string) || userQueries.findById(id)?.ghlLocationId;
  const token = (data.ghlAccessToken as string) || (body.ghlAccessToken === undefined ? userQueries.findById(id)?.ghlAccessToken : null);
  if (locId && token && (body.ghlLocationId || body.ghlAccessToken)) {
    const check = await verifyGhlToken(locId, token);
    if (!check.valid) {
      return Response.json({ error: `Invalid GHL credentials: ${check.error}` }, { status: 400 });
    }
  }

  const user = userQueries.update(id, data);
  return Response.json({ user: { id: user.id, username: user.username, role: user.role } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const adminCount = userQueries.countByRole("admin");
  const user = userQueries.findById(id);
  if (user?.role === "admin" && adminCount <= 1) {
    return Response.json({ error: "Cannot delete the last admin user" }, { status: 400 });
  }

  userQueries.delete(id);
  return Response.json({ success: true });
}
