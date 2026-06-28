# Sonti — Multi-Tenant SaaS Setup

Sonti is now a multi-tenant SaaS. One GHL **agency** is configured platform-wide
via an **agency Private Integration Token (PIT)** in env — the super-admin uses it
to create sub-accounts. Each **Organization** is an isolated tenant bound to one
GHL **sub-account**, with its own members and its own **location PIT** for CRM data.
Auth is handled by **Supabase Auth**; data lives in **Supabase Postgres** via
Prisma; deploy on **Vercel**.

> GHL note: an agency PIT can create/list sub-accounts but **cannot** read a
> sub-account's CRM data — GHL requires a location-scoped token for that. So each
> sub-account needs its own location PIT (created in that sub-account's GHL
> settings) pasted into Sonti.

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

# GHL agency Private Integration Token (creates/lists sub-accounts)
GHL_AGENCY_API_TOKEN=pit-...
GHL_COMPANY_ID=<agency/company id>

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
2. Connect the agency — pick **either** method (both can be set; OAuth wins):
   - **PIT:** set `GHL_AGENCY_API_TOKEN` + `GHL_COMPANY_ID` in `.env.local`.
   - **OAuth:** set `GHL_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI`, then in `/superadmin`
     click **Connect via OAuth**.

   `/superadmin` shows status for both methods and the active one.
3. In `/superadmin` → **New organization**. This:
   - creates a new **GHL sub-account** under the agency,
   - creates a workspace (Organization) bound to that sub-account,
   - invites the **owner/admin** by email (they set a password via the link),
   - optionally accepts that sub-account's **location PIT**.
4. Enable the sub-account's **CRM data**:
   - **OAuth mode:** nothing to do — a location token is minted automatically.
   - **PIT mode:** create a Private Integration *inside* that sub-account in GHL
     (**Settings → Private Integrations**), copy the token, and paste it at
     org-creation (step 3) or later via **`/admin`** → **GHL sub-account** card.
5. The owner opens **`/admin`** → **Members** to invite teammates by email. Every
   member is scoped to that workspace's sub-account.
6. Members sign in and use the CRM (dashboard, contacts, conversations, pipeline,
   calendar) for their sub-account.

> Each organization maps to exactly one GHL sub-account. Per sub-account, a pasted
> location PIT is used if present; otherwise a token is minted from the agency
> OAuth connection.

## Deploying to Vercel

- Set all env vars above in the Vercel project.
- Add a build/release step that runs migrations against the **direct** URL:
  `npm run db:migrate` (`prisma migrate deploy`).
- The runtime uses the pooled `DATABASE_URL` (`?pgbouncer=true&connection_limit=1`).

## Tenant isolation

- Every GHL request resolves the org server-side from the session (Supabase) and
  validates the target location against the org's own `OrgLocation` rows before its
  location PIT is used. Client-supplied location IDs are never trusted.
- The agency PIT (env) is used only for agency-level operations (create/list
  sub-accounts) and never exposed to tenants.
- Location PITs are encrypted at rest with `TOKEN_ENCRYPTION_KEY`.
