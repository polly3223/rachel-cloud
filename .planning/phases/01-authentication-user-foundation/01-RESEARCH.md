# Phase 1: Authentication & User Foundation - Research

**Researched:** 2026-02-14
**Domain:** Authentication, OAuth 2.0, Session Management
**Confidence:** HIGH

## Summary

Phase 1 establishes secure user authentication for Rachel Cloud, supporting email/password signup, Google OAuth, Claude OAuth 2.0 with PKCE, and encrypted token storage. Research reveals that **Better Auth** is the current standard for Bun + Hono authentication in 2026, providing a comprehensive, framework-agnostic solution with built-in support for all required authentication methods.

The recommended stack combines Better Auth with Drizzle ORM (PostgreSQL), implementing OAuth 2.0 + PKCE for Claude integration, AES-256-GCM encryption at the application layer for token storage, and HTTP-only cookies for session management. Claude's OAuth implementation uses tokens that expire after 8-12 hours, requiring proactive refresh mechanisms to maintain long-running sessions.

**Primary recommendation:** Use Better Auth with Drizzle ORM adapter, PostgreSQL for data persistence, application-level AES-256-GCM encryption for OAuth tokens, and HTTP-only cookies for session tokens. Implement proactive token refresh 5-10 minutes before expiration to prevent disruptions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Better Auth | 1.4+ | Authentication framework | Most comprehensive TypeScript auth framework in 2026; actively maintained (Lucia archived); built-in support for email/password, OAuth, sessions, 2FA, and 40+ providers |
| Drizzle ORM | Latest | Database ORM | TypeScript-first, lightweight (~7.4kb), zero dependencies; native Bun support; excellent PostgreSQL integration |
| PostgreSQL | 14+ | Primary database | Industry standard for relational data; native Better Auth adapter; robust support for encryption extensions |
| Hono | Latest | Web framework | Fast, lightweight framework with first-class Bun support; Better Auth has native Hono integration |
| Node.js Crypto | Native | Encryption | Built-in AES-256-GCM support; no external dependencies; production-ready |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hono/clerk-auth | Latest | Alternative auth | If using Clerk instead of Better Auth (not recommended for this stack) |
| hono-rate-limiter | Latest | Rate limiting | Essential for auth endpoints to prevent brute force attacks |
| pkce-challenge | Latest | PKCE generation | Helper for OAuth 2.0 PKCE implementation; generates code_verifier and code_challenge |
| dotenv | Latest | Environment variables | Development only; use secrets manager in production |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | Lucia Auth | Lucia is archived (2026); maintainer stepped back from development |
| Better Auth | Clerk | Paid service; vendor lock-in; but managed solution reduces maintenance burden |
| Better Auth | Auth.js | More complex setup; Better Auth provides simpler API and better TypeScript support |
| Drizzle ORM | Prisma | Prisma is more mature but heavier; Drizzle is faster and more lightweight |
| Application-level encryption | pgcrypto | pgcrypto doesn't natively support AES-256-GCM mode; application-level provides more control |

**Installation:**
```bash
# Core dependencies
bun add better-auth drizzle-orm postgres
bun add -d drizzle-kit

# Supporting libraries
bun add hono-rate-limiter pkce-challenge
bun add -d @types/node
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── auth/
│   ├── config.ts           # Better Auth configuration
│   ├── routes.ts           # Auth API routes (Hono)
│   ├── session.ts          # Session management utilities
│   ├── encryption.ts       # AES-256-GCM token encryption
│   └── providers/
│       ├── google.ts       # Google OAuth config
│       └── claude.ts       # Claude OAuth + PKCE implementation
├── db/
│   ├── schema.ts           # Drizzle schema definitions
│   ├── migrations/         # Database migrations
│   └── index.ts            # Database connection
├── middleware/
│   ├── auth.ts             # Auth middleware for protected routes
│   └── rate-limit.ts       # Rate limiting configuration
└── routes/
    └── api/
        └── auth.ts         # Auth routes mounted under /api/auth
```

