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

## Future Requirements (Deferred)

- Multi-server Docker Swarm / Kubernetes for horizontal scaling
- Per-user Z.ai API key option (BYOS retained as premium tier)
- Automatic server scaling when container count exceeds single-server capacity
- GPU-accelerated containers for local model inference
- Per-user usage dashboards with token consumption charts

## Out of Scope (v2.0)

| Feature | Reason |
|---------|--------|
| Full Kubernetes orchestration | Docker Compose / direct Docker API sufficient for MVP |
| Custom domain per user | Telegram is the interface, no web hosting needed |
| Local LLM inference | Z.ai API only for now |
| Multi-region deployment | Single Hetzner datacenter for MVP |
| Windows containers | Linux only |

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

### v2.0
| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| DOCK-01 | Phase 9 | — | Pending |
| DOCK-02 | Phase 9 | — | Pending |
| DOCK-03 | Phase 9 | — | Pending |
| DOCK-04 | Phase 9 | — | Pending |
| DOCK-05 | Phase 11 | — | Pending |
| DOCK-06 | Phase 9 | — | Pending |
| DOCK-07 | Phase 11 | — | Pending |
| PROX-01 | Phase 10 | — | Pending |
| PROX-02 | Phase 10 | — | Pending |
| PROX-03 | Phase 10 | — | Pending |
| PROX-04 | Phase 10 | — | Pending |
| PROX-05 | Phase 10 | — | Pending |
| PROX-06 | Phase 10 | — | Pending |
| ORCH-01 | Phase 11 | — | Pending |
| ORCH-02 | Phase 11 | — | Pending |
| ORCH-03 | Phase 11 | — | Pending |
| ORCH-04 | Phase 11 | — | Pending |
| ORCH-05 | Phase 11 | — | Pending |
| CTRL-01 | Phase 12 | — | Pending |
| CTRL-02 | Phase 12 | — | Pending |
| CTRL-03 | Phase 12 | — | Pending |
| CTRL-04 | Phase 12 | — | Pending |

**v2.0 Coverage:**
- Total requirements: 22
- Mapped to phases: 22 ✓
- Unmapped: 0

---
*Requirements defined: 2026-02-14 (v1.0), 2026-02-16 (v2.0)*
*Last updated: 2026-02-16 — v2.0 Docker Multi-Tenant requirements added*
