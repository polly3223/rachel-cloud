# Phase 5: Dashboard & User Controls - Context

**Created:** 2026-02-14
**Phase:** 05-dashboard-controls

## Decisions

### User Dashboard
- Server status display: running/stopped/error (check via Hetzner API `GET /servers/{id}`)
- Restart button: restart `rachel8` systemd service via SSH (`systemctl restart rachel8`)
- Basic logs view: last 100 lines from `journalctl -u rachel8` via SSH
- Connection info: VPS IP, server uptime (from Hetzner API or SSH `uptime`)
- Logs use polling (fetch every 5s), NOT SSE/WebSockets (simpler, good enough for log tailing)

### Admin Dashboard
- Separate route group: `(admin)` at `/admin/*`
- Admin access: hardcoded check by email (Lorenzo's email in env var `ADMIN_EMAIL`)
- Admin auth enforced in `hooks.server.ts` handle function (not layout-level)
- Admin pages:
  - Users list with status (active, grace_period, canceled)
  - Revenue overview (total MRR from active subscribers, subscriber count)
  - Costs overview (number of VPSs running, estimated Hetzner cost per VPS)
  - VPS status per user (provisioned, IP, Hetzner server status)

### Architecture
- Same SvelteKit app, same repo (monorepo style)
- Route groups: `(app)` for user dashboard (existing), `(admin)` for admin dashboard (new)
- SSH utility functions reuse existing `ssh2` library and `ssh-injector.ts` patterns
- Hetzner API calls reuse existing `HetznerClient` class (already has `getServer()`)
- No new npm dependencies needed

## Claude's Discretion

- Admin dashboard visual design/layout (cards, tables, grid)
- Polling interval for log refresh (5-10 seconds reasonable)
- How many log lines to show (50-100 is reasonable)
- Error handling UX for SSH connection failures
- Whether to cache Hetzner API responses briefly (optional, not required)

## Deferred Ideas

- Real-time log streaming via SSE/WebSockets (polling is sufficient for MVP)
- Admin actions (force-restart user VPS, force-deprovision)
- Usage metrics/charts over time
- Export functionality (CSV export of user data)
- Multi-admin support (only Lorenzo for now)
- Admin audit log
