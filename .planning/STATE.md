# Project State: Rachel Cloud

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-16)
**Core value:** A user can go from messaging Rachel on Telegram to having their own AI agent in under 2 minutes
**Current focus:** v3.0 Telegram-First & Cleanup

## Current Position

Phase: Phase 15 — Container Page Serving
Plan: In progress
Status: Building internal pages API, nginx proxy, and Rachel8 system prompt
Last activity: 2026-02-17 — Phase 15 added, building page serving infrastructure
Note: Phase 14 (Telegram Auth) was completed manually on 2026-02-17

## v1.0 Summary (Phases 1-8 Complete)
- Authentication (Better Auth, Claude OAuth, AES-256-GCM)
- Billing & Onboarding (Polar, Telegram bot validation)
- VPS Provisioning (Hetzner API, cloud-init, SSH)
- Landing Page (dark theme, i18n, SEO)
- Dashboard & Controls (admin + user)
- Health Monitoring (circuit breaker, auto-recovery)
- Auto-Updates (gradual rollout 10%→50%→100%)
- Polish & Gap Fixes

## v2.0 Summary (Phases 9-12 Complete)
- Dockerfile & Image Build
- LLM Proxy Server (rate limiting, usage tracking, Z.ai auth)
- Container Orchestrator (Docker API, health monitoring, rolling updates)
- Control Plane Integration (all admin/user pages rewired to Docker)

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

### v2.0 Phases (All Complete)
- Phase 9: Dockerfile & Image Build ✅
- Phase 10: LLM Proxy Server ✅
- Phase 11: Container Orchestrator ✅
- Phase 12: Control Plane Integration ✅

### v3.0 Phases
- Phase 13: Dead Code Cleanup — Not started
- Phase 14: Telegram-Only Authentication ✅ (completed manually 2026-02-17)
- Phase 15: Container Page Serving — In progress

## Key Learnings (Accumulated)
- Baileys WhatsApp: use startSock() recursion pattern, not complex abstraction
- Cloudflare quick tunnels conflict with named tunnel config
- Svelte + Cloudflare email obfuscation breaks hydration
- grammY onStart doesn't await async
- Docker containers provide good isolation for non-technical users
- Z.ai GLM pricing: Lite $9/mo, Pro $27/mo, Max $72/mo (quarterly) — no explicit device limits
- One Z.ai Max plan could serve 10-30 light users based on quota math
- Shared Telegram bot is simpler for users than BotFather setup
- Telegram user ID is a stable, permanent identifier — ideal as primary key

## Blockers
(None)
