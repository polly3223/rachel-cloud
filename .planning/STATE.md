# Project State: Rachel Cloud

## Project Reference
See: .planning/PROJECT.md (updated 2026-02-14)
**Core value:** A user can go from signup to talking to their own personal AI agent on Telegram in under 2 minutes
**Current focus:** Phase 6

## Current Phase
Phase: 6 — Health Monitoring & Auto-Recovery
Status: In Progress
Started: 2026-02-14

#### Plan 06-01: DB Schema + Health Check Service + Circuit Breaker
- Status: ✅ Complete
- Commits: 71862264, 8074dd4a
- Summary: .planning/phases/06-health-monitoring/06-01-SUMMARY.md

#### Plan 06-02: Auto-Recovery + Email Notifications
- Status: Pending

#### Plan 06-03: Dashboard Health Status
- Status: ✅ Complete
- Commits: 07d95f37, ac0e30ec
- Summary: .planning/phases/06-health-monitoring/06-03-SUMMARY.md

## Phase History

### Phase 5: Dashboard & User Controls ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 3/4 complete (05-01, 05-02, 05-03; 05-04 deferred)

## Phase History

### Phase 4: Landing Page & Public Launch ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 5/5 complete (04-01, 04-05, 04-02, 04-03, 04-04)

## Phase History

### Phase 3: VPS Provisioning & Deployment ✅
- Status: Complete
- Started: 2026-02-14
- Completed: 2026-02-14
- Plans: 4/4 complete (03-01, 03-02, 03-03, 03-04)

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

### Phase 3 Learnings
- Drizzle Kit generates auto-named migrations; Phase 2 tables were created via push without generate
- node:crypto generateKeyPairSync can output DER for SPKI public keys, requires manual conversion to OpenSSH format
- SSH key generation is synchronous (no async needed) using generateKeyPairSync
- Claude Code CLI is an npm package (@anthropic-ai/claude-code), installed via bun install -g
- Manual YAML construction avoids YAML library dependency while maintaining cloud-init compatibility
- SSH heredoc syntax (`<< 'EOF'`) prevents shell variable expansion in injected credentials
- Shared firewall reuse: create once by name, list to find existing before creating new
- provisionVPS runs fire-and-forget from API endpoint (void + .catch pattern)
- DB polling every 5s for cloud-init callback coordination (not 2s, reduces load)
- Svelte 5: @const tags only valid inside control flow blocks, use $derived() instead

### Phase 4 Learnings
- Tailwind v4 uses CSS-based config (@import "tailwindcss"), no tailwind.config.js needed
- @tailwindcss/vite plugin must be listed before sveltekit() in vite plugins array
- SvelteKit route groups (parenthesized dirs) share the root layout but have their own group layouts
- svelte-inview v4.0.4 supports Svelte 5 event syntax (oninview_enter) alongside legacy on:inview_enter
- CSS class-based scroll animations are preferred for prerendered pages (content stays in DOM for SEO)
- noscript style blocks in svelte:head ensure graceful degradation for no-JS users

### Phase 5 Learnings
- Admin route protection belongs in hooks.server.ts (runs before all load functions), not layouts
- Case-insensitive email comparison is critical for admin checks (RFC 5321)
- Defense-in-depth: check admin in both hooks.server.ts and layout.server.ts for robustness
- Use button elements (not div) for mobile overlay to avoid a11y warnings
- Server-side VPS status pre-load + client-side polling gives instant render with live updates
- $effect() cleanup functions are essential for interval management in Svelte 5
- $derived.by() for complex computed values that return objects (status color mapping)

## Key Decisions
- Server-side VPS status pre-load for instant dashboard render (no loading flash)
- Client-side polling for uptime (avoids SSH blocking page load)
- 30s status refresh, 10s opt-in log auto-refresh (balances freshness vs API load)
- Admin auth via ADMIN_EMAIL env var (single admin, case-insensitive email match)
- Admin route guard inline in hooks.server.ts (no sequence() helper needed)
- Route groups: (admin) for admin routes alongside (landing) and (app)
- Indigo/purple accent for admin layout to visually distinguish from blue user dashboard
- Polar checkout via REST endpoint /api/auth/checkout?slug=... (simpler than client method)
- Dashboard layout with sidebar nav (responsive mobile hamburger menu)
- Resend for transactional emails
- node-schedule for grace period deprovisioning jobs
- deprovisionVPS() implemented in Phase 3 Plan 04 (replaced Phase 2 stub)
- Shared firewall (rachel-cloud-ssh-only) reused across all user VPSs
- Provisioning status machine: pending -> creating -> cloud_init -> injecting_secrets -> ready | failed
- Tailwind v4 via @tailwindcss/vite (no CDN, no tailwind.config.js)
- Route groups: (landing) for public pages, (app) for authenticated pages
- Root layout is minimal (CSS import + slot); route groups own their layout wrappers

## Blockers
(None)
