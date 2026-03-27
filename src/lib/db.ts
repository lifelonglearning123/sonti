import Database from "better-sqlite3";
import path from "path";

// Resolve DB path relative to the project root
const dbPath = path.resolve(process.cwd(), "dev.db");

const globalForDb = globalThis as unknown as { db: Database.Database };

export const db = globalForDb.db || new Database(dbPath);

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

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

// User queries
export const userQueries = {
  findByUsername(username: string): DbUser | undefined {
    return db.prepare("SELECT * FROM User WHERE username = ?").get(username) as DbUser | undefined;
  },

  findById(id: string): DbUser | undefined {
    return db.prepare("SELECT * FROM User WHERE id = ?").get(id) as DbUser | undefined;
  },

  findAll(): DbUser[] {
    return db.prepare("SELECT * FROM User ORDER BY createdAt ASC").all() as DbUser[];
  },

  create(data: { id: string; username: string; passwordHash: string; role: string; ghlLocationId?: string | null; ghlAccessToken?: string | null }): DbUser {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO User (id, username, passwordHash, role, ghlLocationId, ghlAccessToken, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(data.id, data.username, data.passwordHash, data.role, data.ghlLocationId || null, data.ghlAccessToken || null, now, now);
    return this.findById(data.id)!;
  },

  update(id: string, data: Record<string, unknown>): DbUser {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    fields.push("updatedAt = ?");
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE User SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  },

  delete(id: string): void {
    db.prepare("DELETE FROM User WHERE id = ?").run(id);
  },

  countByRole(role: string): number {
    const row = db.prepare("SELECT COUNT(*) as count FROM User WHERE role = ?").get(role) as { count: number };
    return row.count;
  },
};

// Settings queries (key-value store)
export const settingsQueries = {
  get(key: string): string | undefined {
    const row = db.prepare("SELECT value FROM Settings WHERE key = ?").get(key) as { value: string } | undefined;
    return row?.value;
  },

  set(key: string, value: string): void {
    db.prepare("INSERT OR REPLACE INTO Settings (key, value) VALUES (?, ?)").run(key, value);
  },

  delete(key: string): void {
    db.prepare("DELETE FROM Settings WHERE key = ?").run(key);
  },
};