### Pattern 1: Better Auth + Hono Integration
**What:** Mount Better Auth handler as Hono middleware for all auth operations
**When to use:** All authentication flows (signup, login, OAuth, sessions)
**Example:**
```typescript
// Source: https://hono.dev/examples/better-auth
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Hono } from "hono";
import { db } from "./db";

// Configure Better Auth
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "postgresql",
  }),
  trustedOrigins: [process.env.FRONTEND_URL],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

// Create Hono router
const router = new Hono();

// Mount Better Auth handler
router.on(["POST", "GET"], "/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

export default router;
```

### Pattern 2: AES-256-GCM Token Encryption
**What:** Encrypt OAuth tokens before storing in database using AES-256-GCM
**When to use:** Storing sensitive OAuth tokens (Claude, Google access/refresh tokens)
**Example:**
```typescript
// Source: https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function encryptToken(token: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  // Format: iv~encrypted~tag (all base64)
  return `${iv.toString("base64")}~${encrypted}~${tag.toString("base64")}`;
}

export function decryptToken(encryptedData: string, key: Buffer): string {
  const [ivB64, encryptedB64, tagB64] = encryptedData.split("~");

  const iv = Buffer.from(ivB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const tag = Buffer.from(tagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

// Generate encryption key (do this once, store in env)
export function generateEncryptionKey(): Buffer {
  return crypto.randomBytes(32); // 256 bits
}
```

### Pattern 3: Claude OAuth 2.0 + PKCE Implementation
**What:** Implement OAuth 2.0 with PKCE for Claude Code authentication
**When to use:** Enabling users to connect their Claude accounts to Rachel Cloud
**Example:**
```typescript
// Source: https://github.com/querymt/anthropic-auth
import { pkceChallenge } from "pkce-challenge";

interface ClaudeOAuthConfig {
  mode: "max" | "console"; // max = subscription, console = API keys
  clientId: string;
  redirectUri: string;
}

export async function startClaudeOAuthFlow(config: ClaudeOAuthConfig) {
  // Generate PKCE challenge
  const { code_verifier, code_challenge } = await pkceChallenge();

  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString("base64url");

  // Determine authorization endpoint
  const authEndpoint = config.mode === "max"
    ? "https://claude.ai/oauth/authorize"
    : "https://console.anthropic.com/oauth/authorize";

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    code_challenge: code_challenge,
    code_challenge_method: "S256",
    state: state,
    scope: "openid profile email",
  });

  const authUrl = `${authEndpoint}?${params}`;

  return {
    authUrl,
    state,
    codeVerifier: code_verifier,
  };
}

export async function exchangeClaudeCode(
  code: string,
  codeVerifier: string,
  config: ClaudeOAuthConfig
) {
  const tokenEndpoint = config.mode === "max"
    ? "https://claude.ai/oauth/token"
    : "https://console.anthropic.com/oauth/token";

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return await response.json();
}
```

### Pattern 4: Proactive Token Refresh
**What:** Auto-refresh OAuth tokens before expiration to prevent disruptions
**When to use:** Long-running sessions with Claude or Google OAuth
**Example:**
```typescript
// Source: https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

export async function ensureValidToken(
  tokenData: TokenData,
  refreshFn: (refreshToken: string) => Promise<TokenData>
): Promise<TokenData> {
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  // Check if token expires soon
  if (tokenData.expiresAt - now < bufferTime) {
    console.log("Token expiring soon, refreshing...");
    return await refreshFn(tokenData.refreshToken);
  }

  return tokenData;
}

export async function refreshClaudeToken(refreshToken: string) {
  const response = await fetch("https://claude.ai/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
}
```

### Pattern 5: Rate Limiting for Auth Endpoints
**What:** Protect authentication endpoints from brute force attacks
**When to use:** All public auth endpoints (login, signup, password reset)
**Example:**
```typescript
// Source: https://github.com/rhinobase/hono-rate-limiter
import { rateLimiter } from "hono-rate-limiter";
import { Hono } from "hono";

const app = new Hono();

// Strict rate limiting for login attempts
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 requests per window
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    // Rate limit by IP + email combination
    const email = c.req.query("email") || "";
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    return `${ip}:${email}`;
  },
});

// More lenient for signup
const signupLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 signups per hour per IP
  keyGenerator: (c) => {
    return c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  },
});

app.post("/api/auth/login", loginLimiter, async (c) => {
  // Login logic
});

app.post("/api/auth/signup", signupLimiter, async (c) => {
  // Signup logic
});
```

