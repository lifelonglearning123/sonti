import { config } from "dotenv";
// Load .env.local first (takes precedence), then .env as fallback.
config({ path: ".env.local" });
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

// Prisma 7 generated client is CJS-friendly; require keeps tsx happy.
const { PrismaClient } = require("@prisma/client") as { PrismaClient: any };

/**
 * Bootstraps the first platform super-admin.
 * Creates a Supabase auth user (email confirmed) and a Profile with
 * platformRole = "superadmin". Idempotent: re-running won't duplicate.
 *
 * Env required: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL.
 */
async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const connectionString = process.env.DATABASE_URL;

  if (!email || !password) {
    throw new Error("SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required.");
  }
  if (!supabaseUrl || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing && existing.platformRole === "superadmin") {
      console.log(`Super-admin already exists: ${email}`);
      return;
    }

    // Find or create the Supabase auth user.
    let authUserId = existing?.id;
    if (!authUserId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !data.user) {
        // Possibly already exists in auth — look it up.
        const { data: list } = await supabase.auth.admin.listUsers();
        const found = list?.users.find((u) => u.email === email);
        if (!found) throw new Error(error?.message || "Failed to create auth user");
        authUserId = found.id;
      } else {
        authUserId = data.user.id;
      }
    }

    await prisma.profile.upsert({
      where: { id: authUserId },
      create: { id: authUserId, email, fullName: "Platform Admin", platformRole: "superadmin" },
      update: { platformRole: "superadmin" },
    });

    console.log(`Created super-admin: ${email}`);
    console.log("Sign in at /login, then open /superadmin.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[Seed] Error:", error);
  process.exitCode = 1;
});
