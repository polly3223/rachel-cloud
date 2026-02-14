---
phase: 07-auto-updates
plan: 01
subsystem: infra
tags: [ssh, git, systemd, drizzle, updates]

requires:
  - phase: 03-vps-provisioning
    provides: SSH execution (ssh-exec.ts), VPS tracking in subscriptions table
  - phase: 06-health-monitoring
    provides: Health check patterns, batch processing with concurrency limits
provides:
  - Version tracking columns on subscriptions table (currentVersion, targetVersion, updateStatus, previousVersion, lastUpdateAt)
  - Per-VPS update engine (updateVPS, rollbackVPS, getVPSVersion)
affects: [07-auto-updates, dashboard]

tech-stack:
  added: []
  patterns:
    - "SSH-based update cycle: git pull -> bun install -> restart -> verify"
    - "Auto-rollback on any failure during update"
    - "Longer SSH timeouts for update operations (120s) vs health checks (10s)"

key-files:
  created:
    - src/lib/updates/update-engine.ts
  modified:
    - src/lib/db/schema.ts

key-decisions:
  - "Used existing subscriptions table for version tracking (no separate table needed)"
  - "120s timeout for bun install (can be slow on first run or with many deps)"
  - "Auto-rollback includes bun install to ensure deps match rolled-back code"

patterns-established:
  - "update-engine: atomic update/rollback per VPS with DB state persistence"

duration: 8min
completed: 2026-02-14
---

# Phase 7 Plan 01: DB Schema + Update Engine Summary

**Version tracking in subscriptions table + SSH-based update engine with auto-rollback to previous git commit hash**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-14
- **Completed:** 2026-02-14
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added 5 version tracking columns to subscriptions table (currentVersion, targetVersion, updateStatus, previousVersion, lastUpdateAt)
- Implemented updateVPS: SSH-based git pull -> bun install -> systemctl restart -> verify cycle
- Implemented rollbackVPS: git checkout -> bun install -> restart -> verify (non-recursive to prevent loops)
- Implemented getVPSVersion: reads current git commit hash from remote VPS
- All update state persisted to database for rollout tracking

## Task Commits

1. **Task 1: Add version tracking columns** - `60c69206` (feat)
2. **Task 2: Implement update engine** - `947aab6e` (feat)

## Files Created/Modified
- `src/lib/db/schema.ts` - Added 5 version tracking columns to subscriptions table
- `src/lib/updates/update-engine.ts` - Per-VPS update/rollback engine with SSH operations

## Decisions Made
- Used existing subscriptions table for version tracking rather than creating a separate table (keeps queries simple, one-to-one with VPS)
- 120s timeout for bun install commands (can be slow, especially first run)
- Auto-rollback includes re-running bun install to ensure dependencies match the rolled-back code version
- Service startup wait of 5 seconds before verification (allows systemd to fully initialize)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Update engine ready for rollout orchestrator (Plan 07-02)
- DB schema ready with version tracking fields

---
*Phase: 07-auto-updates*
*Completed: 2026-02-14*
