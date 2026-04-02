require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { randomBytes } = require("crypto");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run prisma/seed.js");
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
}

main()
  .catch((error) => {
    console.error("[Seed] Error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
