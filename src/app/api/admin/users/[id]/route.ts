import { auth } from "@/lib/auth";
import { userQueries } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

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
