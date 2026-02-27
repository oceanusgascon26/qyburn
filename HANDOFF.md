# Qyburn — Session Handoff
> Read this FIRST before doing anything. This is a project in active development.
> Last updated: 2026-02-26

---

## Who You're Working With
- **User:** Chris Gascon, SAGA Diagnostics
- **Role:** IT / Infrastructure, building internal tools
- **Project:** "Qyburn" — AI-powered IT self-service Slack bot + admin dashboard
- **Repo:** https://github.com/oceanusgascon26/qyburn
- **Local dev path:** `C:\Users\Suppo\Desktop\qyburn`
- **Dev server:** `http://localhost:3000`

---

## Current State: LOCAL DEV — WAVE 10 COMPLETE (STUB MODE)

The admin dashboard and bot are fully built through 10 waves. All external integrations
(Slack, Microsoft Graph, Anthropic Claude, Jira) use swappable stubs that auto-detect
real credentials. No production deployment yet — local dev only.

### Wave History

| Wave | Commit | What |
|------|--------|------|
| 1 | 911fb86 | Project scaffolding, Qyburn theme, core dashboard layout |
| 2 | 91eabe8 | Mock data layer and REST API routes |
| 3 | 6a035d5 | License Catalog — full CRUD UI with table, modals, search |
| 4 | 51f7f51 | Restricted Groups — approval workflow with pending requests |
| 5 | 935c99c | Onboarding Templates — visual step builder with timeline view |
| 6 | 65f9a4c | Audit Log — searchable event viewer with action/actor filters |
| 7 | 9a0c6fa | Knowledge Base — document manager with content preview and categories |
| 8 | 4c03b7f | Bot Activity — real-time monitor with conversations and performance metrics |
| 9 | d13b800 | Slack Bot — slash commands, conversation handler, Graph integration |
| 10 | 44c5b14 | Final polish — live data wiring, responsive sidebar, settings |
| — | 8ad2403 | Fix: NODE_ENV issue, dev server works with plain `npm run dev` |
| — | 59bfe09 | README with project overview, quick start, documentation |
| — | 77a954d | Auth, testing, analytics, notifications, Docker, CI/CD |

---

## What Qyburn Does

Two components:

1. **Admin Dashboard** (Next.js) — Web UI for IT admins to manage licenses, groups,
   onboarding templates, knowledge base, audit logs, bot activity, and settings.

2. **Slack Bot** (Node.js Bolt, Socket Mode) — Handles user self-service via slash
   commands and natural language: password resets, license requests, group access,
   onboarding, KB queries.

### Dashboard Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/dashboard` | Overview stats, request volume chart, license usage, recent activity, bot status |
| License Catalog | `/dashboard/licenses` | CRUD for software licenses with seat usage tracking |
| Restricted Groups | `/dashboard/groups` | Azure AD group management with approval workflows |
| Onboarding | `/dashboard/onboarding` | Step-by-step templates for new employee provisioning |
| Audit Log | `/dashboard/audit` | Filterable event log with CSV export |
| Knowledge Base | `/dashboard/knowledge` | Document management for RAG-powered IT answers |
| Bot Activity | `/dashboard/activity` | Conversation monitor with response time and breakdown charts |
| Settings | `/dashboard/settings` | Integration config for Slack, Azure AD, Anthropic |

### Bot Commands

| Command | Purpose |
|---------|---------|
| `/qyburn-help` | List all commands and capabilities |
| `/qyburn-license [name]` | Request a software license or list available |
| `/qyburn-groups [name]` | List restricted groups or request access |
| `/qyburn-status` | Check pending request status |
| Natural language DMs | General IT questions via Claude RAG |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Database | PostgreSQL 16 via Prisma ORM |
| Styling | Tailwind CSS (SAGA design system — teal/purple palette) |
| Auth | NextAuth.js — credentials provider (stub) or Azure AD SSO (production) |
| Slack | @slack/bolt (Socket Mode — no public endpoint needed) |
| Microsoft | @azure/identity + @microsoft/microsoft-graph-client |
| AI | @anthropic-ai/sdk (Claude for RAG) |
| Charts | Recharts |
| Toasts | Sonner |
| Testing | Vitest (unit), Playwright (E2E) |
| CI/CD | GitHub Actions (lint → typecheck → test → build → E2E → Docker) |
| Deploy | Docker (multi-stage) + docker-compose |
| Node | 20+ |

