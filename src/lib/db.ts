import { PrismaClient, type Prisma, type User as PrismaUser } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to use the database.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  return prisma;
}

// User type
export interface DbUser {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  ghlLocationId: string | null;
  ghlAccessToken: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDbUser(user: PrismaUser): DbUser {
  return {
    id: user.id,
    username: user.username,
    passwordHash: user.passwordHash,
    role: user.role,
    ghlLocationId: user.ghlLocationId,
    ghlAccessToken: user.ghlAccessToken,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const userQueries = {
  async findByUsername(username: string): Promise<DbUser | undefined> {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { username } });
    return user ? toDbUser(user) : undefined;
  },

  async findById(id: string): Promise<DbUser | undefined> {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toDbUser(user) : undefined;
  },

  async findAdminWithTokenByLocationId(ghlLocationId: string): Promise<DbUser | undefined> {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
      where: {
        role: "admin",
        ghlLocationId,
        ghlAccessToken: { not: null },
      },
      orderBy: { createdAt: "asc" },
    });
    return user ? toDbUser(user) : undefined;
  },

  async findAll(): Promise<DbUser[]> {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return users.map(toDbUser);
  },

  async findAllByLocationId(ghlLocationId: string): Promise<DbUser[]> {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: { ghlLocationId },
      orderBy: { createdAt: "asc" },
    });
    return users.map(toDbUser);
  },

  async create(data: {
    id: string;
    username: string;
    passwordHash: string;
    role: string;
    ghlLocationId?: string | null;
    ghlAccessToken?: string | null;
  }): Promise<DbUser> {
    const prisma = getPrisma();
    const user = await prisma.user.create({
      data: {
        id: data.id,
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role,
        ghlLocationId: data.ghlLocationId ?? null,
        ghlAccessToken: data.ghlAccessToken ?? null,
      },
    });
    return toDbUser(user);
  },

  async update(id: string, data: Record<string, unknown>): Promise<DbUser> {
    const prisma = getPrisma();
    const updateData: Prisma.UserUpdateInput = {};

    const username = data["username"];
    if (typeof username === "string") updateData.username = username;

    const passwordHash = data["passwordHash"];
    if (typeof passwordHash === "string") updateData.passwordHash = passwordHash;

    const role = data["role"];
    if (typeof role === "string") updateData.role = role;

    const ghlLocationId = data["ghlLocationId"];
    if (typeof ghlLocationId === "string" || ghlLocationId === null) updateData.ghlLocationId = ghlLocationId;

    const ghlAccessToken = data["ghlAccessToken"];
    if (typeof ghlAccessToken === "string" || ghlAccessToken === null) updateData.ghlAccessToken = ghlAccessToken;

    if (Object.keys(updateData).length === 0) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new Error("User not found");
      return toDbUser(user);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return toDbUser(user);
  },

  async delete(id: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.user.delete({ where: { id } });
  },

  async countByRole(role: string): Promise<number> {
    const prisma = getPrisma();
    return prisma.user.count({ where: { role } });
  },

  async countByRoleAndLocationId(role: string, ghlLocationId: string): Promise<number> {
    const prisma = getPrisma();
    return prisma.user.count({ where: { role, ghlLocationId } });
  },
};

export const settingsQueries = {
  async get(key: string): Promise<string | undefined> {
    const prisma = getPrisma();
    const row = await prisma.settings.findUnique({ where: { key } });
    return row?.value;
  },

  async set(key: string, value: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.settings.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  },

  async delete(key: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.settings.delete({ where: { key } });
  },
};
