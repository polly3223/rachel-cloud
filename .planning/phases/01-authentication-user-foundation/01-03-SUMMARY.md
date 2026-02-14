---
phase: 01-authentication-user-foundation
plan: 03
subsystem: claude-oauth

tags: [claude-oauth, pkce, aes-256-gcm, token-refresh, sveltekit]

# Dependency graph
requires: [01-01]
provides:
  - Claude OAuth 2.0 + PKCE authentication flow
  - Encrypted Claude token storage with auto-refresh
  - Claude connection dashboard UI
  - Token management API endpoints
affects: [telegram-bot, ai-features]

# Tech tracking
tech-stack:
  added: [pkce-challenge]
  patterns: [oauth2-pkce, auto-token-refresh, encrypted-token-storage]

key-files:
  created:
    - src/lib/auth/session.ts
    - src/lib/auth/claude-oauth.ts
    - src/lib/auth/claude-token-manager.ts
    - src/routes/api/claude/connect/+server.ts
    - src/routes/api/claude/callback/+server.ts
    - src/routes/api/claude/refresh/+server.ts
    - src/routes/api/claude/disconnect/+server.ts
    - src/routes/dashboard/claude/+page.server.ts
    - src/routes/dashboard/claude/+page.svelte
  modified:
    - package.json (added pkce-challenge)

key-decisions:
  - "Use pkce-challenge library for PKCE code verifier/challenge generation"
  - "Store PKCE verifier in HTTP-only cookie with 5-minute expiry"
  - "Auto-refresh tokens with 5-minute expiration buffer for safety"
  - "Create session helper independently (Plan 01-02 running in parallel)"
  - "Add disconnect endpoint for token removal (not in original plan)"
  - "Use Claude OAuth endpoints from claude-code-login reference"

patterns-established:
  - "Token manager: transparent auto-refresh when tokens expire"
  - "PKCE flow: secure OAuth 2.0 with code challenge/verifier"
  - "Session helper: requireAuth() for route protection"
  - "Dashboard pattern: server load function + Svelte UI"
  - "Error handling: graceful failures with user-friendly messages"

# Metrics
duration: 25min
completed: 2026-02-14
---

# Phase 01-03: Claude OAuth 2.0 + PKCE Integration Summary

**Complete Claude OAuth flow with PKCE, encrypted token storage, and auto-refresh mechanism**

## Performance

- **Duration:** ~25 minutes
- **Started:** 2026-02-14
- **Completed:** 2026-02-14
- **Tasks:** 3
- **Files created:** 9
- **Files modified:** 1

## Accomplishments

- Claude OAuth 2.0 client with PKCE flow implementation
- Secure token storage with AES-256-GCM encryption
- Automatic token refresh when expired (5-minute buffer)
- Full OAuth flow: connect, callback, refresh, disconnect endpoints
- Claude connection dashboard UI with Tailwind CSS
- Session helper for route protection

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Claude OAuth 2.0 + PKCE client** - `630010b` (feat)
2. **Task 2: Create OAuth initiation and callback endpoints** - `c51a63b` (feat)
3. **Task 3: Implement auto-refresh mechanism and connection UI** - `1d92958` (feat)

## Files Created/Modified

### Core OAuth Implementation
- `src/lib/auth/claude-oauth.ts` - Claude OAuth 2.0 client with PKCE
  - `generateAuthUrl()` - Creates auth URL with PKCE challenge
  - `exchangeCode()` - Exchanges auth code for tokens
  - `refreshToken()` - Refreshes expired tokens
- `src/lib/auth/claude-token-manager.ts` - Token management with auto-refresh
  - `getValidToken()` - Returns valid token, auto-refreshes if expired
- `src/lib/auth/session.ts` - Session helpers (created for this plan)
  - `requireAuth()` - Route protection with Better Auth

### API Endpoints
- `src/routes/api/claude/connect/+server.ts` - Initiates OAuth flow
  - Generates PKCE challenge
  - Stores verifier in HTTP-only cookie
  - Redirects to Claude authorization
- `src/routes/api/claude/callback/+server.ts` - Handles OAuth callback
  - Exchanges code for tokens using PKCE
  - Encrypts and stores tokens in database
  - Clears PKCE verifier cookie
- `src/routes/api/claude/refresh/+server.ts` - Manual token refresh
  - Calls `getValidToken()` to trigger refresh
  - Returns updated expiration time
- `src/routes/api/claude/disconnect/+server.ts` - Disconnect account
  - Deletes stored tokens from database

### Dashboard UI
- `src/routes/dashboard/claude/+page.server.ts` - Server-side connection status
  - Loads Claude connection status
  - Returns expiration timestamp
- `src/routes/dashboard/claude/+page.svelte` - Claude connection interface
  - Connection status display
  - Connect/disconnect/refresh buttons
  - Security information section
  - Success/error message handling

### Dependencies
- `package.json` - Added pkce-challenge dependency
- `bun.lock` - Updated with new dependency

## Decisions Made

1. **PKCE library:** Used `pkce-challenge` for standards-compliant PKCE implementation (generates code_verifier and code_challenge)

