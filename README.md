# Sonti CRM

> A modern, whitelabel-ready CRM frontend for [GoHighLevel](https://www.gohighlevel.com/) — build your own branded CRM without starting from scratch.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-BSL_1.1-orange)](#license)

---

## Why Sonti?

GoHighLevel is powerful but its UI isn't always what your clients want. Sonti gives you a **clean, modern CRM interface** that connects to GHL's API — your clients see your brand, not GoHighLevel.

- **Whitelabel-first** — No GHL branding anywhere. Your logo, your name, your product.
- **Admin controls everything** — Create users, link GHL sub-accounts, manage access. Users just log in with username/password.
- **Multi-channel messaging** — SMS, Email, WhatsApp, and internal notes in one conversation thread.
- **Modern stack** — Next.js 16, Tailwind v4, Radix UI, React Query. Fast, accessible, dark mode ready.

## Screenshots

| Dashboard | Conversations | Pipeline |
|-----------|--------------|----------|
| Stats, activity feed, quick actions | Multi-channel messaging with typing indicators | Kanban board with drag-and-drop deals |

## Features

- **Dashboard** — KPIs, recent contacts, upcoming appointments, activity feed
- **Contacts** — Search, filter, view/edit contact details, notes, tags
- **Conversations** — SMS, Email, WhatsApp, WhatsApp Bridge, internal comments
- **Pipeline** — Kanban board with deal cards, stage management, monetary values
- **Calendar** — Week/month views, appointment booking, event details
- **Admin Panel** — Standalone user management with GHL credential linking
- **Dark Mode** — Full dark mode across every page and component
- **Command Palette** — Cmd+K quick navigation
- **Keyboard Shortcuts** — Navigate with number keys, search with `/`

## Quick Start

```bash
# Clone the repo
git clone https://github.com/smiles9/sonti.git
cd sonti

# Install dependencies
npm install

# Set up the database (creates admin user)
npx tsx prisma/seed.ts

# Configure environment
cp .env.example .env.local
# Edit .env.local with your NEXTAUTH_SECRET

# Start the dev server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) and log in at `/admin` with `admin` / `changeme123`.

## How It Works

```
User logs in (/login)
    |
    v
NextAuth verifies username/password against SQLite DB
    |
    v
Session loaded with GHL token (linked by admin)
    |
    v
All API calls proxy through /api/ghl/* to GHL API
    |
    v
User sees clean CRM UI — no GHL references
```

**Admin flow:**
1. Admin logs in at `/admin`
2. Creates user accounts (username + password)
3. Links each user to a GHL Location ID + Private Integration Token
4. GHL credentials are validated against the API before saving
5. Users log in and see CRM data — they never touch GHL

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Auth | NextAuth.js v5 (credentials provider) |
| Database | SQLite via better-sqlite3 |
| Styling | Tailwind CSS v4 |
| UI | Radix UI primitives (shadcn/ui) |
| State | TanStack React Query |
| API | GoHighLevel API v2 (proxied) |

## Project Structure

```
src/
  app/
    (dashboard)/          # Dashboard pages (contacts, conversations, pipeline, calendar)
    admin/                # Standalone admin panel (not behind dashboard layout)
    login/                # Username/password login
    api/
      auth/               # NextAuth endpoints
      ghl/[...path]/      # GHL API proxy (auto-injects auth token)
      admin/users/        # Admin CRUD API
  components/
    layout/               # Sidebar, Topbar, Command Palette, Keyboard Shortcuts
    ui/                   # Reusable components (Button, Input, Dialog, Badge, etc.)
    contacts/             # Contact list, detail, filters, forms
    conversations/        # Message thread, conversation list, context panel
    pipeline/             # Pipeline board, deal cards, stage columns
    calendar/             # Week view, event cards, booking sheet
  hooks/                  # React Query hooks (contacts, conversations, calendar, admin)
  lib/
    auth.ts               # NextAuth config (credentials + session callbacks)
    db.ts                 # SQLite wrapper (user queries)
    utils.ts              # Helpers (formatDate, getInitials, cn, etc.)
  types/                  # TypeScript interfaces
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Base URL (e.g. `http://localhost:3001`) |

GHL credentials are stored per-user in the database, not in environment variables.

## Customization

### Branding

- **Logo:** Replace `public/logo.png` and `public/logo.svg`
- **Colors:** Edit CSS variables in `src/app/globals.css` (`:root` and `.dark` sections)
- **App name:** Update `src/app/layout.tsx` metadata and sidebar component
- **Login page:** Edit `src/app/login/page.tsx` — currently shows just "Smart CRM for modern teams"

### Adding pages

Follow the existing pattern in `src/app/(dashboard)/`. Each page uses React Query hooks from `src/hooks/` that call the GHL proxy.

## Contributing

Contributions are welcome for bug fixes and improvements. Please open an issue first to discuss significant changes.

## License

This project is licensed under the **Business Source License 1.1 (BSL 1.1)**.

- **Allowed:** Personal use, educational use, internal business use, contributing to this project
- **Not allowed:** Offering this software as a commercial hosted service, reselling, or redistributing for commercial purposes
- **Change date:** The license converts to Apache 2.0 after 4 years from each release

See [LICENSE](LICENSE) for the full text.

---

Built with Next.js, Tailwind CSS, and the GoHighLevel API.
