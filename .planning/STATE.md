# Project State: Rachel Cloud

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-14)
**Core value:** A user can go from signup to talking to their own personal AI agent on Telegram in under 2 minutes
**Current focus:** Phase 3

## Current Phase
Phase: 3 — VPS Provisioning & Deployment
Status: Not started
Started: —
Completed: —

## Phase History

### Phase 1: Authentication & User Foundation ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 3/3 complete (01-01, 01-02, 01-03)

### Phase 2: Billing & Onboarding ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14

#### Plan 02-01: DB Schema + Polar SDK + Better Auth Plugin
- Status: ✅ Complete
- Commits: 13b7702, 48b2b48, 2f91f3b
- Summary: .planning/phases/02-billing-onboarding/02-01-SUMMARY.md

#### Plan 02-02: Webhooks + Grace Period + Email Notifications
- Status: ✅ Complete
- Commits: 7297b32, daac7e3, b12b71b
- Summary: .planning/phases/02-billing-onboarding/02-02-SUMMARY.md

#### Plan 02-03: Telegram Onboarding + Bot Validation
- Status: ✅ Complete
- Commits: d633fea, 227432a, 50ec65e
- Summary: .planning/phases/02-billing-onboarding/02-03-SUMMARY.md

#### Plan 02-04: Billing Dashboard + Subscription Management
- Status: ✅ Complete
- Commits: 4ba608a, cffd268, 865c64d, 50fd145
- Summary: .planning/phases/02-billing-onboarding/02-04-SUMMARY.md

## Key Learnings

### Phase 1 Learnings
- Better Auth has built-in Drizzle adapter (no separate package)
- Bun requires @libsql/client for Drizzle Kit
- AES-256-GCM encryption: 12-byte IV + separate auth tag
- Claude OAuth endpoints are placeholder (need real endpoints later)

### Phase 2 Learnings
- @polar-sh/better-auth plugin handles customer creation, checkout, webhooks automatically
- Better Auth frontend: import from 'better-auth/svelte' (not svelte-client)
- Polar plugin provides server endpoints, not client-side methods — use fetch to /api/auth/customer/portal
- onPaymentFailed handler not available in @polar-sh/better-auth — use onOrderUpdated instead
- Polar SDK cancel: use update({ cancelAtPeriodEnd: true }), not cancel()
- Webhook payloads have customerId, not userId — need DB lookup via polarCustomerId
- Grace period jobs must check subscription status before deprovisioning (prevent data loss on uncanceled)

## Key Decisions
- Polar checkout via REST endpoint /api/auth/checkout?slug=... (simpler than client method)
- Dashboard layout with sidebar nav (responsive mobile hamburger menu)
- Resend for transactional emails
- node-schedule for grace period deprovisioning jobs
- deprovisionVPS() stubbed for Phase 3

## Blockers
(None)
