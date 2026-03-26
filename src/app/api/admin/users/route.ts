import { auth } from "@/lib/auth";
import { userQueries } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

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

  return Response.json({ user: { id, username, role: role || "user" } }, { status: 201 });
}
