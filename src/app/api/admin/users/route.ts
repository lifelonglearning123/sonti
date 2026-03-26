import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.role || session.role !== "admin") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      ghlLocationId: true,
      ghlAccessToken: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Mask tokens in list view
  const masked = users.map((u) => ({
    ...u,
    hasToken: !!u.ghlAccessToken,
    ghlAccessToken: undefined,
  }));

  return Response.json({ users: masked });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { username, password, role, ghlLocationId, ghlAccessToken } = body;

  if (!username || !password) {
    return Response.json({ error: "Username and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return Response.json({ error: "Username already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: role || "user",
      ghlLocationId: ghlLocationId || null,
      ghlAccessToken: ghlAccessToken || null,
    },
    select: { id: true, username: true, role: true },
  });

  return Response.json({ user }, { status: 201 });
}
