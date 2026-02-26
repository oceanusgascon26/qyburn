# Project Qyburn — Autonomous Build Spec
# IT Self-Service Slack Bot + Admin Dashboard
# Feed this entire file to Claude Code for autonomous build

---

## PROJECT OVERVIEW

Build "Qyburn" — an AI-powered Slack bot for IT self-service at SAGA Diagnostics, plus a polished admin dashboard for configuration and monitoring.

**Two components:**
1. **Slack Bot** — Node.js Slack Bolt app (Socket Mode) that handles user requests via natural conversation and slash commands
2. **Admin Dashboard** — Next.js web app for IT admins to manage license catalog, restricted groups, onboarding templates, view audit logs, monitor bot activity, and configure the knowledge base

**Tech Stack:**
- Runtime: Node.js 20 + TypeScript (strict mode)
- Slack: @slack/bolt (Socket Mode — NO public endpoint needed)
- Admin UI: Next.js 14 (App Router) + Tailwind CSS
- Microsoft: @azure/identity + @microsoft/microsoft-graph-client
- AI: @anthropic-ai/sdk (Claude Sonnet for RAG)
- Database: PostgreSQL 16 + Prisma ORM + pgvector extension
- Hosting: AWS ECS Fargate
- CI/CD: GitHub Actions → ECR → ECS

---

## DESIGN SYSTEM (REUSE FROM SAGA CLEARANCE)
The admin dashboard MUST use the SAGA Diagnostics design language. This creates visual consistency across SAGA's internal tools.

### Colors (Tailwind config)
```
saga-50: #F0FAFA     saga-500: #1B7B8A (primary)
saga-100: #D4F0F0    saga-600: #176B78
saga-200: #A8E0E0    saga-700: #145F6B
saga-300: #72CBCB    saga-800: #0F4A53
saga-400: #4ABCBC    saga-900: #0A343B

Semantic: primary=#1B7B8A, accent=#E8603C, teal=#4ABCBC
Status: success=#16a34a, warning=#92400E, danger=#dc2626, info=#1d4ed8
Warm grays: warm-50=#FAFAF9 through warm-900=#1C1917
Background: saga-bg=#FAFAF9, border: saga-border=#D0E8E8
```

### Typography
- Font: DM Sans (primary), DM Mono (code/data)
- Import from Google Fonts
- Base size: 14px body, scale up for headings

### Component Patterns
- Cards: white bg, rounded-xl, shadow-sm, hover:shadow-md transition
- Buttons: rounded-lg, saga-500 primary, warm-100 secondary, saga-accent for destructive
- Tables: alternating warm-50/white rows, sticky headers, saga-500 header bg with white text
- Badges/Pills: rounded-full, light bg + darker text (e.g., saga-100 bg + saga-700 text)
- Empty states: centered icon + message + action button
- Loading: shimmer skeleton placeholders
- Sidebar: dark (saga-900) with white text, teal hover states
- Page layout: sidebar + main content area with breadcrumbs

### Quality Bar
The admin dashboard should feel like a premium SaaS product, not a dev tool. Think:
- Smooth transitions and micro-interactions
- Consistent spacing (4px grid, 8/12/16/24/32/48 scale)
- Proper loading and error states everywhere
- Toast notifications for actions
- Responsive (works on tablet for on-the-go IT admins)
- Keyboard navigation support
- Empty states with helpful CTAs