### Pattern 6: Session Management with HTTP-Only Cookies
**What:** Store session tokens in HTTP-only, secure cookies
**When to use:** All session-based authentication (after login/signup)
**Example:**
```typescript
// Source: https://www.better-auth.com/docs/concepts/session-management
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache session for 5 minutes
    },
  },
  advanced: {
    cookiePrefix: "rachel_cloud",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

// Cookies are automatically set with:
// - HttpOnly: true (prevents JavaScript access)
// - Secure: true (HTTPS only in production)
// - SameSite: "lax" (CSRF protection)
```

### Anti-Patterns to Avoid
- **Storing tokens in localStorage:** Vulnerable to XSS attacks; always use HTTP-only cookies for session tokens
- **Client-side token refresh logic:** Exposes refresh tokens to JavaScript; handle all token operations server-side
- **Missing PKCE for OAuth:** Required in OAuth 2.1; always use PKCE for public clients
- **Hard-coded secrets:** Never commit API keys, OAuth secrets, or encryption keys to version control
- **No rate limiting:** Authentication endpoints are prime targets for brute force; always implement rate limiting
- **Ignoring token expiration:** Claude tokens expire after 8-12 hours; implement proactive refresh to avoid disruptions
- **Missing CSRF protection:** Always validate `state` parameter in OAuth flows and use SameSite cookies

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication logic | Custom auth system | Better Auth | Password hashing, session management, OAuth flows, CSRF protection—too many edge cases and security pitfalls |
| OAuth 2.0 implementation | Custom OAuth client | Better Auth + pkce-challenge | OAuth spec is complex; state management, token refresh, PKCE implementation require careful handling |
| Password hashing | crypto.createHash() | Better Auth (uses Argon2id) | Modern password hashing requires salt, iteration count, memory hardness—Argon2id is current best practice |
| Session management | Custom session store | Better Auth sessions | Session fixation, expiration, refresh, invalidation—easy to get wrong; use battle-tested library |
| Encryption primitives | Custom crypto wrapper | Node.js crypto module (with careful implementation) | Use native crypto API directly; wrap only for convenience, not reimplementation |
| CSRF tokens | Manual token generation/validation | Better Auth + SameSite cookies | CSRF protection requires secure random generation, storage, validation—library handles this |
| Rate limiting | Manual request counting | hono-rate-limiter | Distributed rate limiting, sliding windows, memory management—use proven library |

**Key insight:** Authentication is the most security-critical part of any application. Every custom implementation increases attack surface. Use well-maintained, audited libraries like Better Auth that handle the complexity and receive regular security updates. Focus custom code only on business logic (e.g., Claude-specific OAuth integration), not on core auth primitives.

## Common Pitfalls

### Pitfall 1: Claude Token Expiration During Long Sessions
**What goes wrong:** OAuth tokens expire after 8-12 hours, causing authentication failures mid-session
**Why it happens:** Current Claude OAuth implementation only refreshes tokens reactively (on 401), and refresh tokens may be invalidated after inactivity
**How to avoid:** Implement proactive token refresh 5-10 minutes before expiration; use background job or middleware to check and refresh tokens before each Claude API call
**Warning signs:** Users report "Token expired" errors after long coding sessions; automatic workflows fail after 8-12 hours

### Pitfall 2: Insecure Token Storage
**What goes wrong:** Storing OAuth tokens in plain text in database; tokens leaked if database is compromised
**Why it happens:** Developers skip encryption thinking database security is sufficient
**How to avoid:** Always encrypt OAuth tokens with AES-256-GCM before storing; use environment variable for encryption key (32-byte random value); never commit encryption keys to version control
**Warning signs:** Database contains readable access tokens; no encryption key in environment configuration

