# Sonti — Multi-Tenant SaaS Setup

Sonti is now a multi-tenant SaaS: each **Organization** (agency) is an isolated
tenant with its own members, GHL agency connection, and sub-account locations.
Auth is handled by **Supabase Auth**; data lives in **Supabase Postgres** via
Prisma; deploy on **Vercel**.

## 1. Create a Supabase project

1. Create a project at https://supabase.com.
2. Project Settings → API: copy the **Project URL**, **anon key**, and
   **service_role key**.
3. Project Settings → Database → Connection string:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL` (runtime, serverless).
   - **Direct connection** (port `5432`) → `DIRECT_URL` (migrations).
4. Authentication → Providers → enable **Email** (and **Google** for social login).
5. Authentication → URL Configuration → set the Site URL and add
   `https://YOUR-DOMAIN/auth/callback` (and `http://localhost:3001/auth/callback`)
   to the redirect allow-list.

## 2. Configure environment

Copy `.env.example` to `.env` (local) and set the same values in Vercel:

```
NEXTAUTH_URL=http://localhost:3001
TOKEN_ENCRYPTION_KEY=<openssl rand -base64 32>     # encrypts stored GHL tokens

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...pooler.supabase.com:5432/postgres

GHL_OAUTH_CLIENT_ID=...
GHL_OAUTH_CLIENT_SECRET=...
GHL_OAUTH_REDIRECT_URI=http://localhost:3001/api/ghl/oauth/callback

SUPERADMIN_EMAIL=you@example.com
SUPERADMIN_PASSWORD=<strong password>
```

## 3. Run migrations + seed the super-admin

```bash
npm install
npx prisma migrate dev --name init     # creates tables (uses DIRECT_URL)
npm run db:seed                          # bootstraps the platform super-admin
```

`db:seed` creates the Supabase auth user from `SUPERADMIN_EMAIL` /
`SUPERADMIN_PASSWORD` and marks its Profile as `superadmin`.

## 4. Run

```bash
npm run dev          # http://localhost:3001
```

## 5. Onboarding flow

1. Sign in at `/login` with the super-admin credentials.
2. Open **`/superadmin`** → create an Organization and enter the owner's email.
   The owner receives an invite email to set their password.
3. The owner signs in, opens **`/admin`**, and connects their GHL agency
   (OAuth, or a private integration token). Sub-accounts sync into the
   workspace automatically.
4. The owner invites members (by email) under **Members**, optionally scoping
   each to a location.
5. Members sign in and use the CRM. The **location switcher** in the top bar
   chooses which sub-account they're viewing.

## Deploying to Vercel

- Set all env vars above in the Vercel project.
- Add a build/release step that runs migrations against the **direct** URL:
  `npm run db:migrate` (`prisma migrate deploy`).
- The runtime uses the pooled `DATABASE_URL` (`?pgbouncer=true&connection_limit=1`).

## Tenant isolation

- Every GHL request resolves the org server-side from the session (Supabase) and
  validates the target location against the org's own `OrgLocation` rows before a
  token is minted. Client-supplied location IDs are never trusted.
- GHL access/refresh tokens are encrypted at rest with `TOKEN_ENCRYPTION_KEY`.
