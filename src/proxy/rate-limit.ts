/**
 * LLM Proxy — Rate Limiting
 *
 * Checks per-user rate limits (hourly/daily requests and tokens) before
 * forwarding requests. Uses synchronous SQLite queries for minimal latency.
 */

import { db, DEFAULT_LIMITS } from "./db";

// ---------- Types ----------

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
  currentUsage?: {
    hourlyRequests: number;
    hourlyTokens: number;
    dailyRequests: number;
    dailyTokens: number;
  };
  limits?: {
    hourlyRequestLimit: number;
    hourlyTokenLimit: number;
    dailyRequestLimit: number;
    dailyTokenLimit: number;
  };
}

// ---------- Prepared statements ----------

const getUsageInWindow = db.prepare<
  { request_count: number; total_tokens: number },
  [string, number]
>(`
  SELECT
    COUNT(*) as request_count,
    COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens
  FROM usage
  WHERE user_id = ? AND timestamp > ?
`);

const getUserLimits = db.prepare<
  {
    daily_request_limit: number;
    daily_token_limit: number;
    hourly_request_limit: number;
    hourly_token_limit: number;
  },
  [string]
>(`
  SELECT daily_request_limit, daily_token_limit, hourly_request_limit, hourly_token_limit
  FROM rate_limits
  WHERE user_id = ?
`);

// ---------- Rate limit check ----------

/**
 * Check if a user is within their rate limits.
 * Synchronous — designed to run before every forwarded request.
 */
export function checkRateLimit(userId: string): RateLimitResult {
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;
  const oneDayAgo = now - 86400;

  // Get user-specific limits, or fall back to defaults
  const userLimits = getUserLimits.get(userId);
  const limits = {
    hourlyRequestLimit:
      userLimits?.hourly_request_limit ?? DEFAULT_LIMITS.hourlyRequestLimit,
    hourlyTokenLimit:
      userLimits?.hourly_token_limit ?? DEFAULT_LIMITS.hourlyTokenLimit,
    dailyRequestLimit:
      userLimits?.daily_request_limit ?? DEFAULT_LIMITS.dailyRequestLimit,
    dailyTokenLimit:
      userLimits?.daily_token_limit ?? DEFAULT_LIMITS.dailyTokenLimit,
  };

  // Query current usage
  const hourly = getUsageInWindow.get(userId, oneHourAgo);
  const daily = getUsageInWindow.get(userId, oneDayAgo);

  const currentUsage = {
    hourlyRequests: hourly?.request_count ?? 0,
    hourlyTokens: hourly?.total_tokens ?? 0,
    dailyRequests: daily?.request_count ?? 0,
    dailyTokens: daily?.total_tokens ?? 0,
  };

  // Check hourly request limit
  if (currentUsage.hourlyRequests >= limits.hourlyRequestLimit) {
    return {
      allowed: false,
      reason: `Hourly request limit exceeded (${currentUsage.hourlyRequests}/${limits.hourlyRequestLimit})`,
      retryAfterSeconds: 60,
      currentUsage,
      limits,
    };
  }

  // Check hourly token limit
  if (currentUsage.hourlyTokens >= limits.hourlyTokenLimit) {
    return {
      allowed: false,
      reason: `Hourly token limit exceeded (${currentUsage.hourlyTokens}/${limits.hourlyTokenLimit})`,
      retryAfterSeconds: 60,
      currentUsage,
      limits,
    };
  }

  // Check daily request limit
  if (currentUsage.dailyRequests >= limits.dailyRequestLimit) {
    return {
      allowed: false,
      reason: `Daily request limit exceeded (${currentUsage.dailyRequests}/${limits.dailyRequestLimit})`,
      retryAfterSeconds: 3600,
      currentUsage,
      limits,
    };
  }

  // Check daily token limit
  if (currentUsage.dailyTokens >= limits.dailyTokenLimit) {
    return {
      allowed: false,
      reason: `Daily token limit exceeded (${currentUsage.dailyTokens}/${limits.dailyTokenLimit})`,
      retryAfterSeconds: 3600,
      currentUsage,
      limits,
    };
  }

  return { allowed: true, currentUsage, limits };
}

// ---------- Response builder ----------

/**
 * Build a 429 response with Anthropic-compatible error body and Retry-After header.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      type: "error",
      error: {
        type: "rate_limit_error",
        message: `Rate limit exceeded: ${result.reason}. Try again in ${result.retryAfterSeconds} seconds.`,
      },
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(result.retryAfterSeconds || 60),
      },
    },
  );
}
