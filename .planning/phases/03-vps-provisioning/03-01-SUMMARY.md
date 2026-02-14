---
phase: 03-vps-provisioning
plan: 01
subsystem: database, infra
tags: [hetzner, drizzle, sqlite, ssh, rsa, crypto, provisioning]

# Dependency graph
requires:
  - phase: 02-billing-onboarding
    provides: subscriptions table with vpsProvisioned field
provides:
  - VPS tracking fields in subscriptions table (hetznerServerId, vpsIpAddress, provisioningStatus, etc.)
  - TypeScript types for all Hetzner Cloud API operations
  - SSH key pair generation utility for VPS access
affects: [03-vps-provisioning, 04-dashboard]

# Tech tracking
tech-stack:
  added: [node:crypto (generateKeyPairSync)]
  patterns: [OpenSSH key format conversion from DER/SPKI, snake_case API types vs camelCase internal types]

key-files:
  created:
    - src/lib/provisioning/types.ts
    - src/lib/provisioning/ssh-keys.ts
    - drizzle/0001_solid_killmonger.sql
  modified:
    - src/lib/db/schema.ts

key-decisions:
  - "SSH key generation uses node:crypto built-in (no external dependencies) with custom DER-to-OpenSSH conversion"
  - "Hetzner API types use snake_case to match API, internal types use camelCase"
  - "sshPrivateKey stored as encrypted text in subscriptions table for later SSH access to user VPS"

patterns-established:
  - "Provisioning types pattern: separate API types (snake_case) from internal config types (camelCase)"
  - "SSH key format: OpenSSH public key + PKCS8 PEM private key for Hetzner + ssh2 compatibility"

# Metrics
duration: 4min
completed: 2026-02-14
---

# Phase 3 Plan 01: Database Schema & SSH Keys Summary

**Database schema extended with 9 VPS tracking fields, Hetzner API types defined for all provisioning operations, RSA 4096-bit SSH key generation utility implemented using node:crypto**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-14T09:21:47Z
- **Completed:** 2026-02-14T09:25:12Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Extended subscriptions table with 9 new VPS fields: hetznerServerId, hetznerSshKeyId, vpsIpAddress, vpsHostname, provisioningStatus, provisioningError, provisionedAt, deprovisionedAt, sshPrivateKey
- Created comprehensive TypeScript types for Hetzner Cloud API (server, SSH key, firewall, action resources) plus internal provisioning config types
- Implemented SSH key pair generator producing OpenSSH-format public keys and PKCS8 PEM private keys using only node:crypto built-ins

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend database schema with VPS tracking fields** - `eae6014` (feat)
2. **Task 2: Create Hetzner API TypeScript types** - `270d4d3` (feat)
3. **Task 3: Implement SSH key generation utility** - `ab5bc0e` (feat)

## Files Created/Modified
- `src/lib/db/schema.ts` - Added 9 VPS tracking fields to subscriptions table
- `drizzle/0001_solid_killmonger.sql` - Database migration with VPS fields
- `src/lib/provisioning/types.ts` - Hetzner API request/response types, status enums, provisioning config types
- `src/lib/provisioning/ssh-keys.ts` - RSA 4096-bit SSH key pair generation with OpenSSH format conversion

## Decisions Made
- Used node:crypto generateKeyPairSync instead of shelling out to ssh-keygen (cross-platform, no external deps, type-safe)
- Custom DER-to-OpenSSH conversion to avoid dependency on ssh2 just for key formatting
- Hetzner API types use snake_case field names to match the REST API exactly, reducing translation errors
- SSHKeyPair type added to types.ts for clean return type from generateSSHKeyPair

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration file naming**
- **Found during:** Task 1 (Database schema extension)
- **Issue:** Plan specified `drizzle/0003_add_vps_fields.sql` but Drizzle Kit generates auto-named migrations (0001_solid_killmonger.sql) since subscriptions/telegram_bots tables were created via `push` in Phase 2 without generating migrations
- **Fix:** Used Drizzle Kit's auto-generated migration name; the migration correctly includes all VPS fields
- **Files modified:** drizzle/0001_solid_killmonger.sql
- **Verification:** `drizzle-kit push` succeeded, all 9 new columns confirmed in database
- **Committed in:** eae6014 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Migration file name differs from plan but all fields are correct. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Database ready for VPS provisioning data storage
- Hetzner API types ready for hetzner-client.ts implementation (Plan 03-02)
- SSH key generation ready for use in provisioning orchestrator
- Ready for Plan 03-02 (Hetzner API client, cloud-init builder, SSH injector)

---
*Phase: 03-vps-provisioning*
*Completed: 2026-02-14*
