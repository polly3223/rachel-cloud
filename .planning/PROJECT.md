# Rachel Cloud

## What This Is

Managed hosting platform for Rachel — an open-source AI agent (built on Claude Code Agent SDK) that lives on a server and works for you 24/7 via Telegram. Users message a shared Rachel Telegram bot, subscribe for $20/mo, and get their own isolated Docker container with Rachel running. No web signup, no Claude account needed. Rachel Cloud handles all the infrastructure; users just chat on Telegram.

## Core Value

A user can go from signup to talking to their own personal AI agent on Telegram in under 2 minutes, with zero technical setup.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Landing page that explains what Rachel is and converts visitors to signups
- [ ] User authentication (email/Google OAuth)
- [ ] Claude account OAuth flow — user clicks "Login with Claude", authorizes, tokens flow to their server
- [ ] Stripe payment integration — $20/month flat rate
- [ ] Auto-provisioning of dedicated Hetzner VPS per user via Hetzner Cloud API
- [ ] Cloud-init script that deploys Rachel8 on the provisioned server
- [ ] User creates their own Telegram bot via BotFather, enters token during onboarding
- [ ] Web dashboard showing server status, logs, restart button, settings
- [ ] Health monitoring — auto-detect and recover crashed Rachel instances
- [ ] Auto-updates — roll out new Rachel8 versions to all user servers

### Out of Scope

- Multiple pricing tiers — single $20/month plan, keep it simple
- Team/org support — single user per instance for now
- Mobile app — Telegram is the interface
- Self-hosted support docs — Rachel8 repo README covers self-hosting
- Web-based user dashboard — Telegram commands replace it
- Per-user Telegram bots — shared bot with routing is simpler for users

## Context

- Rachel8 is already running in production (this server) — proven, battle-tested
- Rachel8 repo: https://github.com/polly3223/Rachel8 — will be open-sourced as marketing
- Rachel Cloud repo: https://github.com/polly3223/rachel-cloud — this project
- Claude Code Agent SDK auth uses OAuth 2.0 + PKCE — open-source implementation exists at github.com/grll/claude-code-login
- Hetzner CX23 (2 vCPU, 4GB RAM, 40GB NVMe, 20TB traffic) costs €3.49/month — gives us ~75% margin at $20/month
- Target audience: anyone with a Claude subscription who wants a better interface via Telegram — not niche by profession, niche by behavior
- Rachel8 will be open-sourced to drive awareness — "try it yourself or let us host it"

## Constraints

- **Pricing**: $20/month flat, single tier — no complexity
- **Auth**: Telegram user ID — no web accounts, no passwords, no OAuth
- **Telegram**: Single shared Rachel bot — message routing to per-user containers
- **Infrastructure**: Docker containers on shared Hetzner server — €95/mo fixed cost
- **LLM**: Z.ai subscription shared across users via proxy — all-inclusive, no BYOK
- **Open source**: Rachel8 repo must be clean and open-sourceable before launch — it's our marketing funnel
- **Budget**: Bootstrap / side project — minimize fixed costs, no paid ads initially

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dedicated VPS per user (not shared/containerized) | Security isolation, simplicity, Rachel8 designed for single-server, €3.49/mo is cheap enough | ✅ v1.0 — replaced by Docker in v2.0 |
| Users bring own Claude subscription via OAuth | No AI cost margin pressure, users control spend, smoothest UX | ✅ v1.0 — replacing with shared Z.ai in v2.0 |
| Users create own Telegram bot | Simpler architecture, user owns their bot, no message routing needed | ✅ v1.0 — replacing with shared bot in v3.0 |
| Single $20/month price | Simplicity, good margins, easy to communicate | ✅ Shipped |
| Open-source Rachel8 as marketing | Free distribution channel, builds trust, community contributions | ✅ Shipped |
| Claude OAuth 2.0 + PKCE for auth | No API key pasting, works with existing Claude subscriptions, best UX | ✅ v1.0 — removing in v3.0, Telegram auth only |
| Telegram-only auth (v3.0) | Zero friction signup, no web accounts needed, Telegram ID = user ID | 🔄 In progress |
| Shared bot with message routing (v3.0) | Users don't need to create their own bot, simpler onboarding | 🔄 In progress |

## Current Milestone: v3.0 Telegram-First & Cleanup

**Goal:** Remove all dead VPS/Hetzner code, replace Better Auth with Telegram-only authentication, and switch to a shared bot model where all users message one Rachel bot.

**Target features:**
- Remove ~2,500 LOC of dead VPS/SSH/Hetzner code
- Single shared Rachel Telegram bot (no more per-user BotFather setup)
- Telegram user ID as primary key (no web accounts)
- Message routing: shared bot → user's container
- Telegram commands for user management (/status, /restart, /logs, /billing)
- Simplified landing page (CTA = "Message @RachelAI")
- Remove Better Auth, Claude OAuth, session management

**Previous milestones:**
- v1.0 (Phases 1-8): VPS-based, per-user Telegram bots, Better Auth + Claude OAuth ✅
- v2.0 (Phases 9-12): Docker containers, LLM proxy, orchestrator, control plane rewire ✅

---
*Last updated: 2026-02-16 — v3.0 Telegram-First & Cleanup milestone started*
