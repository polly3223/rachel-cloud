# Pitfalls Research
**Domain:** Managed AI agent hosting
**Researched:** 2026-02-14
**Confidence:** High (based on infrastructure automation, VPS hosting, SaaS billing, and AI agent platform research)

---

## Critical Pitfalls

### 1. Cloud-init Silent Failures
**What goes wrong:** VPS provisions successfully via Hetzner API but Rachel8 never starts because cloud-init script failed silently. User sees "server running" in dashboard but bot doesn't respond.

**Why it happens:**
- Extra characters before `#cloud-config` header cause silent failure
- Base64 encoding issues with inline scripts
- Commands in runcmd that never complete (e.g., deadlocks)
- Nonzero exit codes from provisioning commands fail the entire deployment
- No validation of cloud-init syntax before sending to Hetzner API

**Warning signs:**
- User reports "bot not responding" despite server status showing "running"
- SSH works but application processes aren't running
- `/var/log/cloud-init.log` shows errors but dashboard doesn't surface them
- Increasing support tickets about "broken deployments"

**How to avoid:**
1. Validate cloud-init YAML with `cloud-init devel schema --config-file` before API submission
2. Implement cloud-init status polling: check `cloud-init status --wait` via SSH after provision
3. Surface cloud-init errors in dashboard: parse `/var/log/cloud-init*.log` during health checks
4. Use systemd unit for Rachel8 with restart policy, not just runcmd
5. Add timeout guards on all runcmd commands
6. Test cloud-init scripts with `cloud-init clean && cloud-init init` in staging

**Phase to address:** MVP Phase 1 (validation), Phase 2 (monitoring)

