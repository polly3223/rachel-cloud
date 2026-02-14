# Phase 6: Health Monitoring & Auto-Recovery - Context

**Created:** 2026-02-14
**Phase:** 06-health-monitoring

## Decisions

### Health Check Mechanism
- **SSH-based health checks** via existing `execSSHCommand()` — check `systemctl is-active rachel8` on each VPS
- No external monitoring service (Uptime Kuma, Datadog, etc.) — keep it in-process
- Health check runs as a **background job in the SvelteKit server process** using `node-schedule` (already installed)

### Check Frequency
- **Every 60 seconds per VPS** — batch all VPSs in a single sweep
- Stagger checks if many VPSs to avoid SSH connection storms

### Auto-Recovery Strategy
- Automatic restart via SSH: `sudo systemctl restart rachel8`
- **Circuit breaker**: if a VPS fails to restart **3 times consecutively**, stop trying and alert admin
- Use existing `restartRachelService()` from `vps-status.ts` for the restart action

### Notifications
- Use existing **Resend email sender** (`sender.ts`) for user notifications
- Send email when: instance goes DOWN, instance RECOVERS
- Send admin alert when: circuit breaker trips (3 consecutive failures)

### Storage
- Health tracking data stored in **SQLite via Drizzle** — new `healthChecks` table on the `subscriptions` table or a separate table
- Track: last check time, consecutive failures, circuit breaker state, last incident time

### Dashboard Integration
- User dashboard: show health status indicator (healthy/degraded/down)
- Admin dashboard: show health overview across all VPSs, circuit breaker states

## Claude's Discretion

- Exact DB schema design (separate table vs columns on subscriptions)
- Health check batching strategy (parallel vs sequential SSH)
- Log retention policy for health events
- Email template design for health notifications
- Whether to add a health check API endpoint for external monitoring

## Deferred Ideas

- External monitoring service integration (Uptime Kuma, Better Stack, etc.)
- SMS/webhook notifications (email only for now)
- Custom health check intervals per user
- Health check history/timeline UI
- Automated VPS reboot via Hetzner API (only service restart via SSH)
- Health check for the Rachel Cloud app itself (only user VPSs)
