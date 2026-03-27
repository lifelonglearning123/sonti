# Sonti

A whitelabeled CRM built on GoHighLevel (GHL) API. Users interact with a clean branded interface — no GHL branding or credentials are exposed.

## Features

- **Dashboard** — Overview with stats and quick actions
- **Contacts** — View, search, and manage contacts
- **Conversations** — Multi-channel messaging (SMS, Email, WhatsApp)
- **Pipeline** — Kanban-style deal management
- **Calendar** — Appointment scheduling
- **Dark Mode** — Full dark mode support
- **Admin Panel** — Standalone user management at `/admin`

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Auth:** NextAuth.js v5 with credentials provider
- **Database:** SQLite via better-sqlite3 (user accounts)
- **Styling:** Tailwind CSS v4 with custom dark mode
- **UI Components:** Radix UI primitives (shadcn/ui pattern)
- **State:** TanStack React Query
- **API:** GHL API proxy at `/api/ghl/[...path]`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
npx tsx prisma/seed.ts
```

Creates the SQLite database (`dev.db`) and seeds an admin user.

### 3. Configure environment

Ensure `.env.local` has:

```
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3001
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Authentication

### User Login (`/login`)

Simple username/password login. No GHL branding — just "Smart CRM for modern teams".

### Admin Panel (`/admin`)

Standalone admin page. Default credentials:

- **Username:** `admin`
- **Password:** `changeme123`

Admin can:
- Create/edit/delete user accounts
- Link GHL credentials (Location ID + API Token) per user
- GHL tokens are validated against the API before saving
- Users never see any GHL references

### Whitelabel Design

- Login page: No logo, no brand name — just the tagline
- Dashboard: Sonti branding (orange/red theme)
- Admin panel: Neutral gray theme with shield icon
- All GHL references hidden from end users

## Project Structure

```
src/
  app/
    (dashboard)/        # Protected dashboard pages
    admin/              # Standalone admin panel
    login/              # User login page
    api/
      auth/             # NextAuth endpoints
      ghl/[...path]/    # GHL API proxy
      admin/users/      # Admin CRUD API
  components/
    layout/             # Sidebar, Topbar
    ui/                 # Reusable UI components
    contacts/           # Contact components
    conversations/      # Messaging components
    pipeline/           # Pipeline components
    calendar/           # Calendar components
  hooks/                # React Query hooks
  lib/
    auth.ts             # NextAuth configuration
    db.ts               # SQLite database
    utils.ts            # Utilities
  types/                # TypeScript types
```

## Relationship to PipeFlow

Sonti is a whitelabeled version of [PipeFlow](https://github.com/smiles9/pipeflow). Key differences:
- Different branding (Sonti vs PipeFlow)
- No logo or brand on login page
- Runs on port 3001 (PipeFlow on 3000)
- Same admin system and GHL integration