### Pitfall 3: PKCE Implementation Errors
**What goes wrong:** Using wrong code_challenge_method (plain instead of S256), losing code_verifier between authorization and token exchange, or missing PKCE entirely
**Why it happens:** OAuth 2.0 complexity; PKCE is relatively new requirement in OAuth 2.1
**How to avoid:** Use pkce-challenge library for generation; store code_verifier in session or temporary database record keyed by state parameter; always use S256 method
**Warning signs:** OAuth errors like "invalid_grant" or "invalid_request"; authorization succeeds but token exchange fails

### Pitfall 4: Missing Rate Limiting on Auth Endpoints
**What goes wrong:** Brute force attacks on login endpoint; account enumeration via signup/password reset
**Why it happens:** Developers focus on happy path, forget security hardening
**How to avoid:** Implement hono-rate-limiter on all auth endpoints before launch; use different limits for different endpoints (stricter for login, lenient for public pages); combine IP and email for keyGenerator
**Warning signs:** High number of failed login attempts from same IP; suspicious signup patterns

### Pitfall 5: XSS Vulnerability in Session Storage
**What goes wrong:** Storing session tokens in localStorage or sessionStorage; XSS attack steals tokens
**Why it happens:** Convenience of client-side storage; misunderstanding of XSS risks
**How to avoid:** Always use HTTP-only cookies for session tokens; configure Secure flag in production; use SameSite="lax" or "strict" for CSRF protection
**Warning signs:** Session tokens accessible via JavaScript console; cookies missing HttpOnly flag

### Pitfall 6: State Parameter Mismatch in OAuth
**What goes wrong:** Not validating state parameter in OAuth callback; CSRF vulnerability allows attacker to link their OAuth account to victim's session
**Why it happens:** Developers skip state validation thinking other OAuth parameters are sufficient
**How to avoid:** Generate cryptographically random state (32+ bytes); store in session; validate exact match in callback before token exchange
**Warning signs:** OAuth callback doesn't check state; state stored client-side instead of server-side

### Pitfall 7: Hardcoded or Weak Encryption Keys
**What goes wrong:** Using hardcoded encryption key or deriving from weak password; attacker can decrypt all stored tokens
**Why it happens:** Developers don't understand cryptographic key requirements
**How to avoid:** Generate 32-byte random encryption key using crypto.randomBytes(32); store in environment variable or secrets manager; rotate periodically
**Warning signs:** Encryption key in source code; key length < 32 bytes; key derived from predictable value

### Pitfall 8: No Session Expiration or Refresh
**What goes wrong:** Sessions last forever; stolen session token remains valid indefinitely
**Why it happens:** Default configurations may not enforce expiration; developers forget to implement session refresh
**How to avoid:** Set session expiresIn (7 days recommended); configure updateAge (24 hours) to extend sessions for active users; implement absolute expiration for dormant sessions
**Warning signs:** Sessions never expire; old session tokens remain valid; no session cleanup job

### Pitfall 9: Missing HTTPS in Production
**What goes wrong:** Cookies transmitted over HTTP; man-in-the-middle attack steals session tokens
**Why it happens:** Developers test locally without HTTPS, forget to enforce in production
**How to avoid:** Set useSecureCookies: true in production; ensure all redirects go to HTTPS; use HSTS header; test with production-like environment
**Warning signs:** Secure flag not set on cookies; mixed content warnings; HTTP URLs in OAuth redirect URIs

### Pitfall 10: Secrets in Environment Variables (Production)
**What goes wrong:** Environment variables store secrets in plain text in memory; process dumps or logs expose secrets
**Why it happens:** Common practice in development; developers don't realize production risks
**How to avoid:** Use dedicated secrets manager (HashiCorp Vault, AWS Secrets Manager, Doppler) in production; rotate secrets regularly; implement access control and audit logging
**Warning signs:** All secrets in .env file; no secrets rotation; plaintext secrets in deployment configs

## Code Examples

Verified patterns from official sources:

### Database Schema (Drizzle)
```typescript
// Source: https://orm.drizzle.team/docs/get-started-postgresql
import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"), // Encrypted with AES-256-GCM
  refreshToken: text("refresh_token"), // Encrypted with AES-256-GCM
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Complete Better Auth Setup
```typescript
// Source: https://catalins.tech/better-auth-with-hono-bun-typescript-react-vite/
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "postgresql",
  }),
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:5173",
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: "rachel_cloud",
    useSecureCookies: process.env.NODE_ENV === "production",
    generateId: () => crypto.randomUUID(),
  },
});
```

### Frontend Auth Client
```typescript
// Source: https://catalins.tech/better-auth-with-hono-bun-typescript-react-vite/
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.VITE_API_URL || "http://localhost:3000",
});

