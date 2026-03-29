const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { randomBytes } = require("crypto");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "dev.db");
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    ghlLocationId TEXT,
    ghlAccessToken TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS Settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const existing = db.prepare("SELECT id FROM User WHERE role = 'admin'").get();
if (existing) {
  console.log("Admin user already exists.");
  db.close();
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

db.close();
