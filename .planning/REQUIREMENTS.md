# Requirements: Rachel Cloud

**Defined:** 2026-02-14
**Core Value:** A user can go from signup to talking to their own personal AI agent on Telegram in under 2 minutes, with zero technical setup.

## v1.0 Requirements (All Complete ✅)

### Authentication
- [x] **AUTH-01**: User can sign up with email
- [x] **AUTH-02**: User can sign up with Google OAuth
- [x] **AUTH-03**: User can log in and session persists across browser refresh
- [x] **AUTH-04**: User can connect their Claude account via OAuth 2.0 + PKCE flow
- [x] **AUTH-05**: Claude OAuth tokens are stored encrypted at rest (AES-256-GCM)
- [x] **AUTH-06**: Claude OAuth tokens auto-refresh before expiry

### Onboarding
- [x] **ONBR-01**: User can enter their Telegram bot token (created via BotFather)
- [x] **ONBR-02**: System validates Telegram bot token via getMe API before proceeding
- [x] **ONBR-03**: User sees clear step-by-step instructions for creating a Telegram bot
- [x] **ONBR-04**: User completes onboarding in under 5 minutes (signup → bot running)

### Billing
- [x] **BILL-01**: User can subscribe to $20/month plan via Polar Checkout
- [x] **BILL-02**: User can view their subscription status and next billing date
- [x] **BILL-03**: User can cancel their subscription from dashboard
- [x] **BILL-04**: System handles Polar webhooks for all subscription lifecycle events
- [x] **BILL-05**: VPS is automatically deprovisioned when subscription ends (with 3-day grace period)
- [x] **BILL-06**: User receives email notification when payment fails

### Provisioning
- [x] **PROV-01**: System auto-provisions a dedicated Hetzner CX23 VPS when user completes onboarding + payment
- [x] **PROV-02**: Provisioning completes in under 2 minutes
- [x] **PROV-03**: Cloud-init script installs Bun, clones Rachel8, configures env vars, starts service
- [x] **PROV-04**: Cloud-init includes validation step that reports success/failure back to control plane
- [x] **PROV-05**: System injects Claude OAuth tokens and Telegram bot token to VPS securely (via SSH)
- [x] **PROV-06**: Each VPS has a firewall (SSH + webhook ports only)
- [x] **PROV-07**: System handles Hetzner API errors gracefully (capacity, rate limits, network)
- [x] **PROV-08**: Failed provisions are cleaned up automatically (no zombie VPS)

### Dashboard
- [x] **DASH-01**: User can see their server status (running, stopped, provisioning, error)
- [x] **DASH-02**: User can view real-time logs from their Rachel instance
- [x] **DASH-03**: User can restart their Rachel instance from the dashboard
- [x] **DASH-04**: User can see uptime percentage and last activity timestamp
- [x] **DASH-05**: Dashboard is responsive and works on mobile