export const { useSession, signIn, signUp, signOut } = authClient;

// Usage in components
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    await signIn.email(
      { email, password },
      {
        onSuccess: () => {
          console.log("Login successful");
        },
        onError: (error) => {
          console.error("Login failed:", error);
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    await signIn.social(
      { provider: "google" },
      {
        onSuccess: () => {
          console.log("Google login successful");
        },
        onError: (error) => {
          console.error("Google login failed:", error);
        },
      }
    );
  };
}
```

### Complete Token Encryption/Decryption Module
```typescript
// Source: https://gist.github.com/rjz/15baffeab434b8125ca4d783f4116d81
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard
const TAG_LENGTH = 16; // GCM standard

export class TokenEncryption {
  private key: Buffer;

  constructor(encryptionKey?: string) {
    if (encryptionKey) {
      this.key = Buffer.from(encryptionKey, "hex");
    } else if (process.env.ENCRYPTION_KEY) {
      this.key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    } else {
      throw new Error("Encryption key not provided");
    }

    if (this.key.length !== 32) {
      throw new Error("Encryption key must be 32 bytes (256 bits)");
    }
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const tag = cipher.getAuthTag();

    // Return format: iv~encrypted~tag (all base64)
    return `${iv.toString("base64")}~${encrypted}~${tag.toString("base64")}`;
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split("~");
    if (parts.length !== 3) {
      throw new Error("Invalid ciphertext format");
    }

    const [ivB64, encryptedB64, tagB64] = parts;

    const iv = Buffer.from(ivB64, "base64");
    const encrypted = Buffer.from(encryptedB64, "base64");
    const tag = Buffer.from(tagB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }

  static generateKey(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

// Usage example
const encryption = new TokenEncryption();

// Storing token
const accessToken = "claude_sk_xxxxx";
const encryptedToken = encryption.encrypt(accessToken);
// Store encryptedToken in database

// Retrieving token
const decryptedToken = encryption.decrypt(encryptedToken);
// Use decryptedToken for API calls
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lucia Auth | Better Auth | 2025-2026 | Lucia archived; Better Auth is now the standard for TypeScript auth |
| OAuth 2.0 | OAuth 2.1 with mandatory PKCE | 2024-2025 | PKCE now required for public clients; improves security against code interception |
| bcrypt | Argon2id | 2023-2024 | Argon2id provides better memory hardness; OWASP recommendation for password hashing |
| JWT in localStorage | HTTP-only cookies | Ongoing | XSS protection; session tokens no longer accessible to JavaScript |
| Prisma ORM | Drizzle ORM (for Bun projects) | 2024-2025 | Drizzle is lighter, faster, and has better Bun integration |
| Environment variables for secrets | Secrets managers (Vault, AWS SM) | 2024-2026 | Plain text in memory is insecure; encrypted storage with audit logs is now best practice |
| 1-year TLS certificates | 200-day max (March 2026) | March 2026 | Shorter certificate lifetimes reduce risk of compromise |

**Deprecated/outdated:**
- **Lucia Auth**: Archived in 2025; maintainer stepped back from active development; use Better Auth instead
- **OAuth 2.0 without PKCE**: OAuth 2.1 makes PKCE mandatory for public clients; always implement PKCE
- **bcrypt for new implementations**: Use Argon2id; if maintaining legacy system with bcrypt, ensure work factor ≥ 10
- **Implicit grant flow**: Removed in OAuth 2.1; use Authorization Code + PKCE instead
- **JWT in localStorage**: Vulnerable to XSS; use HTTP-only cookies for session tokens
- **pgcrypto for AES-256-GCM**: PostgreSQL's pgcrypto doesn't natively support GCM mode; use application-level encryption

## Open Questions

1. **Claude OAuth Token Lifetime Specifics**
   - What we know: Tokens expire after 8-12 hours based on user reports; no official documentation
   - What's unclear: Exact expiration time, whether it varies by account type (Pro/Max), refresh token lifetime
   - Recommendation: Implement proactive refresh at 5-minute buffer; monitor and adjust based on actual expiration patterns; consider fallback to setup-token for long-running workflows

2. **Claude OAuth Scopes**
   - What we know: Basic scopes include "openid profile email"
   - What's unclear: What additional scopes are available? Do different scopes provide different API access levels?
   - Recommendation: Start with basic scopes; test API access; request additional scopes if needed; document findings

3. **Better Auth with Custom OAuth Providers**
   - What we know: Better Auth has "generic OAuth" plugin for custom providers
   - What's unclear: Exact integration pattern for Claude OAuth (not a standard provider)
   - Recommendation: Use generic OAuth plugin for Claude integration; may need custom logic for PKCE and token encryption; test thoroughly

4. **Token Encryption Key Rotation**
   - What we know: Should rotate encryption keys periodically for security
   - What's unclear: How to re-encrypt existing tokens during key rotation without service disruption?
   - Recommendation: Implement dual-key system (old + new) during rotation; background job to re-encrypt; document rotation procedure before production

5. **Session Management for Claude API Calls**
   - What we know: Claude tokens expire; need refresh mechanism
   - What's unclear: Should we maintain separate session for Claude tokens vs. user sessions? How to handle multiple Claude accounts per user?
   - Recommendation: Store Claude tokens per user account; implement refresh before each API call; allow multiple Claude connections per user in database schema

## Sources

### Primary (HIGH confidence)
- Better Auth Official Documentation - https://www.better-auth.com/
- Better Auth Hono Integration - https://hono.dev/examples/better-auth
- Claude Code Authentication Docs - https://code.claude.com/docs/en/authentication
- Anthropic Auth Library - https://github.com/querymt/anthropic-auth
- Drizzle ORM PostgreSQL Docs - https://orm.drizzle.team/docs/get-started-postgresql
- Node.js Crypto Documentation - https://nodejs.org/api/crypto.html
- OWASP Password Storage Cheat Sheet - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP OAuth 2.0 Cheat Sheet - https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html

### Secondary (MEDIUM confidence)
- Better Auth Tutorial (Catalin Pit) - https://catalins.tech/better-auth-with-hono-bun-typescript-react-vite/
- GitHub: grll/claude-code-login - https://github.com/grll/claude-code-login
- GitHub: hono-rate-limiter - https://github.com/rhinobase/hono-rate-limiter
- Auth0: Refresh Tokens - https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
- Auth0: PKCE - https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce
- Google OAuth Best Practices - https://developers.google.com/identity/protocols/oauth2/resources/best-practices
- Node.js Security Blog: Lucia to Better Auth Migration - https://www.nodejs-security.com/blog/nodejs-authentication-migration-from-lucia-to-better-auth
- Session Management Best Practices - https://jscrambler.com/blog/best-practices-for-secure-session-management-in-node

### Tertiary (LOW confidence - needs validation)
- Claude Code GitHub Issues: Token expiration - https://github.com/anthropics/claude-code/issues/12447
- Environment Variables Security (2026) - https://securityboulevard.com/2025/12/are-environment-variables-still-safe-for-secrets-in-2026/
- JWT vs Session Cookies (Medium, 2026) - https://medium.com/@msbytedev/jwt-vs-cookies-in-2026-1008f7c24334

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation for all libraries; active community support; proven production use
- Architecture: HIGH - Multiple verified sources; official examples; production deployments documented
- Pitfalls: MEDIUM-HIGH - Mix of documented best practices and community experience; some gaps in Claude-specific issues

**Research date:** 2026-02-14
**Valid until:** ~30 days (2026-03-14) for stable components; ~7 days for Claude OAuth specifics (fast-moving, underdocumented)

**Next steps for validation:**
1. Test Claude OAuth flow with actual Claude account to determine exact token lifetimes
2. Verify Better Auth generic OAuth plugin works with Claude endpoints
3. Benchmark token encryption/decryption performance with expected load
4. Test token refresh timing to find optimal buffer before expiration
5. Validate rate limiting configuration under simulated attack
