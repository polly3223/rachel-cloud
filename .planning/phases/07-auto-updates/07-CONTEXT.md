# Phase 7: Auto-Updates & Rollout System - Context

**Created:** 2026-02-14

## Decisions

- **Update mechanism:** SSH into VPS, `git pull`, `bun install`, `sudo systemctl restart rachel8`, verify service active
- **Rollback strategy:** `git checkout <previous_commit_hash>`, `bun install`, restart, verify
- **Gradual rollout:** Batch VPSs into groups (10% -> 50% -> 100%) with pause between stages
- **Version tracking:** Store current version (git commit hash) per VPS in database
- **Public repo:** https://github.com/polly3223/rachel (cloned on all VPSs)
- **Admin page:** `/admin/updates` for triggering and monitoring rollouts
- **Use existing SSH:** Reuse `ssh-exec.ts` for all SSH operations
- **Use existing admin auth:** Reuse `requireAdmin` guard for the updates page

## Claude's Discretion

- Rollout stage timing (how long to wait between stages)
- Error thresholds (how many failures before halting rollout)
- UI layout details for the updates admin page
- Whether to add version display to user dashboard

## Deferred Ideas

- Automatic scheduled updates (cron-based, no admin trigger)
- Per-user update opt-in/opt-out
- Canary deployments with traffic splitting
- Update changelog display to users
