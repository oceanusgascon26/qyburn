# Qyburn

AI-powered IT self-service Slack bot and admin dashboard for SAGA Diagnostics.

Qyburn handles software license requests, Azure AD group access, password resets, VPN setup, knowledge base queries, and new employee onboarding — all through natural Slack conversations and slash commands.

## Components

**Admin Dashboard** — Next.js 14 web app for IT admins to manage the license catalog, restricted groups, onboarding templates, audit logs, knowledge base, and monitor bot activity.

**Slack Bot** — Node.js Slack Bolt app (Socket Mode) that handles user requests via natural conversation and slash commands (`/qyburn-help`, `/qyburn-license`, `/qyburn-groups`, `/qyburn-status`).

## Tech Stack

- **Runtime:** Node.js 20 + TypeScript (strict mode)
- **Dashboard:** Next.js 14 (App Router) + Tailwind CSS
- **Slack:** @slack/bolt (Socket Mode)
- **Microsoft:** @azure/identity + @microsoft/microsoft-graph-client
- **AI:** @anthropic-ai/sdk (Claude for RAG)
- **Database:** PostgreSQL 16 + Prisma ORM
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
```

All external APIs (Microsoft Graph, Slack, Anthropic) are stubbed — no credentials needed to run locally.

## Project Structure

```
qyburn/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── dashboard/        # Admin dashboard pages
│   │   └── api/              # REST API routes
│   ├── components/           # React components (layout, UI)
│   └── lib/                  # Utilities, mock data, API stubs
├── bot/
│   ├── commands/             # Slash command handlers
│   └── handlers/             # Conversation/message handlers
└── prisma/
    └── schema.prisma         # Database schema
```

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview stats, recent activity feed, bot status |
| **License Catalog** | CRUD management for software licenses with seat usage tracking |
| **Restricted Groups** | Azure AD group management with approval workflows |
| **Onboarding** | Step-by-step templates for new employee provisioning |
| **Audit Log** | Filterable event log of all bot and admin actions |
| **Knowledge Base** | Document management for RAG-powered IT answers |
| **Bot Activity** | Real-time conversation monitor with performance metrics |
| **Settings** | Integration config for Slack, Azure AD, and Anthropic |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/qyburn-help` | List all commands and capabilities |
| `/qyburn-license [name]` | Request a software license or list available licenses |
| `/qyburn-groups [name]` | List restricted groups or request access |
| `/qyburn-status` | Check pending request status |

The bot also responds to natural language DMs and @mentions for general IT questions.

## Scripts

```bash
npm run dev          # Start dashboard (development)
npm run build        # Production build
npm run start        # Start production server
npm run bot          # Run Slack bot (stub mode)
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
```

## License

Private — SAGA Diagnostics internal tool.