2. **Session helper:** Created `src/lib/auth/session.ts` independently since Plan 01-02 runs in parallel (no dependency on 01-02's files)

3. **PKCE storage:** Store code_verifier in HTTP-only cookie with 5-minute expiry (one-time use, cleared after callback)

4. **Auto-refresh buffer:** Refresh tokens 5 minutes before expiration to prevent edge-case failures

5. **Disconnect endpoint:** Added `/api/claude/disconnect` endpoint (not in original plan) to support UI disconnect button

6. **Claude OAuth endpoints:** Used endpoints from claude-code-login reference:
   - Authorization: `https://claude.ai/oauth/authorize`
   - Token: `https://claude.ai/oauth/token`
   - **NOTE:** These may need updating when testing with real Claude accounts

## Deviations from Plan

### Additions (Scope expansion)

**1. [Enhancement] Added disconnect endpoint**
- **Why:** UI needed ability to disconnect Claude account
- **Implementation:** Created `/api/claude/disconnect` endpoint
- **Files added:** `src/routes/api/claude/disconnect/+server.ts`
- **Impact:** Better user experience, no breaking changes
- **Committed in:** 1d92958 (Task 3 commit)

**2. [Independence] Created session helper independently**
- **Why:** Plan 01-02 runs in parallel, can't depend on its files
- **Implementation:** Created `src/lib/auth/session.ts` with `requireAuth()`
- **Files added:** `src/lib/auth/session.ts`
- **Impact:** No conflicts expected, may merge with 01-02 later
- **Committed in:** 630010b (Task 1 commit)

---

**Total deviations:** 2 additions (both scope expansions for better UX)
**Impact on plan:** Minimal - all planned features completed plus extras

## Implementation Details

### OAuth 2.0 + PKCE Flow

1. **Initiation** (`/api/claude/connect`)
   - User clicks "Connect Claude Account"
   - Server generates PKCE challenge using `pkce-challenge`
   - Code verifier stored in HTTP-only cookie (5-min expiry)
   - User redirected to Claude authorization page

2. **Authorization**
   - User authorizes Rachel Cloud on Claude
   - Claude redirects back with authorization code

3. **Callback** (`/api/claude/callback`)
   - Extract authorization code from query params
   - Retrieve PKCE verifier from cookie
   - Exchange code + verifier for tokens
   - Encrypt access_token and refresh_token with AES-256-GCM
   - Store encrypted tokens in database
   - Clear PKCE verifier cookie
   - Redirect to dashboard with success message

4. **Auto-refresh** (`getValidToken()`)
   - Check if token expires within 5 minutes
   - If expired, decrypt refresh_token
   - Call Claude token endpoint with refresh_token
   - Encrypt and store new tokens
   - Return valid access_token

### Security Features

- **PKCE:** Prevents authorization code interception attacks
- **AES-256-GCM:** Military-grade encryption for token storage
- **HTTP-only cookies:** PKCE verifier not accessible to JavaScript
- **One-time verifier:** Cleared immediately after callback
- **Auto-refresh buffer:** 5-minute buffer prevents edge cases
- **Session required:** All endpoints require authenticated session

## User Setup Required

**External services require manual configuration.** Users must:

### Claude OAuth Setup
1. Register OAuth application with Anthropic
   - Follow pattern from github.com/grll/claude-code-login
   - Location: Claude console (when available)
2. Set redirect URI: `http://localhost:5173/api/claude/callback`
3. Copy credentials to `.env`:
   - `CLAUDE_CLIENT_ID`
   - `CLAUDE_CLIENT_SECRET`

### Environment Variables
Add to `.env`:
```bash
# Claude OAuth (from Claude dashboard)
CLAUDE_CLIENT_ID=your_client_id
CLAUDE_CLIENT_SECRET=your_client_secret

# Already set in 01-01
PUBLIC_BASE_URL=http://localhost:5173
ENCRYPTION_KEY=<base64-32-byte-key>
```

All setup instructions should be documented in `.env.example`.

## Testing Notes

**Manual testing required:**
1. OAuth flow cannot be fully tested until Claude OAuth is available
2. Endpoints use placeholder Claude OAuth URLs from claude-code-login
3. May need to update OAuth endpoints when Claude publishes official docs

**Test cases when Claude OAuth is available:**
1. Full OAuth flow: connect → authorize → callback → store tokens
2. Token encryption: verify tokens are encrypted in database
3. Auto-refresh: manually expire token, verify getValidToken() refreshes
4. PKCE security: attempt callback without verifier, verify it fails
5. Disconnect: verify tokens are deleted from database
6. UI states: test connected/disconnected states, success/error messages

## Next Phase Readiness

**Ready for future Claude API integration:**
- ✅ OAuth 2.0 + PKCE flow implemented
- ✅ Encrypted token storage with auto-refresh
- ✅ `getValidToken()` function for API calls
- ✅ Dashboard UI for connection management
- ✅ All security best practices implemented

**Blockers:**
- ⚠️ Claude OAuth endpoints may need updating (using claude-code-login reference)
- ⚠️ Requires CLAUDE_CLIENT_ID and CLAUDE_CLIENT_SECRET from Anthropic

**Future improvements:**
- Add scope parameter to OAuth flow if Claude requires it
- Implement token revocation endpoint
- Add activity logging for security auditing
- Consider multi-account support (future feature)

---
*Phase: 01-authentication-user-foundation*
*Plan: 03*
*Completed: 2026-02-14*