---

## Project Structure

```
qyburn/
├── HANDOFF.md                # THIS FILE — session context
├── BUILD_SPEC.md             # Original autonomous build spec (design system reference)
├── README.md                 # Project overview and setup guide
├── docker-compose.yml        # Full stack: dashboard + bot + PostgreSQL (port 5435)
├── Dockerfile                # Dashboard container (multi-stage)
├── Dockerfile.bot            # Bot container
├── .github/workflows/ci.yml  # GitHub Actions CI pipeline
├── prisma/
│   ├── schema.prisma         # 8 models: License, LicenseAssignment, RestrictedGroup,
│   │                         #   GroupAccessRequest, OnboardingTemplate, OnboardingStep,
│   │                         #   AuditLog, KnowledgeDocument, KnowledgeChunk, BotConfig
│   └── seed.ts               # Sample data: 5 licenses, 3 groups, 2 onboarding templates,
│                              #   5 audit logs, 3 knowledge docs
├── bot/
│   ├── index.ts              # Bot entry point (stub simulation mode)
│   ├── commands/
│   │   ├── help.ts           # /qyburn-help
│   │   ├── license.ts        # /qyburn-license
│   │   ├── groups.ts         # /qyburn-groups
│   │   └── status.ts         # /qyburn-status
│   └── handlers/
│       └── conversation.ts   # Natural language conversation handler
├── src/
│   ├── app/
│   │   ├── api/              # REST API routes
│   │   │   ├── audit/        # GET audit logs
│   │   │   ├── auth/         # NextAuth [...nextauth]
│   │   │   ├── dashboard/    # GET dashboard stats
│   │   │   ├── groups/       # CRUD groups + requests
│   │   │   ├── knowledge/    # CRUD knowledge docs
│   │   │   ├── licenses/     # CRUD licenses
│   │   │   ├── notifications/ # GET notifications
│   │   │   ├── onboarding/   # CRUD templates
│   │   │   └── sse/          # Server-Sent Events for real-time updates
│   │   ├── dashboard/        # Admin dashboard pages (8 pages)
│   │   └── login/            # Login page
│   ├── components/
│   │   ├── auth/             # AuthGuard
│   │   ├── charts/           # 4 Recharts components (request volume, license usage,
│   │   │                     #   response time, conversation breakdown)
│   │   ├── layout/           # Sidebar, Breadcrumbs
│   │   ├── providers/        # NextAuth SessionProvider
│   │   └── ui/               # Modal, ConfirmDialog, NotificationBell, UsageBar
│   └── lib/
│       ├── auth.ts           # NextAuth config (stub credentials or Azure AD SSO)
│       ├── db.ts             # Prisma client singleton
│       ├── mock-data.ts      # In-memory mock data for dashboard
│       ├── notifications.ts  # Notification helpers
│       ├── sse.ts            # Server-Sent Events manager
│       ├── use-sse.ts        # SSE React hook
│       ├── utils.ts          # General utilities
│       └── stubs/
│           ├── index.ts      # Unified client factory (auto-detects real vs stub)
│           ├── graph.ts      # Microsoft Graph stub (users, groups, licenses)
│           ├── slack.ts      # Slack stub (messages, users)
│           └── anthropic.ts  # Anthropic Claude stub (chat, embeddings)
├── tests/bot/                # 5 Vitest unit tests (help, license, groups, status, conversation)
└── e2e/                      # 5 Playwright E2E tests (dashboard, groups, licenses, nav, remaining)
```

---

## Integration Architecture — Swappable Stubs

All external integrations use a factory pattern in `src/lib/stubs/index.ts`. Each factory
checks environment variables — if real credentials are detected, it uses the real SDK client;
otherwise it falls back to an in-memory stub.

| Integration | Stub Class | Real Trigger | Capabilities |
|-------------|-----------|--------------|-------------|
| Microsoft Graph | `GraphStub` | `AZURE_CLIENT_ID` ≠ `stub-client-id` | Users, groups, license assignment |
| Slack | `SlackStub` | `SLACK_BOT_TOKEN` ≠ `xoxb-stub-token` | Messages, ephemeral, user lookup |
| Anthropic | `AnthropicStub` | `ANTHROPIC_API_KEY` ≠ `sk-ant-stub-key` | Chat (RAG), embeddings |