**Sources:**
- [How to debug cloud-init - cloud-init 25.3 documentation](https://cloudinit.readthedocs.io/en/latest/howto/debugging.html)
- [Failure states - cloud-init 25.3 documentation](https://cloudinit.readthedocs.io/en/latest/explanation/failure_states.html)
- [Troubleshoot using cloud-init - Azure Virtual Machines](https://learn.microsoft.com/en-us/azure/virtual-machines/linux/cloud-init-troubleshooting)

---

### 2. Hetzner API Capacity Exhaustion
**What goes wrong:** User pays $20, clicks "Deploy", sees loading spinner forever. No server provisioned, no refund, no error shown. Hetzner returned "capacity reached" but you didn't handle it.

**Why it happens:**
- Hetzner data centers run out of CX23 capacity during peak times
- API returns generic error that your code doesn't parse
- No retry logic for transient failures
- No fallback to alternate data centers
- User charged by Stripe before confirming Hetzner provisioning succeeded

**Warning signs:**
- Multiple users in same region report failed deployments
- Hetzner API returns 503 or "cloud capacity reached" errors
- Deployment success rate drops below 95%
- Support tickets: "paid but no server"

**How to avoid:**
1. **Never charge Stripe before confirming Hetzner provision**: Create Stripe subscription with trial period, provision VPS, then activate billing
2. Implement data center fallback: Try primary DC, fall back to nearby DCs if capacity full
3. Parse Hetzner error responses and surface to user: "Capacity full in Nuremberg, trying Falkenstein..."
4. Add provisioning timeout (5 minutes) with automatic retry
5. Queue failed provisions for retry with exponential backoff
6. Monitor Hetzner status page and disable signups during known outages

**Phase to address:** MVP Phase 1 (error handling), Phase 2 (fallback logic)

**Sources:**
- [HetznerCloud reports Cloud capacity reached in error](https://github.com/jenkinsci/hetzner-cloud-plugin/issues/21)
- [Hetzner Cloud API overview](https://docs.hetzner.cloud/)

---

### 3. Stripe Subscription Zombie States
**What goes wrong:** User's payment fails on renewal. Stripe marks subscription "past_due" but VPS keeps running, racking up Hetzner costs. Or: VPS gets deleted but subscription keeps charging.

**Why it happens:**
- Webhook from Stripe to your backend fails (network timeout, server down)
- No reconciliation between Stripe subscription status and VPS running state
- Dunning emails sent by Stripe but you don't pause/delete VPS until manual intervention
- Subscription cancelled but VPS deletion fails, leaving orphaned servers
- User updates payment method but you don't retry invoice

**Warning signs:**
- Hetzner bill exceeds Stripe revenue by >10%
- Users complain they're charged but server is down
- "past_due" subscriptions in Stripe without corresponding VPS actions
- Database shows 847 VPS records but Hetzner API shows 891 servers

**How to avoid:**
1. **Implement Stripe webhook handlers for all subscription events:**
   - `customer.subscription.updated` → pause VPS if status = "past_due"
   - `customer.subscription.deleted` → delete VPS within 24 hours
   - `invoice.payment_succeeded` → resume VPS if was paused
   - `invoice.payment_failed` → start grace period countdown
2. **Use idempotency keys for all Hetzner API calls**: Prevent duplicate VPS on webhook retries
3. **Daily reconciliation job**: Compare Stripe subscriptions to running VPS, flag mismatches
4. **Grace period logic**: 7-day grace period for payment failures before deletion
5. **Two-way state machine**: Track (VPS state, Subscription state) pairs and enforce valid transitions
6. **Retry logic in webhooks**: If VPS deletion fails, queue for retry, don't just log error

**Phase to address:** MVP Phase 1 (webhook handlers), Phase 2 (reconciliation), Phase 3 (advanced dunning)

**Sources:**
- [Automate payment retries | Stripe Documentation](https://docs.stripe.com/billing/revenue-recovery/smart-retries)
- [How subscriptions work | Stripe Documentation](https://docs.stripe.com/billing/subscriptions/overview)
- [Stripe Subscription Failed Payments How-To](https://recoverpayments.com/stripe-subscription-failed-payment/)

---

### 4. OAuth Token Storage Without Encryption
**What goes wrong:** You store Anthropic API keys from OAuth in plaintext Postgres. Database gets compromised (SQL injection, backup leaked). Attacker drains all users' Claude API credits overnight.

**Why it happens:**
- Assumed "database is secure" without defense in depth
- No encryption at rest for sensitive fields
- Backup files stored in S3 without encryption
- Database logs contain full API keys during debugging
- No key rotation or access monitoring

**Warning signs:**
- Security audit flags plaintext secrets in database
- Database backup in S3 bucket without encryption
- Logs contain full API keys (not just last 4 chars)
- No alerts when API keys are accessed

**How to avoid:**
1. **Encrypt API keys at rest**: Use AES-256 with key stored in environment variable, not in DB
2. **Use Postgres pgcrypto extension**: `pgp_sym_encrypt(api_key, encryption_key)`
3. **Separate encryption key management**: Store encryption key in Hetzner secrets or KMS
4. **Encrypt backups**: Enable encryption on Postgres backups and S3 storage
5. **Redact from logs**: Never log full API keys, only last 4 characters
6. **Consider BYOK (Bring Your Own Key)**: Let enterprise users manage their own encryption keys
7. **Implement access logging**: Track when API keys are decrypted/used

**Phase to address:** MVP Phase 1 (basic encryption), Phase 3 (BYOK for enterprise)

**Sources:**
- [Demystifying AWS KMS key operations, bring your own key (BYOK)](https://aws.amazon.com/blogs/security/demystifying-kms-keys-operations-bring-your-own-key-byok-custom-key-store-and-ciphertext-portability/)
- [Allow customers to bring their own key (BYOK) to encrypt their data in your B2B SaaS](https://edgebit.io/solutions/bring-your-own-key/)
- [What is BYOK encryption? | Atlassian Support](https://support.atlassian.com/security-and-access-policies/docs/what-is-byok-encryption-for-atlassian-products/)

---

### 5. Cascading Health Check Failures
**What goes wrong:** Anthropic API has 30-second slowdown. Your health check times out, marks Rachel8 "unhealthy", auto-restarts it. All 1000 users' agents restart simultaneously, causing thundering herd to Anthropic API, getting rate limited, causing more health check failures. Positive feedback loop takes down entire platform.

**Why it happens:**
- Health checks have no timeout/retry logic
- Auto-recovery triggers immediately on single failure
- No jitter/backoff on restarts
- Health check depends on external service (Anthropic API) instead of just process health
- No circuit breaker pattern

**Warning signs:**
- Multiple servers restart at same time
- Health check failures correlate with external API latency
- Recovery actions cause more failures
- Anthropic rate limit errors spike during "recovery"

**How to avoid:**
1. **Separate shallow and deep health checks:**
   - Shallow: Is Rachel8 process running? (every 30s)
   - Deep: Can it call Anthropic API? (every 5 minutes)
2. **Require N consecutive failures before restart**: 3 failures over 90s, not 1 failure
3. **Add jitter to restarts**: Random delay 0-60s before restarting to prevent thundering herd
4. **Circuit breaker for external dependencies**: Don't mark unhealthy if Anthropic API is down, only if Rachel8 crashes
5. **Exponential backoff on restart attempts**: 1 min, 2 min, 4 min, 8 min delays
6. **Rate limit auto-recovery actions**: Max 100 servers restarting per minute across fleet
7. **Alert on correlated failures**: If >10% of servers fail health check simultaneously, pause auto-recovery

**Phase to address:** Phase 2 (health monitoring), Phase 3 (advanced circuit breaker)

**Sources:**
- [Implementing health checks | AWS Builders Library](https://aws.amazon.com/builders-library/implementing-health-checks/)
- [Kubernetes Liveness Probes: Tutorial & Critical Best Practices](https://codefresh.io/learn/kubernetes-management/kubernetes-liveness-probes/)
- [Your Uptime Monitoring Is Broken By Design](https://codematters.medium.com/your-uptime-monitoring-is-broken-by-design-1312c511093f)

---

### 6. Telegram Webhook SSL Certificate Hell
**What goes wrong:** User deploys Rachel8 to VPS. Everything looks green in dashboard. But Telegram webhooks fail silently because SSL cert is self-signed or expired. User thinks bot is broken, churns.

**Why it happens:**
- cloud-init generates self-signed cert for HTTPS endpoint
- Telegram requires valid SSL cert, rejects self-signed
- No error surfaced to user or dashboard
- Let's Encrypt setup fails due to DNS propagation timing
- Webhook URL uses IP address instead of domain (some CAs won't issue cert)

**Warning signs:**
- Telegram `setWebhook` returns 200 OK but `getWebhookInfo` shows error
- No webhook requests in logs despite user sending messages
- User reports "bot doesn't respond"
- SSL Labs test shows cert issues

**How to avoid:**
1. **Provision domain per user**: `{user-id}.rachel.cloud` with automatic DNS
2. **Let's Encrypt with certbot**: Auto-renew in cron job, not one-time setup
3. **Wait for DNS propagation**: Poll DNS after creating record, then request cert
4. **Validate webhook during provision**: Call Telegram `setWebhook` and check `getWebhookInfo.last_error_message`
5. **Surface Telegram errors in dashboard**: "Webhook failed: SSL certificate verification failed"
6. **Fallback to polling mode**: If webhook setup fails, use long polling temporarily
7. **Monitor cert expiration**: Alert 7 days before Let's Encrypt cert expires

**Phase to address:** MVP Phase 1 (basic SSL), Phase 2 (monitoring)

**Sources:**
- [Marvin's Marvellous Guide to All Things Webhook](https://core.telegram.org/bots/webhooks)
- [Bots FAQ](https://core.telegram.org/bots/faq)
- [Why My Telegram Bot Is Not Responding and How to Fix It Fast](https://membertel.com/blog/why-my-telegram-bot-is-not-responding/)

---

### 7. Claude API Rate Limit Amplification
**What goes wrong:** One user sends 100 messages/minute to their bot. Rachel8 hits Anthropic rate limits (50 RPM on Tier 1). But you're using user's API key via OAuth, so THEY get rate limited, not you. User doesn't understand why, blames your platform.

**Why it happens:**
- Rate limits are per Anthropic organization, not per API key
- User doesn't know their tier or limits
- No queue/backoff in Rachel8 when hitting 429 errors
- Prompt caching not enabled, wasting tokens
- Multiple rapid requests from same user with no throttling

**Warning signs:**
- User reports "bot stops responding randomly"
- Anthropic 429 errors in logs
- User complains "Claude API works fine in my app but not in Rachel"
- Support tickets about rate limits from new users (Tier 1)

**How to avoid:**
1. **Check rate limits during onboarding**: Call Anthropic API to detect user's tier, show in dashboard
2. **Implement request queue with token bucket**: Respect user's specific RPM/TPM limits
3. **Parse `retry-after` header**: Wait exact seconds from 429 response, don't guess
4. **Enable prompt caching**: Reduces token usage 80-90%, increases effective limit 5x
5. **Educate users on tier upgrades**: "You're on Tier 1 (50 RPM). Upgrade to Tier 2 for 1000 RPM"
6. **Client-side rate limiting**: Show "Please wait..." if user spamming messages
7. **Exponential backoff in Rachel8**: Don't retry 429s immediately, use backoff
8. **Monitor rate limit usage**: Show "38/50 requests used this minute" in dashboard

**Phase to address:** MVP Phase 1 (basic queue), Phase 2 (tier detection), Phase 3 (advanced caching)

**Sources:**
- [Rate limits - Claude API Docs](https://platform.claude.com/docs/en/api/rate-limits)
- [How to Fix Claude API 429 Rate Limit Error: Complete Guide 2026](https://www.aifreeapi.com/en/posts/claude-api-429-error-fix)
- [How AI Agents Are Changing API Rate Limit Approaches](https://nordicapis.com/how-ai-agents-are-changing-api-rate-limit-approaches/)

---

### 8. Zombie VPS Orphans Draining Budget
**What goes wrong:** VPS provisioning fails halfway (Hetzner creates server, your DB insert fails). Server keeps running, costing money, but not tracked in your system. After 6 months you have 200 orphaned VPS costing $3000/month.

**Why it happens:**
- Provisioning is not idempotent
- No reconciliation between Hetzner state and DB state
- Transaction boundaries don't match resource lifecycle
- Failed cleanup operations leave resources behind
- No periodic audit of actual vs expected resources

**Warning signs:**
- Hetzner invoice shows more servers than your DB count
- VPS in "provisioning" state for >1 hour
- Database has failed provision records with no corresponding cleanup
- `hcloud server list` shows servers not in your database

**How to avoid:**
1. **Tag all Hetzner resources**: Add label `rachel-cloud-user={user_id}` to every server
2. **Daily reconciliation job**:
   - Query Hetzner API for all servers with `rachel-cloud` labels
   - Compare to database records
   - Alert on mismatches, auto-delete orphans >7 days old
3. **Idempotent provisioning**: Use `hcloud server create --name {unique-id}` with retry logic
4. **State machine for provisioning**:
   - `requested` → `creating` → `configuring` → `active` → `deleting` → `deleted`
   - Timeout transitions: If stuck in `creating` >10 min, mark failed and cleanup
5. **Cleanup background job**: Scan for failed provisions every hour, delete VPS if exists
6. **Two-phase commit for creation**:
   - Phase 1: Create in Hetzner, save server_id in DB
   - Phase 2: Configure, update status
   - Rollback: If Phase 2 fails, delete server_id from Hetzner
7. **Cost alerts**: Alert if Hetzner bill exceeds `active_user_count * $20 * 1.1`

**Phase to address:** MVP Phase 1 (tagging, basic cleanup), Phase 2 (reconciliation job)

**Sources:**
- [Building a Budget-Friendly Lab VPS Platform – Part 5: When Things Break](https://byrnbaker.me/posts/Lab-VPS-part5/)
- [Orphaned resource allocations — nova 32.1.0.dev105 documentation](https://docs.openstack.org/nova/latest/admin/troubleshooting/orphaned-allocations.html)
- [Virtual machine stuck in failed state](https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/vm-stuck-in-failed-state)

---

### 9. Per-User VPS Cost Trap at Scale
**What goes wrong:** You hit 500 users ($10,000 MRR). Hetzner costs are $8,500/month (500 × $17 VPS). Stripe fees $290. Support burden high. Net margin only 12%. Can't afford to hire, can't scale operations.

**Why it happens:**
- Dedicated VPS per user has fixed cost floor
- No resource sharing efficiency gains
- Underutilized servers (most agents idle 90% of time)
- Can't oversell capacity like shared hosting
- Support costs scale linearly with users

**Warning signs:**
- Gross margin <30%
- Hetzner costs >80% of revenue
- Can't afford to hire support engineer
- Feature development stalls due to cost constraints
- Competitor launches with shared model at $10/month

**How to avoid:**
1. **Accept this is your model for MVP**: Don't over-optimize too early
2. **Plan migration path to multi-tenant**: Design Rachel8 for eventual container orchestration
3. **Implement auto-pause for idle agents**: Stop VPS after 24h inactivity, resume on message (complex!)
4. **Tiered pricing strategy**:
   - Basic: $10/month (shared container)
   - Pro: $20/month (dedicated VPS)
   - Enterprise: $50/month (larger VPS, SLA)
5. **Usage-based pricing**: $10 base + $0.01 per AI message
6. **Optimize VPS sizing**: CX22 ($5.83) instead of CX23 if sufficient
7. **Regional pricing**: Cheaper in regions with lower VPS costs
8. **Annual plans**: $200/year (2 months free) to improve cash flow

**Phase to address:** Phase 3 (optimization), Phase 4 (multi-tenant option)

**Sources:**
- [Dedicated Server Pricing Explained](https://www.hostpapa.com/blog/web-hosting/dedicated-server-pricing-explained/)
- [Cloud Server Hosting Price Breakdown](https://www.bluehost.com/blog/cloud-server-hosting-price/)
- [AI Agent Production Costs 2026](https://www.agentframeworkhub.com/blog/ai-agent-production-costs-2026)

---

### 10. OAuth PKCE Downgrade Attack
**What goes wrong:** Attacker intercepts OAuth authorization code by exploiting non-enforced PKCE. They exchange it for access token, steal user's Anthropic API key, drain Claude credits.

**Why it happens:**
- Authorization server supports PKCE but doesn't enforce it
- "plain" code_challenge_method allowed instead of requiring "S256"
- Redirect URI validation too permissive (allows localhost variants)
- No state parameter validation (CSRF attack)
- Authorization code not single-use (can be replayed)

**Warning signs:**
- Multiple token exchanges from different IPs for same auth code
- Auth codes used after expiration
- PKCE parameters missing from some requests
- Users report unauthorized API usage

**How to avoid:**
1. **Enforce PKCE for all OAuth flows**: Reject requests without code_challenge
2. **Require S256 code_challenge_method**: Never accept "plain"
3. **Validate code_verifier**: Must match hash of code_challenge from auth request
4. **Strict redirect_uri validation**: Exact match, no wildcards
5. **One-time use for auth codes**: Invalidate after first token exchange
6. **Short auth code lifetime**: 5 minutes max
7. **Bind auth code to code_challenge**: Associate in session, verify on exchange
8. **State parameter required**: Prevent CSRF attacks
9. **Log OAuth anomalies**: Multiple exchanges, mismatched verifiers, etc.

**Phase to address:** MVP Phase 1 (enforce PKCE), Phase 2 (security monitoring)

**Sources:**
- [OAuth 2.0 Common Security Flaws and Prevention Techniques](https://www.apisec.ai/blog/oauth-2-0-common-security-flaws)
- [Common OAuth Vulnerabilities · Doyensec's Blog](https://blog.doyensec.com/2025/01/30/oauth-common-vulnerabilities.html)
- [PKCE in OAuth 2.0: How to Protect Your API from Authorization Code Grant Attacks](https://www.authgear.com/post/pkce-in-oauth-2-0-how-to-protect-your-api-from-attacks)

---

## Technical Debt Patterns

### 11. Non-Idempotent Provisioning Creates Duplicate VPS
**Pattern:** Webhook retry from Stripe triggers VPS provisioning twice. User gets two servers, you pay double, chaos ensues.

**Prevention:**
- Generate unique `provision_id` before calling Hetzner API
- Use `provision_id` as idempotency key in all Hetzner calls
- Check database for existing VPS before creating new one
- Store Hetzner server ID immediately after creation
- Implement mutex/lock on provisioning per user

**Phase:** MVP Phase 1

---

### 12. Log Explosion from AI Agents
**Pattern:** Each agent makes 50-100 Claude API calls per conversation. Each call logged. 1000 users = 5M log entries/day. Disk full in 2 weeks. VPS crashes.

**Prevention:**
- Implement log rotation with size limits
- Use structured logging with levels (don't log DEBUG in production)
- Stream logs to external service (Loki, CloudWatch)
- Sample verbose logs (log 1% of successful API calls)
- Alert on disk usage >80%
- Separate application logs from conversation history

**Phase:** Phase 2

---

### 13. Database Connection Pool Exhaustion
**Pattern:** Web dashboard has 100 concurrent users viewing logs. Each opens persistent connection. Postgres maxes out connections (100). New users can't sign up.

**Prevention:**
- Use connection pooling (pgbouncer)
- Set max pool size based on expected concurrency
- Implement connection timeout
- Close connections after queries
- Use read replicas for dashboard queries
- Monitor active connection count

**Phase:** Phase 2

---

### 14. SSH Key Distribution Nightmare
**Pattern:** You need to SSH into user VPS for debugging. But you didn't inject your key during provisioning. Now you need to restart VPS to add it. Downtime.

**Prevention:**
- Inject platform SSH key during cloud-init
- Store in separate authorized_keys entry, not user's
- Use bastion host pattern for access
- Implement "support mode" toggle that adds temporary key
- Log all SSH access for audit trail
- Auto-expire support keys after 24 hours

**Phase:** MVP Phase 1

---

### 15. Hetzner API Deprecation Breaks Prod
**Pattern:** Hetzner deprecates `datacenter` parameter on July 1, 2026. Your code still uses it. Deployments fail. Sunday evening. No one notices for 6 hours.

**Prevention:**
- Subscribe to Hetzner API changelog
- Monitor deprecation warnings in API responses
- Version your API client wrapper
- Implement feature flags for API changes
- Run integration tests against Hetzner staging API
- Alert on HTTP 400 responses from Hetzner

**Phase:** Phase 2 (monitoring), ongoing maintenance

**Sources:**
- [Changelog - Hetzner Cloud API](https://docs.hetzner.cloud/changelog)

---

## Integration Gotchas

### 16. Telegram Rate Limit Per Chat
**Gotcha:** You throttle Telegram messages globally at 30/second. But limit is actually 1 message/second per chat, 20/minute per group. High-frequency user hits limit, messages fail.

**How to detect:**
- 429 errors from Telegram API with "Too Many Requests: retry after X"
- User reports messages delayed or missing
- Multiple rapid messages queued then delivered in burst

**How to handle:**
- Implement per-chat rate limiter, not global
- Queue messages with per-chat backoff
- Show "Sending..." indicator to user
- Respect `retry-after` header from 429 response
- Consider paid broadcasts feature ($0.1 Stars per message >30/s)

**Phase:** Phase 2

**Sources:**
- [Bots FAQ](https://core.telegram.org/bots/faq)
- [How to solve rate limit errors from Telegram Bot API](https://gramio.dev/rate-limits)

---

### 17. Anthropic Prompt Caching Cache Misses
**Gotcha:** You enable prompt caching but get 0% cache hit rate. Wasting tokens. Turns out cached content must be >1024 tokens and in specific message structure.

**How to detect:**
- Anthropic API responses don't show `cache_creation_input_tokens` or `cache_read_input_tokens`
- Token costs don't decrease after implementing caching
- No cache headers in API responses

**How to handle:**
- Ensure system prompt >1024 tokens
- Mark cacheable content with `cache_control` parameter
- Place cached content at start of messages
- Monitor cache hit rate via API response headers
- Adjust prompt structure to maximize cache eligibility

**Phase:** Phase 2 (optimization)

**Sources:**
- [How to Fix Claude API 429 Rate Limit Error](https://www.aifreeapi.com/en/posts/claude-api-429-error-fix)

---

### 18. Stripe Test Mode Webhooks in Production
**Gotcha:** You accidentally configure production with Stripe test mode API key. Webhooks arrive for test payments but don't match real subscriptions. VPS gets deleted for paying customers.

**How to detect:**
- Stripe webhook events have `livemode: false` in JSON
- API keys start with `sk_test_` instead of `sk_live_`
- Dashboard shows test data
- Real payments in Stripe dashboard don't trigger webhooks in your system

**How to handle:**
- Check `STRIPE_API_KEY` starts with correct prefix on startup
- Reject webhooks where `livemode` doesn't match environment
- Use separate webhook endpoints for test vs live
- Alert if webhook signature verification fails
- Environment variable validation on deploy

**Phase:** MVP Phase 1

---

### 19. Hetzner Floating IP Costs Accumulate
**Gotcha:** You assign floating IPs to each VPS for "stable addressing." Floating IPs cost €1/month each. Surprise €500 bill for 500 users.

**How to detect:**
- Hetzner invoice shows floating IP charges
- Cost per user exceeds expected CX23 price
- `hcloud floating-ip list` shows hundreds of IPs

**How to handle:**
- Don't use floating IPs unless required for failover
- Use primary IPv4 assigned to server (free)
- If using floating IPs, document cost in financial model
- Monitor Hetzner resource usage in dashboard

**Phase:** MVP Phase 1 (avoid), Phase 3 (if HA required)

---

### 20. OAuth Token Refresh Not Implemented
**Gotcha:** You store access token from Anthropic OAuth but don't implement refresh flow. Token expires after 30 days. User's bot stops working. They don't know why.

**How to detect:**
- Anthropic API returns 401 Unauthorized
- Error message: "Invalid authentication token"
- User reports "bot stopped working" exactly 30 days after signup

**How to handle:**
- Store both access_token and refresh_token from OAuth
- Check token expiration before API calls
- Implement background job to refresh tokens before expiry
- Retry API calls with refreshed token on 401
- Alert user if refresh fails (they need to re-auth)
- Grace period: 7 days to re-auth before pausing VPS

**Phase:** MVP Phase 1

---

## Performance Traps

### 21. Dashboard Queries Scan Entire Log Tables
**Trap:** User clicks "View Logs" in dashboard. Query does `SELECT * FROM logs WHERE user_id = X ORDER BY timestamp DESC LIMIT 100`. Table has 50M rows. Query takes 30 seconds. Times out.

**Why it happens:**
- No index on (user_id, timestamp)
- Using generic ORM without query optimization
- Not partitioning log tables
- Loading all columns when only need message + timestamp

**How to avoid:**
- Create composite index: `CREATE INDEX idx_logs_user_time ON logs(user_id, timestamp DESC)`
- Partition log tables by date (monthly)
- Use cursor-based pagination, not OFFSET
- Select only needed columns
- Consider separate OLAP database for logs (ClickHouse)
- Implement log streaming (websocket) instead of polling

**Phase:** Phase 2

---

### 22. Serial VPS Provisioning Blocks Signups
**Trap:** User signs up. Provisioning takes 3 minutes (Hetzner creation + DNS + cloud-init + health check). User stares at loading screen. 60% bounce.

**Why it happens:**
- Provisioning is synchronous in signup request
- No background job queue
- User waits for entire process
- Browser timeout at 2 minutes

**How to avoid:**
- Queue provisioning in background job (Bun + async task queue)
- Return immediately: "Provisioning your server... Check back in 5 minutes"
- Email notification when ready
- Progress indicator: "Creating server... ⏳ Installing Rachel8... ⏳ Ready! ✅"
- Webhook from backend to dashboard to update status in real-time

**Phase:** MVP Phase 1

---

### 23. Simultaneous VPS Deployments Overwhelm Hetzner API
**Trap:** 50 users sign up during Product Hunt launch. You spawn 50 parallel Hetzner API calls. API rate limited. All fail.

**Why it happens:**
- No rate limiting on your side
- Hetzner API has undocumented rate limit
- No queue or backoff

**How to avoid:**
- Implement provisioning queue with concurrency limit (5 simultaneous)
- Exponential backoff on Hetzner API 429 responses
- Respect `RateLimit-*` headers if present
- Monitor provisioning queue depth
- Auto-scale queue workers based on demand

**Phase:** Phase 2

---

### 24. Health Checks Create Thundering Herd on Boot
**Trap:** You restart all VPS for security update. All 1000 boot simultaneously. All hit Anthropic API for health check. Rate limited. All marked unhealthy. Restart loop.

**Why it happens:**
- No staggered startup
- Health check runs immediately on boot
- No grace period

**How to avoid:**
- Random delay (0-300s) before first health check
- Stagger restarts: 10 servers per minute
- Grace period: 5 minutes after boot before health checks count
- Deep health check (API call) only every 5 minutes, not every 30s

**Phase:** Phase 2

---

## Security Mistakes

### 25. Unauthenticated VPS SSH Access
**Mistake:** You inject root password during cloud-init for "easier debugging". User's VPS gets brute-forced, used for crypto mining.

**Why it happens:**
- SSH password auth enabled by default in base image
- Weak password or shared password across VPS
- No fail2ban or rate limiting
- SSH on port 22 exposed to internet

**How to avoid:**
- Disable password auth: `PasswordAuthentication no` in sshd_config
- SSH key only (user's key + platform key)
- Change SSH to non-standard port (e.g., 2222)
- Install fail2ban in cloud-init
- Firewall: Allow SSH only from user IP (optional) or use bastion
- Monitor auth logs for brute force attempts

**Phase:** MVP Phase 1

---

### 26. API Keys in Environment Variables Leak via /proc
**Mistake:** You store Anthropic API key in env var `ANTHROPIC_API_KEY`. Other process on VPS can read `/proc/1/environ` and steal it.

**Why it happens:**
- Single-user VPS, assumed no other processes
- Environment variables readable by all processes
- No isolation between services

**How to avoid:**
- Load API keys from encrypted file, not env vars
- Use secrets management (systemd credentials, HashiCorp Vault)
- Set file permissions 600 on key file
- Run Rachel8 as non-root user
- Encrypt at rest with kernel keyring

**Phase:** Phase 2 (for sensitive deployments)

---

### 27. Dashboard Allows IDOR to View Other Users' Logs
**Mistake:** Dashboard endpoint `/api/logs?user_id=123` trusts query parameter. Attacker changes to `user_id=124`, sees other user's conversations.

**Why it happens:**
- No authorization check on user_id parameter
- Trusting client-provided user identifier
- Session doesn't validate user_id ownership

**How to avoid:**
- Get user_id from session, never from query parameter
- Validate `session.user_id == resource.owner_id`
- Implement RBAC middleware
- Audit all data access endpoints
- Parameterized queries to prevent SQL injection

**Phase:** MVP Phase 1

---

### 28. Stripe Webhook Signature Not Validated
**Mistake:** You accept Stripe webhook POST without verifying signature. Attacker sends fake "subscription.created" event, gets free VPS.

**Why it happens:**
- Skipped signature verification "to ship faster"
- Webhook secret not configured
- Copy-pasted code without understanding

**How to avoid:**
- Always verify webhook signature: `stripe.webhooks.constructEvent(body, sig, secret)`
- Use Stripe webhook secret from environment variable
- Reject webhooks with invalid signature
- Log and alert on signature failures
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks`

**Phase:** MVP Phase 1

---

### 29. User Telegram Bot Token Stored in Dashboard Client
**Mistake:** User's BotFather token sent to browser, stored in localStorage. XSS attack steals it, attacker takes over bot.

**Why it happens:**
- Frontend fetches bot config including token
- Token stored client-side for "convenience"
- No token encryption

**How to avoid:**
- Never send full bot token to client
- Show only last 4 characters: `******789:ABC`
- Store token server-side only
- Encrypt in database
- Use token only on VPS, not in dashboard API

**Phase:** MVP Phase 1

---

### 30. No GDPR Compliance for Conversation Logs
**Mistake:** You store all user conversations indefinitely. EU user requests deletion. You don't have data deletion flow. €20M fine.

**Why it happens:**
- No data retention policy
- Assumed "logs are ours"
- Didn't implement GDPR deletion (Right to be Forgotten)

**How to avoid:**
- Implement data deletion API: Delete user + VPS + logs
- Anonymize logs after 90 days (remove user_id, replace with hash)
- Auto-delete conversation history >1 year old
- Provide "Download my data" export (JSON)
- Document data retention in Privacy Policy
- DPA (Data Processing Agreement) for EU users
- Subprocessor list: Hetzner, Stripe, Anthropic

**Phase:** MVP Phase 2, Phase 3 (GDPR compliance for EU launch)

**Sources:**
- [GDPR for SaaS Companies: Complete Compliance Guide](https://complydog.com/blog/gdpr-for-saas-companies-complete-compliance-guide)
- [Multi-Tenant SaaS Privacy: Complete Data Isolation and Compliance Architecture](https://complydog.com/blog/multi-tenant-saas-privacy-data-isolation-compliance-architecture)
- [SaaS Privacy Compliance Requirements: Complete 2025 Guide](https://secureprivacy.ai/blog/saas-privacy-compliance-requirements-2025-guide)

---

## UX Pitfalls

### 31. User Doesn't Understand Why Bot Stopped Working
**Problem:** Stripe payment fails. VPS paused. User sends message, no response. No explanation in Telegram. User churns.

**Why it happens:**
- No notification sent to user
- Telegram bot can't explain (server down)
- Dashboard login required to see status

**How to fix:**
- Email notification: "Payment failed, bot paused"
- SMS alert for critical issues (optional)
- Telegram message from platform account: "Your Rachel bot is paused due to payment. Update card at dashboard.rachel.cloud"
- Grace period: 7 days before pause
- Dunning emails on day 1, 3, 5, 7

**Phase:** Phase 2

---

### 32. No Onboarding Validation of Telegram Bot Token
**Problem:** User enters invalid BotFather token during setup. Provision succeeds. Bot never works. User doesn't know why.

**Why it happens:**
- No validation of token before provisioning
- Webhook setup fails silently
- User assumes it's working

**How to fix:**
- Validate token during signup: `GET https://api.telegram.org/bot{token}/getMe`
- Show bot username and photo: "Is this your bot? @rachel_bot_123"
- Test webhook setup before marking provision complete
- Guided onboarding: "Send /start to your bot. Did you get a response?"
- Health check includes Telegram webhook validation

**Phase:** MVP Phase 1

---

### 33. Dashboard Shows "Running" but Bot is Crashed
**Problem:** VPS is up. SSH works. But Rachel8 process crashed 2 hours ago. Dashboard still says "Running ✅". User confused.

**Why it happens:**
- Health check only pings VPS, doesn't check process
- No process monitoring (systemd status not checked)
- Dashboard shows VPS state, not application state

**How to fix:**
- Health check calls Rachel8 HTTP endpoint `/health`
- Systemd integration: `systemctl is-active rachel8`
- Dashboard shows both: VPS (🟢 Online) + Rachel8 (🔴 Crashed)
- Alert user when process crashes
- Auto-restart via systemd on crash

**Phase:** Phase 2

---

### 34. User Hits Rate Limit, Doesn't Know Why Messages Delayed
**Problem:** User sends 60 messages in 1 minute. Claude API rate limited. Bot stops responding. User thinks it's broken.

**Why it happens:**
- No user feedback when rate limited
- Silent failures
- User doesn't understand rate limits

**How to fix:**
- Telegram message: "You're sending messages too fast. Please wait 30 seconds."
- Dashboard shows rate limit status: "48/50 requests used this minute"
- Queue messages and process when limit resets
- Educate in docs: "Tier 1 limits: 50 requests/minute"
- Suggest upgrade: "Upgrade to Tier 2 for 1000 RPM"

**Phase:** Phase 2

---

### 35. No Way to Debug Why Bot Isn't Responding
**Problem:** User reports "bot not working". You ask for logs. They don't know how to get them. Support burden high.

**Why it happens:**
- No self-service debugging
- Logs only accessible via SSH
- Dashboard doesn't show recent errors

**How to fix:**
- Dashboard "Logs" tab: Last 100 messages, errors highlighted
- "Test Bot" button: Send test message, see response time
- Status page: Anthropic API ✅, Telegram API ✅, VPS ✅
- Download logs button (last 24 hours)
- "Troubleshooting" guide in docs with common issues

**Phase:** Phase 2

---

## "Looks Done But Isn't" Checklist

These are features that seem complete in MVP but have hidden complexity that will bite you in production:

### 36. ✅ VPS Provisioning (Looks Done)
**Actually Missing:**
- [ ] Idempotency (retries create duplicates)
- [ ] Orphan cleanup (failed provisions leave VPS)
- [ ] Data center fallback (capacity exhaustion)
- [ ] Timeout handling (stuck in "provisioning" forever)
- [ ] Concurrent provision throttling (50 signups → API rate limit)
- [ ] Rollback on partial failure (server created but DNS failed)

**Phase:** MVP Phase 1 (basic), Phase 2 (edge cases)

---

### 37. ✅ Stripe Integration (Looks Done)
**Actually Missing:**
- [ ] Webhook retry handling (network failures)
- [ ] Idempotency keys (duplicate charges on retry)
- [ ] Past-due subscription handling (pause VPS after grace period)
- [ ] Cancellation edge cases (refund? prorated?)
- [ ] Failed payment recovery (dunning emails)
- [ ] Subscription paused → resumed flow
- [ ] Coupon/discount support
- [ ] Annual plan handling
- [ ] Metered billing (usage-based)
- [ ] Tax calculation (Stripe Tax)

**Phase:** MVP Phase 1 (basic), Phase 2-3 (edge cases)

---

### 38. ✅ Health Monitoring (Looks Done)
**Actually Missing:**
- [ ] Shallow vs deep health checks
- [ ] Exponential backoff on failures
- [ ] Jitter on auto-recovery
- [ ] Circuit breaker for external dependencies
- [ ] Correlated failure detection
- [ ] Rate limit on recovery actions
- [ ] Grace period after boot
- [ ] Alert escalation (first failure → warn, 3rd → page)

**Phase:** Phase 2

---

### 39. ✅ OAuth Integration (Looks Done)
**Actually Missing:**
- [ ] Token refresh flow
- [ ] Token expiration handling
- [ ] Re-authentication prompt
- [ ] Scope validation
- [ ] PKCE enforcement
- [ ] State parameter CSRF protection
- [ ] Redirect URI exact matching
- [ ] Auth code single-use enforcement

**Phase:** MVP Phase 1 (refresh flow), Phase 2 (security hardening)

---

### 40. ✅ Telegram Webhook (Looks Done)
**Actually Missing:**
- [ ] SSL certificate validation
- [ ] DNS propagation wait
- [ ] Webhook secret verification
- [ ] Fallback to long polling
- [ ] Per-chat rate limiting
- [ ] Retry-after header handling
- [ ] Webhook error monitoring
- [ ] Certificate auto-renewal

**Phase:** MVP Phase 1 (SSL), Phase 2 (monitoring)

---

## Pitfall-to-Phase Mapping

### MVP Phase 1 (Launch Blockers)
**Must fix before any users:**
- #1: Cloud-init validation
- #2: Hetzner error handling
- #3: Stripe webhook handlers
- #4: API key encryption
- #6: Telegram SSL setup
- #7: Basic rate limit queue
- #8: VPS tagging and basic cleanup
- #10: PKCE enforcement
- #14: SSH key injection
- #18: Stripe mode validation
- #20: OAuth token refresh
- #22: Background provisioning queue
- #25: SSH security hardening
- #27: Authorization checks (IDOR)
- #28: Webhook signature validation
- #29: Token storage security
- #32: Telegram token validation

### Phase 2 (Scaling & Reliability)
**Required before 100 users:**
- #1: Cloud-init monitoring (extend)
- #2: Data center fallback
- #3: Stripe reconciliation
- #5: Advanced health checks
- #7: Claude tier detection
- #8: Daily reconciliation job
- #12: Log rotation and streaming
- #13: Connection pooling
- #15: Hetzner API monitoring
- #16: Per-chat rate limiting
- #17: Prompt caching optimization
- #21: Database indexing
- #23: Provisioning concurrency control
- #24: Staggered health checks
- #26: Secrets management
- #30: Basic GDPR (data deletion)
- #31: User notifications
- #32: Onboarding validation
- #33: Process monitoring
- #34: Rate limit UX
- #35: Self-service debugging

### Phase 3 (Growth & Optimization)
**Required before 500 users:**
- #4: BYOK for enterprise
- #5: Circuit breaker pattern
- #7: Advanced prompt caching
- #9: Tiered pricing strategy
- #19: High availability (if needed)
- #30: Full GDPR compliance for EU

### Phase 4 (Strategic Pivot)
**If economics don't work:**
- #9: Multi-tenant migration
- Auto-pause for idle agents
- Usage-based pricing models

---

## Sources

### Infrastructure & Provisioning
- [How to debug cloud-init - cloud-init 25.3 documentation](https://cloudinit.readthedocs.io/en/latest/howto/debugging.html)
- [Failure states - cloud-init 25.3 documentation](https://cloudinit.readthedocs.io/en/latest/explanation/failure_states.html)
- [Troubleshoot using cloud-init - Azure Virtual Machines](https://learn.microsoft.com/en-us/azure/virtual-machines/linux/cloud-init-troubleshooting)
- [Hetzner Cloud API overview](https://docs.hetzner.cloud/)
- [Changelog - Hetzner Cloud API](https://docs.hetzner.cloud/changelog)
- [HetznerCloud reports Cloud capacity reached in error](https://github.com/jenkinsci/hetzner-cloud-plugin/issues/21)
- [Idempotency in Infrastructure as Code](https://techlinkhub.xyz/blog/idempotency-in-infrastructure-as-code)
- [Building a Budget-Friendly Lab VPS Platform – Part 5: When Things Break](https://byrnbaker.me/posts/Lab-VPS-part5/)
- [Orphaned resource allocations — nova documentation](https://docs.openstack.org/nova/latest/admin/troubleshooting/orphaned-allocations.html)
- [Virtual machine stuck in failed state](https://learn.microsoft.com/en-us/troubleshoot/azure/virtual-machines/windows/vm-stuck-in-failed-state)

### Billing & Payments
- [Automate payment retries | Stripe Documentation](https://docs.stripe.com/billing/revenue-recovery/smart-retries)
- [How subscriptions work | Stripe Documentation](https://docs.stripe.com/billing/subscriptions/overview)
- [Stripe Subscription Failed Payments How-To](https://recoverpayments.com/stripe-subscription-failed-payment/)

### Security & Compliance
- [OAuth 2.0 Common Security Flaws and Prevention Techniques](https://www.apisec.ai/blog/oauth-2-0-common-security-flaws)
- [Common OAuth Vulnerabilities · Doyensec's Blog](https://blog.doyensec.com/2025/01/30/oauth-common-vulnerabilities.html)
- [PKCE in OAuth 2.0: How to Protect Your API from Attacks](https://www.authgear.com/post/pkce-in-oauth-2-0-how-to-protect-your-api-from-attacks)
- [Demystifying AWS KMS key operations, bring your own key (BYOK)](https://aws.amazon.com/blogs/security/demystifying-kms-keys-operations-bring-your-own-key-byok-custom-key-store-and-ciphertext-portability/)
- [Allow customers to bring their own key (BYOK) to encrypt their data](https://edgebit.io/solutions/bring-your-own-key/)
- [GDPR for SaaS Companies: Complete Compliance Guide](https://complydog.com/blog/gdpr-for-saas-companies-complete-compliance-guide)
- [Multi-Tenant SaaS Privacy: Complete Data Isolation and Compliance Architecture](https://complydog.com/blog/multi-tenant-saas-privacy-data-isolation-compliance-architecture)
- [SaaS Privacy Compliance Requirements: Complete 2025 Guide](https://secureprivacy.ai/blog/saas-privacy-compliance-requirements-2025-guide)

### Monitoring & Reliability
- [Implementing health checks | AWS Builders Library](https://aws.amazon.com/builders-library/implementing-health-checks/)
- [Kubernetes Liveness Probes: Tutorial & Critical Best Practices](https://codefresh.io/learn/kubernetes-management/kubernetes-liveness-probes/)
- [Your Uptime Monitoring Is Broken By Design](https://codematters.medium.com/your-uptime-monitoring-is-broken-by-design-1312c511093f)

### AI Agent & API Integration
- [Rate limits - Claude API Docs](https://platform.claude.com/docs/en/api/rate-limits)
- [How to Fix Claude API 429 Rate Limit Error: Complete Guide 2026](https://www.aifreeapi.com/en/posts/claude-api-429-error-fix)
- [How AI Agents Are Changing API Rate Limit Approaches](https://nordicapis.com/how-ai-agents-are-changing-api-rate-limit-approaches/)
- [AI Agent Production Costs 2026](https://www.agentframeworkhub.com/blog/ai-agent-production-costs-2026)

### Telegram Bot Integration
- [Marvin's Marvellous Guide to All Things Webhook](https://core.telegram.org/bots/webhooks)
- [Bots FAQ](https://core.telegram.org/bots/faq)
- [How to solve rate limit errors from Telegram Bot API](https://gramio.dev/rate-limits)
- [Why My Telegram Bot Is Not Responding and How to Fix It Fast](https://membertel.com/blog/why-my-telegram-bot-is-not-responding/)

### VPS Hosting & Performance
- [Common VPS Hosting Issues and Fixes: Top 5 Problems Solved](https://virtarix.com/blog/five-common-vps-hosting-issues-and-fixes/)
- [Dedicated Server Pricing Explained](https://www.hostpapa.com/blog/web-hosting/dedicated-server-pricing-explained/)
- [Cloud Server Hosting Price Breakdown](https://www.bluehost.com/blog/cloud-server-hosting-price/)

---

**End of Pitfalls Research**
