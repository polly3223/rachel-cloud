---
phase: 03-vps-provisioning
plan: 03
subsystem: infra
tags: [cloud-init, ssh2, provisioning, systemd, hetzner]

# Dependency graph
requires:
  - phase: 03-01
    provides: SSH key generation, provisioning types (CloudInitConfig, SSHInjectionConfig)
  - phase: 03-02
    provides: Hetzner API client for server creation
provides:
  - Cloud-init YAML builder for VPS initialization
  - SSH secret injection for Claude OAuth and Telegram credentials
  - Cloud-init completion callback endpoint
  - systemd service installation and startup
affects: [03-04, 03-05]

# Tech tracking
tech-stack:
  added: [ssh2, node-scp, "@types/ssh2"]
  patterns: [cloud-init phone_home callback, SSH command execution with step-named errors, heredoc-based secret injection]

key-files:
  created:
    - src/lib/provisioning/cloud-init-builder.ts
    - src/lib/provisioning/ssh-injector.ts
    - src/routes/api/provision/callback/[userId]/+server.ts
  modified:
    - package.json
    - bun.lock

key-decisions:
  - "Claude Code CLI installed via npm package (@anthropic-ai/claude-code) not curl script"
  - "Manual YAML construction for cloud-init (no YAML library dependency)"
  - "Heredoc syntax for SSH secret injection to avoid shell escaping issues"
  - "Callback endpoint is unauthenticated and idempotent (cloud-init cannot hold auth tokens)"

patterns-established:
  - "Pattern: SSH operations with step-named errors and timeouts for debuggability"
  - "Pattern: Idempotent provisioning callbacks that accept repeated signals gracefully"
  - "Pattern: Size-validated cloud-init YAML with 30KB safety margin under 32KiB Hetzner limit"

# Metrics
duration: 4min
completed: 2026-02-14
---

# Phase 3 Plan 03: Cloud-Init & SSH Injection Summary

**Cloud-init YAML builder with phone_home callback, SSH-based secret injection via ssh2, and cloud-init completion endpoint for two-phase VPS provisioning**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-14T09:28:43Z
- **Completed:** 2026-02-14T09:32:03Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments
- Cloud-init builder generates complete VPS setup YAML (Bun, GitHub CLI, Claude Code CLI, Rachel8 clone) with size validation
- SSH injector securely writes Claude OAuth credentials and Telegram config, then installs and validates systemd service
- Callback endpoint receives cloud-init phone_home signals and transitions provisioning status for orchestrator coordination

## Task Commits

Each task was committed atomically:

1. **Task 1: Install SSH automation libraries** - `aaf61af` (chore)
2. **Task 2: Implement cloud-init YAML builder** - `c8e4019` (feat)
3. **Task 3: Implement SSH secret injection and service startup** - `167107c` (feat)
4. **Task 4: Create cloud-init completion callback endpoint** - `41edb88` (feat)

## Files Created/Modified
- `src/lib/provisioning/cloud-init-builder.ts` - Generates cloud-config YAML for VPS initialization (user creation, package install, runtime setup, repo clone, phone_home callback)
- `src/lib/provisioning/ssh-injector.ts` - Connects via SSH to inject Claude OAuth tokens, Telegram bot token, .env file, and start systemd service
- `src/routes/api/provision/callback/[userId]/+server.ts` - SvelteKit API endpoint that receives cloud-init phone_home POST and updates provisioning status
- `package.json` - Added ssh2, node-scp dependencies and @types/ssh2 dev dependency
- `bun.lock` - Updated lockfile with new dependencies

## Decisions Made
- Used `@anthropic-ai/claude-code` npm package for Claude Code CLI installation instead of curl script (user instruction, npm package is the official distribution)
- Constructed YAML manually instead of adding a YAML serialization library to keep dependencies minimal
- Used heredoc syntax (`<< 'EOF'`) for SSH file writes to avoid shell escaping issues with JSON credentials
- Made callback endpoint unauthenticated and idempotent since cloud-init cannot hold auth tokens and may retry

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cloud-init builder, SSH injector, and callback endpoint are ready for the provisioning orchestrator (03-04)
- All three modules export their primary functions and can be composed in provision-vps.ts
- The phone_home callback URL pattern (`/api/provision/callback/{userId}`) links cloud-init to the callback endpoint

---
*Phase: 03-vps-provisioning*
*Completed: 2026-02-14*
