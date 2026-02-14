# Requirements: Rachel Cloud

**Defined:** 2026-02-14
**Core Value:** A user can go from signup to talking to their own personal AI agent on Telegram in under 2 minutes, with zero technical setup.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email
- [ ] **AUTH-02**: User can sign up with Google OAuth
- [ ] **AUTH-03**: User can log in and session persists across browser refresh
- [ ] **AUTH-04**: User can connect their Claude account via OAuth 2.0 + PKCE flow
- [ ] **AUTH-05**: Claude OAuth tokens are stored encrypted at rest (AES-256-GCM)
- [ ] **AUTH-06**: Claude OAuth tokens auto-refresh before expiry

### Onboarding

- [ ] **ONBR-01**: User can enter their Telegram bot token (created via BotFather)
- [ ] **ONBR-02**: System validates Telegram bot token via getMe API before proceeding
- [ ] **ONBR-03**: User sees clear step-by-step instructions for creating a Telegram bot
- [ ] **ONBR-04**: User completes onboarding in under 5 minutes (signup → bot running)

### Billing

- [ ] **BILL-01**: User can subscribe to $20/month plan via Stripe Checkout
- [ ] **BILL-02**: User can view their subscription status and next billing date
- [ ] **BILL-03**: User can cancel their subscription from dashboard
- [ ] **BILL-04**: System handles Stripe webhooks for all subscription lifecycle events (created, updated, cancelled, payment failed)
- [ ] **BILL-05**: VPS is automatically deprovisioned when subscription ends (with 3-day grace period)
- [ ] **BILL-06**: User receives email notification when payment fails

### Provisioning

- [ ] **PROV-01**: System auto-provisions a dedicated Hetzner CX23 VPS when user completes onboarding + payment
- [ ] **PROV-02**: Provisioning completes in under 2 minutes
- [ ] **PROV-03**: Cloud-init script installs Bun, clones Rachel8, configures env vars, starts service
- [ ] **PROV-04**: Cloud-init includes validation step that reports success/failure back to control plane
- [ ] **PROV-05**: System injects Claude OAuth tokens and Telegram bot token to VPS securely (via SSH, not cloud-init user-data)
- [ ] **PROV-06**: Each VPS has a firewall (SSH + webhook ports only)
- [ ] **PROV-07**: System handles Hetzner API errors gracefully (capacity, rate limits, network)
- [ ] **PROV-08**: Failed provisions are cleaned up automatically (no zombie VPS)

### Dashboard

- [ ] **DASH-01**: User can see their server status (running, stopped, provisioning, error)
- [ ] **DASH-02**: User can view real-time logs from their Rachel instance
- [ ] **DASH-03**: User can restart their Rachel instance from the dashboard
- [ ] **DASH-04**: User can see uptime percentage and last activity timestamp
- [ ] **DASH-05**: Dashboard is responsive and works on mobile

### Monitoring

- [ ] **MNTR-01**: System health-checks each Rachel instance every 60 seconds
- [ ] **MNTR-02**: System auto-restarts crashed Rachel instances
- [ ] **MNTR-03**: System notifies user (email) when their instance goes down and when it recovers
- [ ] **MNTR-04**: Auto-recovery uses circuit breaker pattern (don't restart-loop)

### Landing Page

- [ ] **LAND-01**: Landing page explains what Rachel is and what Rachel Cloud offers
- [ ] **LAND-02**: Landing page shows pricing ($20/month)
- [ ] **LAND-03**: Landing page has clear CTA to sign up
- [ ] **LAND-04**: Landing page includes demo video or screenshots of Rachel in action
- [ ] **LAND-05**: Landing page links to open-source Rachel8 repo

### Auto-Updates

- [ ] **UPDT-01**: System can roll out new Rachel8 versions to all user instances
- [ ] **UPDT-02**: Updates are rolling (not all at once) to prevent mass outage
- [ ] **UPDT-03**: Failed updates auto-rollback to previous version

## v2 Requirements

### Token Usage

- **TOKN-01**: User can see Claude API token usage (input/output tokens, cost estimate)
- **TOKN-02**: User can set spending alerts for Claude API usage
- **TOKN-03**: Dashboard shows daily/weekly/monthly usage charts

### Conversation Management

- **CONV-01**: User can view conversation history from dashboard
- **CONV-02**: User can export conversation history (JSON/CSV)
- **CONV-03**: User can search past conversations

### Prompt Management

- **PRMT-01**: User can edit Rachel's system prompt from dashboard
- **PRMT-02**: User can customize Rachel's personality/name
- **PRMT-03**: System prompt changes deploy to VPS without restart

### Backup

- **BKUP-01**: System performs daily backup of user's memory files to R2
- **BKUP-02**: User can restore from backup via dashboard
- **BKUP-03**: User can download a full export of their data (GDPR)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Shared Telegram bot | Routing complexity, users create their own via BotFather |
| Multiple pricing tiers | Single $20/month, keep it simple for MVP |
| Team/org support | Single user per instance, enterprise is v2+ |
| Multi-cloud (AWS, GCP) | Hetzner only, simplicity is a feature |
| Custom VPS sizing | One size (CX23), no pricing complexity |
| BYOC (Bring Your Own Cloud) | Recommend self-hosting Rachel8 instead |
| Plugin marketplace | Security/support nightmare, defer indefinitely |
| Multi-LLM support (GPT, Gemini) | Claude-only by design |
| GitOps/IaC deployment | Target users don't want YAML |
| Custom domains | Users access dashboard at rachel.cloud subdomain |
| Multi-agent per user | Architecture unresolved, defer to v2+ |
| Semantic conversation search | Requires vector DB, v2+ feature |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| ONBR-01 | Phase 2 | Pending |
| ONBR-02 | Phase 2 | Pending |
| ONBR-03 | Phase 2 | Pending |
| ONBR-04 | Phase 2 | Pending |
| BILL-01 | Phase 2 | Pending |
| BILL-02 | Phase 2 | Pending |
| BILL-03 | Phase 2 | Pending |
| BILL-04 | Phase 2 | Pending |
| BILL-05 | Phase 2 | Pending |
| BILL-06 | Phase 2 | Pending |
| PROV-01 | Phase 3 | Pending |
| PROV-02 | Phase 3 | Pending |
| PROV-03 | Phase 3 | Pending |
| PROV-04 | Phase 3 | Pending |
| PROV-05 | Phase 3 | Pending |
| PROV-06 | Phase 3 | Pending |
| PROV-07 | Phase 3 | Pending |
| PROV-08 | Phase 3 | Pending |
| LAND-01 | Phase 4 | Pending |
| LAND-02 | Phase 4 | Pending |
| LAND-03 | Phase 4 | Pending |
| LAND-04 | Phase 4 | Pending |
| LAND-05 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |
| MNTR-01 | Phase 6 | Pending |
| MNTR-02 | Phase 6 | Pending |
| MNTR-03 | Phase 6 | Pending |
| MNTR-04 | Phase 6 | Pending |
| UPDT-01 | Phase 7 | Pending |
| UPDT-02 | Phase 7 | Pending |
| UPDT-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after initial definition*
