---
phase: 03-vps-provisioning
plan: 04
subsystem: provisioning
tags: [hetzner, ssh, cloud-init, svelte, orchestration, deprovisioning]

# Dependency graph
requires:
  - phase: 03-vps-provisioning (plans 01-03)
    provides: types, SSH keys, Hetzner client, cloud-init builder, SSH injector, callback endpoint
  - phase: 02-billing-onboarding
    provides: subscription manager, grace period enforcer stub, Telegram bot storage
  - phase: 01-authentication
    provides: Claude OAuth tokens, encryption utilities, requireAuth
provides:
  - provisionVPS orchestrator for end-to-end VPS provisioning
  - deprovisionVPS for Hetzner resource cleanup
  - Deploy button on dashboard with real-time provisioning progress
  - POST /api/provision/deploy endpoint
  - Grace period enforcer integrated with real deprovisioning
affects: [04-monitoring, 05-dashboard-features, 06-updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget async provisioning from API endpoint"
    - "DB polling for cross-process status coordination"
    - "Shared firewall reuse across all user VPSs"
    - "Idempotent deprovisioning with 404 tolerance"

key-files:
  created:
    - src/lib/provisioning/provision-vps.ts
    - src/lib/provisioning/deprovision-vps.ts
    - src/routes/api/provision/deploy/+server.ts
    - src/routes/dashboard/+page.svelte
    - src/routes/dashboard/+page.server.ts
  modified:
    - src/lib/provisioning/hetzner-client.ts
    - src/lib/provisioning/types.ts
    - src/lib/jobs/grace-period-enforcer.ts

key-decisions:
  - "Poll DB every 5s for cloud-init callback (not 2s, reduces DB load)"
  - "Shared firewall (rachel-cloud-ssh-only) reused across all VPSs instead of per-user"
  - "provisionVPS runs fire-and-forget from deploy endpoint (void + .catch)"
  - "Client polls every 3s for status updates during provisioning"
  - "listFirewalls added to HetznerClient for firewall reuse lookup"

patterns-established:
  - "Async background job pattern: endpoint returns 202, client polls for progress"
  - "Idempotent cleanup: handle 404 gracefully, always update DB even if API fails"
  - "Provisioning status state machine: pending -> creating -> cloud_init -> injecting_secrets -> ready | failed"

# Metrics
duration: 5min
completed: 2026-02-14
---

# Phase 3 Plan 04: Provisioning Orchestrator, Deprovisioning & Deploy UI Summary

**End-to-end VPS provisioning orchestrator with Deploy button, real-time progress UI, deprovisioning cleanup, and grace period enforcer integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-14T09:34:59Z
- **Completed:** 2026-02-14T09:40:13Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Full provisioning orchestrator that coordinates: token decryption, SSH key generation, Hetzner server creation, cloud-init polling, SSH secret injection, and finalization with 2-minute SLA tracking
- Idempotent deprovisioning that safely deletes Hetzner servers and SSH keys, integrated into Phase 2's grace period enforcer (stub replaced with real implementation)
- Dashboard Deploy button with real-time step-by-step progress indicators and error handling with retry

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement main provisioning orchestrator** - `f7f72d8` (feat)
2. **Task 2: Implement deprovisioning and replace stub** - `a87a1d7` (feat)
3. **Task 3: Add Deploy button and provisioning API endpoint** - `14267df` (feat)

## Files Created/Modified
- `src/lib/provisioning/provision-vps.ts` - Main orchestrator: 6-phase provisioning flow with cleanup on failure
- `src/lib/provisioning/deprovision-vps.ts` - VPS deletion: Hetzner server + SSH key cleanup, idempotent
- `src/routes/api/provision/deploy/+server.ts` - POST endpoint: validates subscription, fires provisionVPS in background
- `src/routes/dashboard/+page.svelte` - Dashboard overview with Deploy button, progress steps, error states
- `src/routes/dashboard/+page.server.ts` - Server load function for subscription data
- `src/lib/provisioning/hetzner-client.ts` - Added listFirewalls method for firewall reuse
- `src/lib/provisioning/types.ts` - Added ListFirewallsResponse type
- `src/lib/jobs/grace-period-enforcer.ts` - Replaced stub with real deprovisionVPS import

## Decisions Made
- Poll DB every 5 seconds (not 2) for cloud-init callback to reduce database load
- Shared firewall reused across all VPSs (created once, looked up by name)
- provisionVPS runs in background via `void provisionVPS(userId).catch(...)` pattern
- Client-side polling at 3-second intervals for status updates during provisioning
- Added listFirewalls to HetznerClient (needed for firewall reuse lookup)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added listFirewalls method to HetznerClient**
- **Found during:** Task 1 (Provisioning orchestrator)
- **Issue:** Plan references getOrCreateFirewall but HetznerClient had no method to list existing firewalls
- **Fix:** Added listFirewalls() method and ListFirewallsResponse type
- **Files modified:** src/lib/provisioning/hetzner-client.ts, src/lib/provisioning/types.ts
- **Verification:** TypeScript compilation passes, method available on client
- **Committed in:** f7f72d8 (Task 1 commit)

**2. [Rule 3 - Blocking] Dashboard route path adjustment**
- **Found during:** Task 3 (Deploy button)
- **Issue:** Plan references `src/routes/(authenticated)/dashboard/` but actual route is `src/routes/dashboard/`
- **Fix:** Created files at the correct `src/routes/dashboard/` path
- **Files modified:** src/routes/dashboard/+page.svelte, src/routes/dashboard/+page.server.ts
- **Verification:** Files created at correct path, svelte-check passes
- **Committed in:** 14267df (Task 3 commit)

**3. [Rule 1 - Bug] Fixed @const tag placement in Svelte component**
- **Found during:** Task 3 (Deploy button)
- **Issue:** Svelte 5 does not allow @const tags outside of control flow blocks
- **Fix:** Moved step tracking to $derived() variables in script section
- **Files modified:** src/routes/dashboard/+page.svelte
- **Verification:** svelte-check passes with no new errors
- **Committed in:** 14267df (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 VPS provisioning is complete: all 4 plans (schema, Hetzner client, cloud-init/SSH, orchestrator) are implemented
- End-to-end flow: user clicks Deploy -> VPS created -> cloud-init runs -> secrets injected -> Rachel8 running on Telegram
- Ready for Phase 4 (monitoring/health checks) or end-to-end integration testing

---
*Phase: 03-vps-provisioning*
*Completed: 2026-02-14*
