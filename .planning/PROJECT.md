# Rachel Cloud

## What This Is

Managed hosting platform for Rachel — an open-source AI agent (built on Claude Code Agent SDK) that lives on a server and works for you 24/7 via Telegram. Users sign up, authenticate with their Claude account via OAuth, and get a dedicated server with Rachel running in ~90 seconds. Rachel Cloud handles all the infrastructure; users just chat on Telegram.

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

- Shared Telegram bot (routing complexity) — users create their own via BotFather
- Multiple pricing tiers — single $20/month plan, keep it simple
- Team/org support — single user per instance for now
- Mobile app — web dashboard + Telegram is enough
- Self-hosted support docs — Rachel8 repo README covers self-hosting
- Providing Claude API credits — users bring their own subscription (BYOK)

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
- **Auth**: Claude OAuth flow (no API key pasting) — users authenticate with their existing Claude/Anthropic account
- **Telegram**: Users create their own bot via BotFather — we don't manage a shared bot
- **Infrastructure**: Hetzner Cloud API for provisioning — cheapest reliable VPS provider
- **Open source**: Rachel8 repo must be clean and open-sourceable before launch — it's our marketing funnel
- **Budget**: Bootstrap / side project — minimize fixed costs, no paid ads initially

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dedicated VPS per user (not shared/containerized) | Security isolation, simplicity, Rachel8 designed for single-server, €3.49/mo is cheap enough | — Pending |
| Users bring own Claude subscription via OAuth | No AI cost margin pressure, users control spend, smoothest UX | — Pending |
| Users create own Telegram bot | Simpler architecture, user owns their bot, no message routing needed | — Pending |
| Single $20/month price | Simplicity, good margins (~75%), easy to communicate | — Pending |
| Open-source Rachel8 as marketing | Free distribution channel, builds trust, community contributions | — Pending |
| Claude OAuth 2.0 + PKCE for auth | No API key pasting, works with existing Claude subscriptions, best UX | — Pending |

---
*Last updated: 2026-02-14 after initialization*
