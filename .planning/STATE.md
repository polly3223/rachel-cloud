# Project State: Rachel Cloud

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-16)
**Core value:** A user can go from signup to talking to their own personal AI agent on Telegram in under 2 minutes
**Current focus:** v2.0 Docker Multi-Tenant

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-02-16 — Milestone v2.0 Docker Multi-Tenant started

## v1.0 Summary (Phases 1-8 Complete)
- Authentication (Better Auth, Claude OAuth, AES-256-GCM)
- Billing & Onboarding (Polar, Telegram bot validation)
- VPS Provisioning (Hetzner API, cloud-init, SSH)
- Landing Page (dark theme, i18n, SEO)
- Dashboard & Controls (admin + user)
- Health Monitoring (circuit breaker, auto-recovery)
- Auto-Updates (gradual rollout 10%→50%→100%)
- Polish & Gap Fixes

## Phase History

### v1.0 Phases (All Complete)
- Phase 1: Authentication & User Foundation ✅
- Phase 2: Billing & Onboarding ✅
- Phase 3: VPS Provisioning & Deployment ✅
- Phase 4: Landing Page & Public Launch ✅
- Phase 5: Dashboard & User Controls ✅
- Phase 6: Health Monitoring & Auto-Recovery ✅
- Phase 7: Auto-Updates & Rollout System ✅
- Phase 8: Polish & Gap Fixes ✅

## Key Learnings (Accumulated)
- Baileys WhatsApp: use startSock() recursion pattern, not complex abstraction
- Cloudflare quick tunnels conflict with named tunnel config
- Svelte + Cloudflare email obfuscation breaks hydration
- grammY onStart doesn't await async
- Docker containers provide good isolation for non-technical users
- Z.ai GLM pricing: Lite $9/mo, Pro $27/mo, Max $72/mo (quarterly) — no explicit device limits
- One Z.ai Max plan could serve 10-30 light users based on quota math

## Blockers
(None)
