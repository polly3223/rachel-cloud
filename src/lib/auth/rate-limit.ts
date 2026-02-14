import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

interface RateLimitEntry {
	count: number;
	resetAt: number;
	requests: number[];
}

// In-memory rate limit store (Map of IP -> request timestamps)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: Timer | null = null;

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries() {
	const now = Date.now();
	for (const [ip, entry] of rateLimitStore.entries()) {
		if (entry.resetAt < now) {
			rateLimitStore.delete(ip);
		}
	}
}

/**
 * Start the cleanup timer if not already running
 */
function startCleanupTimer() {
	if (!cleanupTimer) {
		cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
	}
}

/**
 * Rate limiting middleware for auth endpoints
 * @param event - SvelteKit RequestEvent
 * @param limit - Maximum number of requests allowed in the time window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @throws 429 error if rate limit is exceeded
 */
export function rateLimitMiddleware(
	event: RequestEvent,
	limit: number = 10,
	windowMs: number = 60000
): void {
	startCleanupTimer();

	const ip = event.getClientAddress();
	const now = Date.now();
	const windowStart = now - windowMs;

	let entry = rateLimitStore.get(ip);

	if (!entry) {
		// First request from this IP
		entry = {
			count: 1,
			resetAt: now + windowMs,
			requests: [now]
		};
		rateLimitStore.set(ip, entry);
		return;
	}

	// Filter out requests outside the current window
	entry.requests = entry.requests.filter((timestamp) => timestamp > windowStart);
	entry.count = entry.requests.length;

	// Check if limit exceeded
	if (entry.count >= limit) {
		throw error(429, {
			message: 'Too many requests. Please try again later.',
			retryAfter: Math.ceil((entry.resetAt - now) / 1000)
		});
	}

	// Add current request
	entry.requests.push(now);
	entry.count++;
	entry.resetAt = now + windowMs;
	rateLimitStore.set(ip, entry);
}

/**
 * Stop the cleanup timer (useful for testing or cleanup)
 */
export function stopCleanupTimer() {
	if (cleanupTimer) {
		clearInterval(cleanupTimer);
		cleanupTimer = null;
	}
}

/**
 * Clear all rate limit entries (useful for testing)
 */
export function clearRateLimits() {
	rateLimitStore.clear();
}