**To wire up real integrations:** Replace stub env vars with real credentials in `.env`.
The factory in `stubs/index.ts` currently has `// In production:` comments where the real
SDK imports should go — the factory returns the stub even with real creds detected (the
switch logic needs to be completed).

---

## Database Schema (Prisma)

| Model | Table | Purpose |
|-------|-------|---------|
| License | `licenses` | Software license catalog (seats, cost, auto-approve) |
| LicenseAssignment | `license_assignments` | User↔License assignments |
| RestrictedGroup | `restricted_groups` | Azure AD groups requiring approval |
| GroupAccessRequest | `group_access_requests` | Pending/approved/denied group requests |
| OnboardingTemplate | `onboarding_templates` | Department onboarding templates |
| OnboardingStep | `onboarding_steps` | Steps within templates (license, group, message, custom) |
| AuditLog | `audit_logs` | All actions logged (actor, action, target, details) |
| KnowledgeDocument | `knowledge_documents` | KB articles for RAG |
| KnowledgeChunk | `knowledge_chunks` | Chunked docs for vector search (pgvector ready, commented out) |
| BotConfig | `bot_config` | Key/value bot configuration |

---

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/dashboard | Dashboard overview stats |
| GET/POST | /api/licenses | List/create licenses |
| GET/PATCH/DELETE | /api/licenses/[id] | Single license CRUD |
| GET/POST | /api/groups | List/create restricted groups |
| GET/PATCH/DELETE | /api/groups/[id] | Single group CRUD |
| GET/POST | /api/groups/requests | List/create access requests |
| GET/POST | /api/onboarding | List/create templates |
| GET/PATCH/DELETE | /api/onboarding/[id] | Single template CRUD |
| GET | /api/audit | List audit logs (filterable) |
| GET/POST | /api/knowledge | List/create KB documents |
| GET/PATCH/DELETE | /api/knowledge/[id] | Single KB doc CRUD |
| GET | /api/notifications | List notifications |
| GET | /api/sse | Server-Sent Events stream |
| POST | /api/auth/[...nextauth] | NextAuth endpoints |

---

## Design System

The Qyburn admin dashboard uses the SAGA Diagnostics design language (defined in BUILD_SPEC.md):

| Element | Value |
|---------|-------|
| Primary color | `#1B7B8A` (saga-500 teal) |
| Accent | `#E8603C` (orange) |
| Font | DM Sans (primary), DM Mono (code) |
| Cards | white bg, rounded-xl, shadow-sm, hover:shadow-md |
| Sidebar | dark (saga-900), white text, teal hover |
| Tables | alternating warm-50/white rows, saga-500 header bg |
| Badges | rounded-full, light bg + darker text |
| Theme | Dark sidebar + light content (Qyburn purple + wildfire green accents) |

---

## Credentials & Tokens

### Local Dev Auth (stub mode)
| Email | Password | Role |
|-------|----------|------|
| admin@saga.com | admin | admin |
| Any other email | admin | viewer |

Password `password` also works in stub mode.

### Environment Variables (all stubs by default)

| Var | Stub Value | Real Value Source |
|-----|-----------|-------------------|
| DATABASE_URL | `postgresql://postgres:password@localhost:5435/qyburn` | — |
| SLACK_BOT_TOKEN | `xoxb-stub-token` | Slack app OAuth |
| SLACK_APP_TOKEN | `xapp-stub-token` | Slack app settings |
| SLACK_SIGNING_SECRET | `stub-signing-secret` | Slack app settings |
| AZURE_TENANT_ID | `stub-tenant-id` | Azure AD: `c3428529-c9e0-407d-987f-9058d2515845` |
| AZURE_CLIENT_ID | `stub-client-id` | Azure AD app registration |
| AZURE_CLIENT_SECRET | `stub-client-secret` | Azure AD app registration |
| ANTHROPIC_API_KEY | `sk-ant-stub-key` | Anthropic console |
| NEXTAUTH_URL | `http://localhost:3000` | — |
| NEXTAUTH_SECRET | `qyburn-dev-secret-change-in-prod` | — |

---

## Key Commands