### Monitoring
- [x] **MNTR-01**: System health-checks each Rachel instance every 60 seconds
- [x] **MNTR-02**: System auto-restarts crashed Rachel instances
- [x] **MNTR-03**: System notifies user (email) when their instance goes down and when it recovers
- [x] **MNTR-04**: Auto-recovery uses circuit breaker pattern (don't restart-loop)

### Landing Page
- [x] **LAND-01**: Landing page explains what Rachel is and what Rachel Cloud offers
- [x] **LAND-02**: Landing page shows pricing ($20/month)
- [x] **LAND-03**: Landing page has clear CTA to sign up
- [x] **LAND-04**: Landing page includes demo or screenshots of Rachel in action
- [x] **LAND-05**: Landing page links to open-source Rachel8 repo

### Auto-Updates
- [x] **UPDT-01**: System can roll out new Rachel8 versions to all user instances
- [x] **UPDT-02**: Updates are rolling (not all at once) to prevent mass outage
- [x] **UPDT-03**: Failed updates auto-rollback to previous version

---

## v2.0 Requirements — Docker Multi-Tenant

### Docker Infrastructure

- [ ] **DOCK-01**: System can build a Rachel Docker image from the Rachel8 repo with all dependencies
- [ ] **DOCK-02**: System can spin up a new Docker container per user with isolated filesystem, memory limit (512MB), and CPU limit (0.5 cores)
- [ ] **DOCK-03**: Each container has its own SQLite database, Telegram bot token, and user-specific config
- [ ] **DOCK-04**: Containers can only communicate outbound (Telegram API, LLM proxy) — no cross-container access
- [ ] **DOCK-05**: System can stop, restart, and remove individual user containers without affecting others
- [ ] **DOCK-06**: Containers auto-restart on crash (Docker restart policy)
- [ ] **DOCK-07**: System can update all containers to a new Rachel8 version (pull new image, recreate)

### LLM Proxy

- [ ] **PROX-01**: Proxy server receives Anthropic-compatible API requests from containers and forwards to Z.ai with auth
- [ ] **PROX-02**: Proxy tracks per-user request count and token usage
- [ ] **PROX-03**: Proxy enforces per-user rate limits (configurable daily/hourly caps)
- [ ] **PROX-04**: Proxy returns clear error when user exceeds rate limit
- [ ] **PROX-05**: Proxy logs all requests with user ID, timestamp, token count for billing/debugging
- [ ] **PROX-06**: Z.ai API key is only stored on the host — never exposed to containers

### Container Orchestrator

- [ ] **ORCH-01**: Admin can provision a new user container via control plane (replaces Hetzner VPS provisioning)
- [ ] **ORCH-02**: Admin can deprovision a user container and clean up all associated data
- [ ] **ORCH-03**: System displays health status of all running containers
- [ ] **ORCH-04**: System auto-detects crashed/stopped containers and reports to control plane
- [ ] **ORCH-05**: Orchestrator manages full container lifecycle (create, start, stop, restart, remove)

### Control Plane Updates

- [ ] **CTRL-01**: User dashboard shows container status instead of VPS status
- [ ] **CTRL-02**: Admin dashboard shows all containers with resource usage, request counts, and health
- [ ] **CTRL-03**: Onboarding flow creates Docker container instead of Hetzner VPS
- [ ] **CTRL-04**: Billing supports all-inclusive tier ($20/mo, no external LLM sub required)

---

## v3.0 Requirements — Telegram-First & Cleanup

### Dead Code Cleanup

- [ ] **CLEAN-01**: Remove all Hetzner provisioning code (hetzner-client, provision-vps, deprovision-vps, cloud-init-builder, ssh-injector, ssh-exec, ssh-keys, vps-status, types)
- [ ] **CLEAN-02**: Remove SSH-based health monitoring (health-checker, health-notifications, circuit-breaker)
- [ ] **CLEAN-03**: Remove SSH-based update engine (update-engine.ts)
- [ ] **CLEAN-04**: Remove cloud-init callback API endpoint
- [ ] **CLEAN-05**: Remove `healthChecks` table from schema
- [ ] **CLEAN-06**: Remove legacy VPS columns from subscriptions schema (hetznerServerId, hetznerSshKeyId, vpsIpAddress, vpsHostname, sshPrivateKey, currentVersion, targetVersion, previousVersion, lastUpdateAt)
- [ ] **CLEAN-07**: Remove `ssh2` npm dependency
- [ ] **CLEAN-08**: Verify zero runtime regressions after cleanup

### Telegram Authentication

- [ ] **TGAUTH-01**: Single shared Rachel Telegram bot handles all user conversations
- [ ] **TGAUTH-02**: Users identified by Telegram user ID (integer, primary key)
- [ ] **TGAUTH-03**: New user sends `/start` → receives welcome + subscription prompt
- [ ] **TGAUTH-04**: Subscription checkout link includes Telegram user ID as metadata
- [ ] **TGAUTH-05**: Polar webhook on payment → auto-provision container for user
- [ ] **TGAUTH-06**: Message router: incoming message → look up user → forward to their container → return response

### Remove Better Auth

- [ ] **TGAUTH-07**: Remove Better Auth library and all auth config/client/session code
- [ ] **TGAUTH-08**: Remove Claude OAuth flow (claude-oauth.ts, claude-token-manager.ts, claudeTokens table)
- [ ] **TGAUTH-09**: Remove Better Auth DB tables (user, session, account, verification)
- [ ] **TGAUTH-10**: Remove login/signup web pages
- [ ] **TGAUTH-11**: Remove session-based route guards from app routes

### Database Redesign

- [ ] **TGAUTH-12**: New `users` table keyed on `telegram_id` (integer PK) with Telegram profile fields
- [ ] **TGAUTH-13**: Subscriptions reference `telegram_id` instead of Better Auth `user_id`
- [ ] **TGAUTH-14**: Migration script to map existing users (if any) to new schema

### User Experience via Telegram

- [ ] **TGUX-01**: User can check container status via `/status` command
- [ ] **TGUX-02**: User can restart container via `/restart` command
- [ ] **TGUX-03**: User can view recent logs via `/logs` command
- [ ] **TGUX-04**: User can view billing info and cancel via `/billing` command
- [ ] **TGUX-05**: User can get help via `/help` command

### Web App Simplification

- [ ] **WEB-01**: Landing page updated — CTA becomes "Message @RachelAI on Telegram" instead of signup form
- [ ] **WEB-02**: Admin dashboard uses Telegram Login Widget for authentication (or env-based admin Telegram ID)
- [ ] **WEB-03**: Remove all authenticated user web routes (dashboard, billing, onboarding pages)

## Future Requirements (Deferred)

- Multi-server Docker Swarm / Kubernetes for horizontal scaling
- Per-user Z.ai API key option (BYOS retained as premium tier)
- Automatic server scaling when container count exceeds single-server capacity
- GPU-accelerated containers for local model inference
- Per-user usage dashboards with token consumption charts

## Out of Scope (v3.0)

| Feature | Reason |
|---------|--------|
| Full Kubernetes orchestration | Docker API sufficient for MVP |
| Custom domain per user | Telegram is the interface |
| Local LLM inference | Z.ai API only for now |
| Multi-region deployment | Single Hetzner datacenter for MVP |
| Web-based user dashboard | Telegram commands replace it |
| Per-user Telegram bots | Shared bot is simpler for users |

## Traceability

### v1.0 (All mapped, all complete)
| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01..06 | Phase 1 | ✅ Complete |
| ONBR-01..04 | Phase 2 | ✅ Complete |
| BILL-01..06 | Phase 2 | ✅ Complete |
| PROV-01..08 | Phase 3 | ✅ Complete |
| LAND-01..05 | Phase 4 | ✅ Complete |
| DASH-01..05 | Phase 5 | ✅ Complete |
| MNTR-01..04 | Phase 6 | ✅ Complete |
| UPDT-01..03 | Phase 7 | ✅ Complete |

### v2.0 (Docker Multi-Tenant)
| REQ-ID | Phase | Status |
|--------|-------|--------|
| DOCK-01..07 | Phase 9, 11 | ✅ Complete (Phase 11-12) |
| PROX-01..06 | Phase 10 | ✅ Complete |
| ORCH-01..05 | Phase 11 | ✅ Complete |
| CTRL-01..04 | Phase 12 | ✅ Complete |

### v3.0 (Telegram-First & Cleanup)
| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| CLEAN-01..08 | Phase 13 | — | Pending |
| TGAUTH-01..14 | Phase 14 | — | Pending |
| TGUX-01..05 | Phase 14 | — | Pending |
| WEB-01..03 | Phase 14 | — | Pending |

**v3.0 Coverage:**
- Total requirements: 30
- Mapped to phases: 30 ✓
- Unmapped: 0

---
*Requirements defined: 2026-02-14 (v1.0), 2026-02-16 (v2.0), 2026-02-16 (v3.0)*
*Last updated: 2026-02-16 — v3.0 Telegram-First & Cleanup requirements added*
