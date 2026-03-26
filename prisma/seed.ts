import "dotenv/config";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";

// Direct SQLite access for seeding (avoids Prisma ESM/CJS issues in scripts)
const dbPath = path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

// Check if admin exists
const existing = db.prepare("SELECT id FROM User WHERE role = 'admin'").get();
if (existing) {
  console.log("Admin user already exists.");
  process.exit(0);
}

const id = randomBytes(12).toString("hex");
const hash = bcrypt.hashSync("changeme123", 10);
const now = new Date().toISOString();

db.prepare(
  "INSERT INTO User (id, username, passwordHash, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
).run(id, "admin", hash, "admin", now, now);

console.log("Created admin user: admin");
console.log("Default password: changeme123");
console.log("IMPORTANT: Change this password after first login!");

db.close();
