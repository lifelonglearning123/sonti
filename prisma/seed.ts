import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "crypto";

const { PrismaClient } = require("@prisma/client") as { PrismaClient: any };

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run prisma/seed.ts");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const existing = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } });
  if (existing) {
    console.log("Admin user already exists.");
    return;
  }

  const id = randomBytes(12).toString("hex");
  const passwordHash = bcrypt.hashSync("changeme123", 10);

  await prisma.user.create({
    data: {
      id,
      username: "admin",
      passwordHash,
      role: "admin",
    },
  });

  console.log("Created admin user: admin");
  console.log("Default password: changeme123");
  console.log("IMPORTANT: Change this password after first login!");
}

main()
  .catch((error) => {
    console.error("[Seed] Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
