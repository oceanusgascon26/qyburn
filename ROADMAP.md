# Qyburn — 3-Year Roadmap
## From IT Chatbot → Autonomous IT Operations Platform

---

## Year 1: Intelligent Assistant (2026)
**Theme: "Understand Everything"**

### Q2 2026 — Conversational Intelligence
- [ ] **Semantic intent classification** — replace regex patterns with Claude-powered intent detection using few-shot examples; handle ambiguous/compound requests ("I need Adobe and access to the Finance drive")
- [ ] **Multi-turn conversations** — Slack thread-based conversation state; bot remembers context within a thread ("What about the Pro version?" after discussing licenses)
- [ ] **Slot filling** — when a request is incomplete, bot asks follow-up questions to gather required fields (license name, justification, urgency) before submitting
- [ ] **Sentiment detection** — detect frustrated/urgent users ("I've been waiting 3 days!") and auto-escalate; track sentiment trends per user/department
- [ ] **Language handling** — detect Swedish/English and respond in the user's language (SAGA is Swedish-American company)

### Q3 2026 — Knowledge Engine
- [ ] **Vector RAG with pgvector** — embed all KB documents into vector store; semantic search replaces keyword matching; automatic re-indexing on document changes
- [ ] **Document ingestion pipeline** — auto-ingest from Confluence (SAGA's wiki), SharePoint, and uploaded PDFs; chunk, embed, index with source tracking
- [ ] **Citation engine** — every answer includes clickable source links ("Based on [VPN Setup Guide, Section 3]")
- [ ] **Knowledge gap detection** — when bot can't answer, log the question; weekly report of unanswered topics for IT to write articles about
- [ ] **Feedback loop** — thumbs up/down on bot responses; retrain relevance scoring based on user feedback; track answer quality over time

### Q4 2026 — Action Engine
- [ ] **Autonomous license provisioning** — bot calls Microsoft Graph API to directly assign/remove licenses (M365, Azure AD P2, Defender) without human intervention
- [ ] **Autonomous group management** — bot adds/removes users from Azure AD groups via Graph API for approved requests
- [ ] **Password reset orchestration** — guide user through self-service reset; verify identity via MFA challenge; log reset event
- [ ] **Onboarding automation** — when HR creates a new hire ticket, bot auto-provisions: AD account, M365 license, default groups, email, Teams channel invite
- [ ] **Offboarding automation** — reverse: disable account, revoke licenses, remove from groups, transfer mailbox, archive files

### Year 1 AI Milestones
- [ ] **Conversation analytics** — track: resolution rate, avg turns to resolve, intent distribution, escalation rate, user satisfaction
- [ ] **Model routing** — Haiku for simple FAQ answers, Sonnet for complex requests, Opus for ambiguous multi-step problems
- [ ] **Response caching** — cache common Q&A pairs (password policy, VPN setup) for instant responses without API calls
- [ ] **Prompt versioning** — track system prompt versions; A/B test different prompts; roll back if quality drops
- [ ] **Confidence calibration** — compare confidence scores to actual user satisfaction; adjust scoring weights monthly

---

## Year 2: Proactive Operations (2027)
**Theme: "Act Before They Ask"**

### Q1 2027 — Predictive IT
- [ ] **License usage analytics** — track actual usage of provisioned licenses (last login date via Graph API); flag unused licenses for reclamation
- [ ] **License cost optimization** — "You have 15 unused Adobe licenses ($1,245/month). Recommend reclaiming 10 and downgrading 3 to Standard"
- [ ] **Predictive provisioning** — based on department hiring patterns, pre-order licenses before new hires start
- [ ] **Anomaly detection** — flag unusual patterns: user requesting 5 licenses in one day, group access requests outside business hours, bulk permission changes
- [ ] **Churn prediction** — detect users likely to need help soon (new hires at day 3, users with 3+ failed login attempts, users who haven't activated MFA)

### Q2 2027 — Proactive Bot
- [ ] **Scheduled health checks** — bot proactively messages users: "Your MFA isn't set up yet — want me to walk you through it?"
- [ ] **License expiry warnings** — "Your JetBrains subscription expires in 7 days. Shall I request a renewal?"
- [ ] **Security nudges** — "Your password hasn't been changed in 180 days. Want to update it now?"
- [ ] **Onboarding check-ins** — bot messages new hires at Day 1, 7, 30: "How's your setup going? Need access to anything?"
- [ ] **SLA breach alerts** — proactively notify requesters when their request is approaching SLA deadline, with updated ETA

### Q3 2027 — Integration Hub
- [ ] **Jira Service Management** — bi-directional sync: bot creates Jira tickets for complex requests; syncs status back to Slack
- [ ] **ServiceNow connector** — same pattern for ServiceNow ITSM
- [ ] **Microsoft Intune** — query device compliance, push policies, check enrollment status via bot
- [ ] **Azure Monitor / Defender** — bot answers "Is my device compliant?" by querying Defender TVM
- [ ] **Confluence sync** — bi-directional: bot reads wiki for RAG, bot writes resolution articles back to Confluence

### Q4 2027 — Agentic Workflows
- [ ] **Multi-step agents** — bot executes complex workflows autonomously: "Onboard Anna → create AD account → assign M365 E5 → add to Engineering group → create Jira account → send welcome email → schedule 1:1 with manager"
- [ ] **Agent approval gates** — configurable: which steps require human approval vs auto-execute
- [ ] **Agent audit trail** — every step logged with reasoning, inputs, outputs, who approved
- [ ] **Rollback capability** — if onboarding fails midway, bot can reverse completed steps
- [ ] **Agent orchestration** — agents can trigger other agents: offboarding agent triggers license reclamation agent triggers cost report update

### Year 2 AI Milestones
- [ ] **Fine-tuned intent model** — train a lightweight classifier on SAGA's actual conversation data (replaces regex/Claude hybrid)
- [ ] **APEX memory v2** — long-term user profiles: "Anna always asks about VPN on Mondays (she works remote). Erik frequently requests Lab-Instruments access for new hires"
- [ ] **Explainable decisions** — every bot action includes reasoning: "Auto-approved because Engineering + JetBrains matches Rule #2 (priority 95)"
- [ ] **Multi-modal input** — user sends screenshot of error → bot analyzes image, identifies the issue, provides fix
- [ ] **Voice integration** — Teams/Zoom voice channel: "Hey Qyburn, I'm locked out" → speech-to-text → resolve → respond

---

## Year 3: Autonomous IT Platform (2028)
**Theme: "Run IT Without Humans"**

### Q1 2028 — Self-Healing Infrastructure
- [ ] **Automated remediation** — bot detects and fixes common issues without user asking: failed login → check account status → unlock if locked → notify user
- [ ] **Runbook automation** — IT runbooks (restart service, clear cache, rotate certificate) executable via bot: "Run the Exchange restart runbook"
- [ ] **Incident correlation** — when 5+ users report the same issue within 10 minutes, auto-create P1 incident, notify on-call, post status update to #it-status
- [ ] **Change management** — bot tracks scheduled changes, warns affected users, validates post-change health
- [ ] **Capacity planning** — analyze license/group/storage usage trends, forecast when capacity thresholds will be hit

### Q2 2028 — IT Intelligence Platform
- [ ] **Executive dashboard v2** — real-time IT ops dashboard: cost per user, resolution times, bot deflection rate, license utilization heatmap
- [ ] **Department analytics** — per-department IT spend, request volume, satisfaction scores, compliance rates
- [ ] **Cost allocation** — automatically allocate IT costs to departments based on actual usage (licenses, storage, compute)
- [ ] **Vendor management** — track software vendor contracts, renewal dates, negotiate alerts, usage vs. commitment
- [ ] **Custom report builder** — drag-and-drop IT metrics reports with scheduled email delivery

### Q3 2028 — Enterprise Scale
- [ ] **Multi-tenant** — single Qyburn instance serving multiple business units with data isolation
- [ ] **RBAC v2** — granular permissions: who can approve what, spending limits per role, delegation rules
- [ ] **Workflow marketplace** — pre-built workflow templates for common IT patterns (onboarding, offboarding, access review, license audit)
- [ ] **Plugin system** — third-party plugins for: password managers (1Password, LastPass), MDM (Jamf, Workspace ONE), SIEM (Splunk, Sentinel)
- [ ] **API platform** — public API for other internal tools to query Qyburn: "Does user X have license Y?" "What groups is user X in?"

### Q4 2028 — Autonomous Operations
- [ ] **90% deflection rate** — bot handles 9 out of 10 IT requests end-to-end without human intervention
- [ ] **Continuous compliance** — bot monitors Azure AD, M365, and Intune for compliance drift; auto-remediates or escalates
- [ ] **Access reviews** — quarterly automated access review: bot emails managers "Does Erik still need Finance-Sensitive group access?" with one-click approve/revoke
- [ ] **Shadow IT detection** — detect unauthorized SaaS usage via SSO logs and network traffic; flag and offer sanctioned alternatives
- [ ] **IT budget forecasting** — predict next quarter's IT spend based on hiring plans, license renewals, and historical patterns

### Year 3 AI Milestones
- [ ] **Autonomous task completion** — 80%+ of routine IT tasks completed without human touch
- [ ] **Cross-org learning** — federated learning across SAGA offices (Sweden, US, UK): models improve from aggregate patterns without sharing PII
- [ ] **Natural language everything** — "Set up the new Cambridge lab with 12 workstations, all with M365 E5, Defender, and Lab-Instruments access, ready by March 15th"
- [ ] **Digital twin** — simulate IT changes before executing: "What happens if we downgrade 50 users from E5 to E3?" → impact analysis with cost savings and feature loss
- [ ] **AI-generated runbooks** — bot writes and maintains IT runbooks based on how human agents resolve tickets, updating them as procedures change

---

## Technical Foundations (Continuous)

### Infrastructure
- [ ] **Kubernetes migration** — move bot + dashboard from ECS to EKS for autoscaling and multi-region
- [ ] **Event-driven architecture** — replace polling with EventBridge/Kafka: real-time updates across bot + dashboard + integrations
- [ ] **Redis caching** — sub-100ms response times for common queries; session storage for conversation state
- [ ] **Database scaling** — read replicas for analytics queries; connection pooling via PgBouncer
- [ ] **Observability** — OpenTelemetry tracing on every bot interaction; Prometheus metrics; Grafana dashboards; PagerDuty alerts

### Security & Compliance
- [ ] **SOC 2 readiness** — full audit trail, encrypted secrets, access controls, vendor management
- [ ] **GDPR compliance** — data retention policies, right to deletion, consent tracking, DPO audit support
- [ ] **Secret rotation** — automated rotation of API keys, bot tokens, and OAuth credentials with zero-downtime rollover
- [ ] **Pen testing** — quarterly security assessment of bot endpoints and admin dashboard
- [ ] **PII handling** — detect and redact PII in conversation logs; never store plaintext credentials

### Developer Experience
- [ ] **E2E testing** — Playwright test suite covering all dashboard pages + bot conversation flows (target: 80% coverage)
- [ ] **Bot conversation testing** — automated test harness: send mock messages → assert bot responses match expected patterns
- [ ] **Feature flags** — gradual rollout of new bot capabilities; A/B test different response strategies
- [ ] **Staging environment** — production-mirror staging with synthetic users for pre-deploy validation
- [ ] **SDK for custom commands** — developers can register new slash commands without touching core bot code

---

## Success Metrics (Year 3 Targets)

| Metric | Today | Year 1 | Year 2 | Year 3 |
|--------|-------|--------|--------|--------|
| Bot commands | 5 | 15 | 30 | 50+ |
| Intent categories | 8 | 20 | 40 | 60+ |
| KB articles indexed | 3 | 50 | 200 | 500+ |
| Avg response time | ~5s (stub) | <3s | <1.5s | <500ms |
| Resolution rate | 0% (stub) | 40% | 70% | 90% |
| Escalation rate | 100% | 30% | 15% | 5% |
| User satisfaction | N/A | 3.5/5 | 4.2/5 | 4.7/5 |
| Integrations | 3 (stub) | 8 | 15 | 25+ |
| Autonomous actions/day | 0 | 20 | 200 | 2,000+ |
| IT cost savings | $0 | $25K/yr | $150K/yr | $500K+/yr |
| Lines of code | ~8,500 | ~25K | ~60K | ~100K+ |

---

## The Vision

**Year 1:** Qyburn understands what people need and answers their questions accurately — with citations, confidence, and memory. IT staff spend less time on Tier 1 support.

**Year 2:** Qyburn acts before users ask — predicting needs, optimizing costs, and executing multi-step workflows autonomously. IT becomes proactive instead of reactive.

**Year 3:** Qyburn IS the IT operations layer — every employee interacts with IT through the bot. Humans handle strategy and exceptions. The bot handles everything else, 24/7, across every office.

*Built from Tyrion. Powered by Claude. Designed for zero-touch IT.*