```powershell
# Local development
cd C:\Users\Suppo\Desktop\qyburn
docker compose up -d db       # start postgres on port 5435
npx prisma db push            # sync schema to DB
npx tsx prisma/seed.ts         # seed sample data
npm run dev                    # start dashboard at http://localhost:3000

# Bot (stub simulation)
npm run bot                    # runs slash command + conversation simulation

# Database
npx prisma generate            # regenerate Prisma client
npx prisma db push             # push schema changes (dev only)

# Quality checks
npm run lint                   # ESLint
npx tsc --noEmit               # TypeScript check
npm test                       # Vitest unit tests
npx playwright test            # Playwright E2E tests
npm run build                  # production build

# Docker (full stack)
docker compose up -d           # dashboard + bot + postgres
```

---

## Port Map (all SAGA projects)

| Project | Port | Container |
|---------|------|-----------|
| Clearance (PA Worklist) | 5432 | pa_worklist_db |
| Clearance test DB | 5433 | pa_worklist_db_test |
| Tywin GRC | 5434 | tywin_grc_db |
| **Qyburn** | **5435** | **qyburn-db-1** |
| Next.js dev servers | 3000 | — |

---

## CI/CD Pipeline

**GitHub Actions** (`.github/workflows/ci.yml`):
1. `lint-typecheck` — ESLint + `tsc --noEmit`
2. `unit-tests` — Vitest
3. `build` — Prisma generate + Next.js production build (depends on 1+2)
4. `e2e-tests` — Playwright with Chromium (depends on 3)
5. `docker` — Build dashboard + bot Docker images (main branch only, depends on 3)

No AWS deployment pipeline yet — Docker images build but don't push to ECR.

---

## Pending Work — Integration Wiring

### Must Do (to go live)
- [ ] **Wire real Slack integration** — Create Slack app, get bot/app tokens, complete the factory switch in `stubs/index.ts` to return real `@slack/bolt` `App` instead of `SlackStub`
- [ ] **Wire real Microsoft Graph** — Azure AD app registration (tenant `c3428529-c9e0-407d-987f-9058d2515845`), complete factory switch to return real `@microsoft/microsoft-graph-client` `Client`
- [ ] **Wire real Anthropic** — Set `ANTHROPIC_API_KEY`, complete factory switch to return real `@anthropic-ai/sdk` client
- [ ] **SES email notifications** — SES is now approved. Wire password reset temp password delivery and approval alerts via SES
- [ ] **Bot Socket Mode** — Convert `bot/index.ts` from simulation loop to real `@slack/bolt` `App` with Socket Mode listeners

### Should Do
- [ ] **AWS deployment** — ECR repos, ECS Fargate task defs, buildspec for CodeBuild or extend GitHub Actions
- [ ] **Jira integration** — Ticket creation from bot (handler existed in earlier prototype at `C:\Users\Suppo\Desktop\slackbot/`)
- [ ] **pgvector for RAG** — KnowledgeChunk model has embedding column commented out, needs pgvector extension
- [ ] **Secrets Manager** — Move real credentials to AWS Secrets Manager for production
- [ ] **CLAUDE.md** — Create coding conventions doc (Clearance-style)

### Nice to Have
- [ ] **Password reset flow** — Full approval workflow (user request → admin approve → temp password DM)
- [ ] **DL management** — Add/remove from distribution lists via Graph API
- [ ] **Onboarding automation** — Execute onboarding template steps (currently display-only)
- [ ] **Notification emails** — SES delivery for approval requests, license assignments
- [ ] **Real-time bot activity** — SSE-powered live conversation feed from real Slack events

---

## Related Projects

| Project | Path | Relationship |
|---------|------|-------------|
| Clearance (PA Worklist) | `C:\Users\Suppo\Desktop\pa-appeals-worklist` | Sibling SAGA internal tool, same design language |
| Tywin GRC | `C:\Users\Suppo\Desktop\tywin-grc` | Sibling SAGA internal tool |
| CUDOS Dashboard | `C:\Users\Suppo\Desktop\SAGA` | AWS cost dashboard |
| SAGA Reports | `C:\Users\Suppo\Desktop\saga-reports` | Lambda email reports |

---

## How To Pick Up This Session

```
Read C:\Users\Suppo\Desktop\CONTEXT.md and C:\Users\Suppo\Desktop\qyburn\HANDOFF.md — then ask me what to work on.
```

Claude should:
1. Read `CONTEXT.md` for AWS/Confluence/GitHub credentials
2. Read this `HANDOFF.md` for Qyburn state and context
3. Run `git log --oneline -5` to confirm current state
4. Ask Chris what to work on next
