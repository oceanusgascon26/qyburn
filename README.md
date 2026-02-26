# Qyburn

AI-powered IT self-service Slack bot and admin dashboard for SAGA Diagnostics.

Qyburn handles software license requests, Azure AD group access, password resets, VPN setup, knowledge base queries, and new employee onboarding — all through natural Slack conversations and slash commands.

## Components

**Admin Dashboard** — Next.js 14 web app for IT admins to manage the license catalog, restricted groups, onboarding templates, audit logs, knowledge base, and monitor bot activity.

**Slack Bot** — Node.js Slack Bolt app (Socket Mode) that handles user requests via natural conversation and slash commands (`/qyburn-help`, `/qyburn-license`, `/qyburn-groups`, `/qyburn-status`).

## Tech Stack

- **Runtime:** Node.js 20 + TypeScript (strict mode)
- **Dashboard:** Next.js 14 (App Router) + Tailwind CSS + Recharts
- **Auth:** NextAuth.js with Azure AD SSO (credentials provider in stub mode)
- **Slack:** @slack/bolt (Socket Mode)
- **Microsoft:** @azure/identity + @microsoft/microsoft-graph-client
- **AI:** @anthropic-ai/sdk (Claude for RAG)
- **Database:** PostgreSQL 16 + Prisma ORM
- **Testing:** Vitest (unit) + Playwright (E2E)
- **CI/CD:** GitHub Actions
- **Deploy:** Docker + docker-compose
- **Theme:** Custom dark UI — Qyburn purple, wildfire green, silver

## Quick Start

```bash
# Install dependencies
npm install

# Run the admin dashboard
npm run dev
# → http://localhost:3000

# Run the Slack bot (stub simulation)
npm run bot

# Run unit tests
npm test

# Run E2E tests
npx playwright test
```

All external APIs (Microsoft Graph, Slack, Anthropic) are stubbed — no credentials needed to run locally.

**Login (stub mode):** Use any email with password `admin`.

## Docker

```bash
# Start all services (dashboard + bot + PostgreSQL)
docker-compose up -d

# Seed the database
docker-compose exec dashboard npx prisma db push
docker-compose exec dashboard npx tsx prisma/seed.ts
```

## Project Structure

```
qyburn/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── dashboard/        # Admin dashboard pages
│   │   ├── login/            # Auth login page
│   │   └── api/              # REST API routes + SSE + auth
│   ├── components/           # React components
│   │   ├── layout/           # Sidebar, Breadcrumbs
│   │   ├── ui/               # Modal, ConfirmDialog, UsageBar, NotificationBell
│   │   ├── charts/           # Recharts analytics components
│   │   ├── auth/             # AuthGuard
│   │   └── providers/        # SessionProvider
│   └── lib/                  # Utilities, mock data, API stubs, SSE, auth
├── bot/
│   ├── commands/             # Slash command handlers
│   └── handlers/             # Conversation/message handlers
├── tests/                    # Vitest unit tests
├── e2e/                      # Playwright E2E tests
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
├── .github/workflows/        # CI/CD pipeline
├── Dockerfile                # Dashboard container
├── Dockerfile.bot            # Bot container
└── docker-compose.yml        # Full stack orchestration
```

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview stats, request volume chart, license usage chart, recent activity feed, bot status |
| **License Catalog** | CRUD management for software licenses with seat usage tracking |
| **Restricted Groups** | Azure AD group management with approval workflows |
| **Onboarding** | Step-by-step templates for new employee provisioning |
| **Audit Log** | Filterable event log with CSV export |
| **Knowledge Base** | Document management for RAG-powered IT answers |
| **Bot Activity** | Conversation monitor with response time and breakdown charts |
| **Settings** | Integration config for Slack, Azure AD, and Anthropic |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/qyburn-help` | List all commands and capabilities |
| `/qyburn-license [name]` | Request a software license or list available licenses |
| `/qyburn-groups [name]` | List restricted groups or request access |
| `/qyburn-status` | Check pending request status |

The bot also responds to natural language DMs and @mentions for general IT questions.

## Features

- **Authentication** — NextAuth.js with credentials provider (stub) or Azure AD SSO
- **Role-based access** — Admin and Viewer roles
- **Real-time updates** — Server-Sent Events for live dashboard data
- **Notifications** — Bell icon with unread count for approval workflow events
- **Analytics** — Recharts for request volume, license usage, response time, and conversation breakdown
- **CSV Export** — Download filtered audit logs as CSV
- **Swappable stubs** — API clients auto-detect real credentials and switch from stub to live mode
- **Docker** — Multi-stage builds for dashboard and bot with PostgreSQL

## Scripts

```bash
npm run dev          # Start dashboard (development)
npm run build        # Production build
npm run start        # Start production server
npm run bot          # Run Slack bot (stub mode)
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
```

## License

Private — SAGA Diagnostics internal tool.
