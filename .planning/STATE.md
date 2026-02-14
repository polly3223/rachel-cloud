# Project State: Rachel Cloud

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-14)
**Core value:** A user can go from signup to talking to their own personal AI agent on Telegram in under 2 minutes
**Current focus:** Phase 8 (Complete)

## Current Phase
Phase: 8 — Polish & Gap Fixes
Status: Complete
Started: 2026-02-14
Completed: 2026-02-14

#### Phase 8 Changes
- ✅ Admin Users page (/admin/users) — searchable, filterable, expandable details
- ✅ Admin Revenue page (/admin/revenue) — MRR, ARR, unit economics, funnel, timeline
- ✅ Admin Infrastructure page (/admin/infrastructure) — VPS fleet, health, costs
- ✅ Fixed onboarding step 3 placeholder text (now shows real provisioning steps)
- ✅ Removed broken /dashboard/logs nav link
- ✅ Landing page redesigned (dark theme, gradient accents, correct GitHub links)
- ✅ Public rachel repo: replaced PCCI with local whisper.cpp
- ✅ Cloud-init updated with ffmpeg, build-essential, cmake for whisper

## Phase History

### Phase 7: Auto-Updates & Rollout System ✅

#### Plan 07-01: DB Schema + Update Engine
- Status: ✅ Complete
- Commits: 60c69206, 947aab6e
- Summary: .planning/phases/07-auto-updates/07-01-SUMMARY.md

#### Plan 07-02: Rollout Orchestrator + Admin UI
- Status: ✅ Complete
- Commits: bab6898a, 81e444a8
- Summary: .planning/phases/07-auto-updates/07-02-SUMMARY.md

## Phase History

### Phase 6: Health Monitoring & Auto-Recovery ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 3/3 complete (06-01, 06-02, 06-03)

### Phase 5: Dashboard & User Controls ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 3/4 complete (05-01, 05-02, 05-03; 05-04 deferred)

### Phase 4: Landing Page & Public Launch ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 5/5 complete (04-01, 04-05, 04-02, 04-03, 04-04)

### Phase 3: VPS Provisioning & Deployment ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 4/4 complete (03-01, 03-02, 03-03, 03-04)

### Phase 2: Billing & Onboarding ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 4/4 complete (02-01, 02-02, 02-03, 02-04)

### Phase 1: Authentication & User Foundation ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 3/3 complete (01-01, 01-02, 01-03)

## Key Learnings

### Phase 7 Learnings
- Existing subscriptions table works well for version tracking (no separate table needed)
- SSH timeouts for updates need to be much longer than health checks (120s vs 10s for bun install)
- Auto-rollback must include bun install to ensure deps match rolled-back code
- In-memory rollout state is simpler than DB persistence for single-server control plane
- Fire-and-forget pattern with status polling works well for long-running operations
- 30% failure threshold balances sensitivity with tolerance for gradual rollouts
- Fisher-Yates shuffle ensures unbiased canary group selection

### Phase 6 Learnings
- Circuit breaker pattern prevents infinite restart loops on permanently failing instances
- node-schedule cron jobs need sweep-in-progress guards to prevent overlapping sweeps
- Notification cooldowns prevent email spam during repeated failures

### Phase 5 Learnings
- Admin route protection belongs in hooks.server.ts (runs before all load functions)
- Case-insensitive email comparison is critical for admin checks (RFC 5321)
- Server-side VPS status pre-load + client-side polling gives instant render with live updates
- $effect() cleanup functions are essential for interval management in Svelte 5

### Phase 4 Learnings
- Tailwind v4 uses CSS-based config (@import "tailwindcss"), no tailwind.config.js needed
- SvelteKit route groups (parenthesized dirs) share the root layout but have their own group layouts

### Phase 3 Learnings
- SSH key generation is synchronous using generateKeyPairSync
- Manual YAML construction avoids YAML library dependency for cloud-init
- Shared firewall reuse: create once by name, list to find existing before creating new
- provisionVPS runs fire-and-forget from API endpoint (void + .catch pattern)

### Phase 2 Learnings
- @polar-sh/better-auth plugin handles customer creation, checkout, webhooks automatically
- Polar SDK cancel: use update({ cancelAtPeriodEnd: true }), not cancel()
- Grace period jobs must check subscription status before deprovisioning

### Phase 1 Learnings
- Better Auth has built-in Drizzle adapter (no separate package)
- AES-256-GCM encryption: 12-byte IV + separate auth tag

## Key Decisions
- Gradual rollout stages: 10% -> 50% -> 100% with 30% failure threshold
- In-memory rollout state (resets on restart, keeps it simple)
- 120s SSH timeout for bun install during updates
- Auto-rollback on any update failure (git checkout + bun install + restart)
- Admin updates page at /admin/updates with 3s auto-refresh during rollout
- Server-side VPS status pre-load for instant dashboard render
- Admin auth via ADMIN_EMAIL env var (single admin, case-insensitive email match)
- Route groups: (admin) for admin routes alongside (landing) and (app)
- Provisioning status machine: pending -> creating -> cloud_init -> injecting_secrets -> ready | failed
- Tailwind v4 via @tailwindcss/vite (no CDN, no tailwind.config.js)

## Blockers
(None)
