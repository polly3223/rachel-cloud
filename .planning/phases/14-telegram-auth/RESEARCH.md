# Phase 14 Research: Telegram-Only Authentication

## The Pivot

Replace the entire web-based auth system (Better Auth, Google OAuth, email/password, sessions, cookies) with Telegram as the sole authentication mechanism.

**New model:** One shared Rachel Telegram bot. Users message it directly. Each user is identified by their Telegram user ID, which becomes the primary key for all user data.

## Current Auth Stack (to be removed)

### Better Auth
- `src/lib/auth/config.ts` — Better Auth setup with Polar plugins
- `src/lib/auth/client.ts` — Frontend auth client
- `src/lib/auth/session.ts` — Session management utilities
- `src/lib/auth/rate-limit.ts` — Rate limiting middleware

### Claude OAuth (to be removed)
- `src/lib/auth/claude-oauth.ts` — Claude OAuth 2.0 + PKCE flow
- `src/lib/auth/claude-token-manager.ts` — Token refresh logic
- `claudeTokens` table — encrypted OAuth tokens

### Better Auth DB Tables
- `user` — name, email, image
- `session` — session tokens, expiry
- `account` — OAuth provider accounts
- `verification` — email verification tokens

### Web Routes Affected
- `/login` — login page
- `/signup` — signup page
- `/api/auth/*` — Better Auth API routes
- `(app)` route group — all authenticated app pages use session middleware
- `(admin)` route group — uses session + admin email check

## New Auth Model

### How It Works
1. User finds Rachel bot on Telegram (public bot, e.g., @RachelAIBot)
2. User sends `/start` → Rachel responds with welcome + subscription prompt
3. User subscribes via Polar link (contains their Telegram user ID as metadata)
4. Polar webhook confirms payment → we create their container
5. All subsequent messages go to their container
6. No web dashboard needed for basic usage

### User Identity
- **Primary key:** Telegram user ID (integer, unique, permanent)
- **Profile data:** first_name, last_name, username, language_code (from Telegram)
- **No email required** (but Polar may provide one from payment)

### Message Routing
The shared Rachel bot receives ALL messages. Router logic:
1. Extract `telegram_user_id` from incoming update
2. Look up user in DB → find their `container_id`
3. Forward message to that user's container (via Docker network or orchestrator API)
4. Container processes and responds
5. Response goes back through the shared bot to the user's chat

### Subscription Flow
1. User sends `/start` to Rachel bot
2. Rachel responds: "Hi! I'm Rachel, your AI assistant. Subscribe for $20/mo to get started"
3. Provides Polar checkout link with `?metadata[telegram_id]=12345`
4. User pays → Polar webhook fires → we provision container
5. Rachel confirms: "You're all set! Just message me anything."

### Admin Access
- Admin identified by Telegram user ID (env var `ADMIN_TELEGRAM_ID`)
- Admin commands via Telegram: `/admin users`, `/admin containers`, etc.
- OR keep minimal web admin dashboard (auth via Telegram Login Widget)

### What Happens to the Web App?
**Keep it, but simplify auth.** Replace Better Auth with Telegram Login Widget:
- Landing page (public, with "Log in with Telegram" button for existing users)
- User dashboard (status, logs, restart, billing) — auth via Telegram Login Widget
- Admin dashboard — auth via Telegram Login Widget + admin telegram_id check
- Polar checkout page — receives telegram_id from session
- API endpoints for Polar webhooks + orchestrator

### Telegram Login Widget
Official Telegram auth for websites. User clicks "Log in with Telegram" → confirms in Telegram app → website receives user data (id, first_name, username, photo_url) + HMAC-SHA256 hash for verification.

**Setup:**
1. Create bot via @BotFather (use same shared Rachel bot)
2. `/setdomain` to link get-rachel.com to the bot
3. Embed widget JS on login page
4. Verify hash server-side: `HMAC-SHA256(data_check_string, SHA256(bot_token)) == hash`
5. Create lightweight session (cookie with telegram_id, signed)

**Data returned:**
- `id` (telegram user ID — this becomes our primary key)
- `first_name`, `last_name`, `username`, `photo_url`
- `auth_date` (Unix timestamp — check for freshness)
- `hash` (HMAC-SHA256 for verification)

### Telegram Commands (in-bot UX)
Users can also manage basic things via bot commands:
- `/status` → container status, uptime
- `/restart` → restart container
- `/logs` → recent log lines
- `/billing` → subscription info, link to web dashboard for payment
- `/help` → available commands

## Architecture Change

### Before (v1/v2)
```
User → Web signup → Pay → Create Telegram bot → Deploy container
         ↓
      Session cookie
         ↓
      Web dashboard → API → Orchestrator → Container
```

### After (v3)
```
User → Message @RachelAI on Telegram → /start → Get link to web dashboard
                ↓
         Web dashboard (Telegram Login Widget) → Pay via Polar → Container deployed
                ↓
         Back on Telegram: shared bot → Router → User's Container → Response
                ↓
         Web dashboard also available for: status, logs, restart, billing
```

## Key Decisions Needed

1. **One bot or user-created bots?**
   - Current: User creates their own bot via BotFather
   - Proposed: Single shared @RachelAI bot
   - Implication: Need message routing, but much simpler onboarding
   - **Trade-off:** User doesn't "own" their bot, but 99% don't care

2. **How do containers receive messages?**
   - Option A: Shared bot → HTTP forward to container's internal port
   - Option B: Shared bot → write to Redis/queue → container polls
   - Option C: Each container still has its own bot token (keep current model)
   - **Recommendation:** Option A — simplest, orchestrator already knows container IPs

3. **Keep web dashboard?**
   - ✅ **DECIDED: Yes** — keep full web dashboard for payments, status, logs, billing
   - Auth via Telegram Login Widget (replaces Better Auth)
   - Admin dashboard also via Telegram Login Widget + admin telegram_id env check

4. **Keep landing page?**
   - Yes — still needed for marketing, SEO, explaining the product
   - CTA: "Message @RachelAI on Telegram" + "Log in" via Telegram Login Widget

## Database Schema Changes

### Remove
- `user` table (Better Auth) → replaced by `users` table keyed on telegram_id
- `session` table
- `account` table
- `verification` table
- `claudeTokens` table
- VPS columns from subscriptions

### New/Modified
```sql
CREATE TABLE users (
  telegram_id INTEGER PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  username TEXT,
  language_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  telegram_id INTEGER NOT NULL REFERENCES users(telegram_id),
  polar_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'none', -- none, active, grace_period, canceled
  container_id TEXT,
  container_name TEXT,
  current_image TEXT,
  provisioned BOOLEAN DEFAULT FALSE,
  provisioning_status TEXT DEFAULT 'pending',
  provisioned_at TIMESTAMP,
  grace_period_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Dependencies to Remove
- `better-auth` + `@better-auth/*` plugins
- `@polar-sh/better-auth` (replace with direct Polar SDK webhook handling)
- Google OAuth config (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)

## Dependencies to Add
- None — Telegram Login Widget is a client-side JS embed, hash verification is pure crypto (built-in)

## Estimated Scope
- **Remove:** ~2,000 LOC (Better Auth, Claude OAuth, login/signup pages, Google OAuth)
- **Add:** ~800 LOC (Telegram Login Widget auth, session management, message router, bot commands, Polar webhook rewrite)
- **Modify:** Landing page, dashboard auth guards, admin auth, Polar integration, onboarding
- **Keep:** User dashboard, admin dashboard, billing pages (just change auth method)
- **Impact:** Simpler auth stack, better UX (one-click Telegram login), no passwords/emails
