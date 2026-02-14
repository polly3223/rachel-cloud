import { a as auth } from "../../../../../chunks/config.js";
import { error } from "@sveltejs/kit";
const rateLimitStore = /* @__PURE__ */ new Map();
const CLEANUP_INTERVAL = 5 * 60 * 1e3;
let cleanupTimer = null;
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip);
    }
  }
}
function startCleanupTimer() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
  }
}
function rateLimitMiddleware(event, limit = 10, windowMs = 6e4) {
  startCleanupTimer();
  const ip = event.getClientAddress();
  const now = Date.now();
  const windowStart = now - windowMs;
  let entry = rateLimitStore.get(ip);
  if (!entry) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
      requests: [now]
    };
    rateLimitStore.set(ip, entry);
    return;
  }
  entry.requests = entry.requests.filter((timestamp) => timestamp > windowStart);
  entry.count = entry.requests.length;
  if (entry.count >= limit) {
    throw error(429, {
      message: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((entry.resetAt - now) / 1e3)
    });
  }
  entry.requests.push(now);
  entry.count++;
  entry.resetAt = now + windowMs;
  rateLimitStore.set(ip, entry);
}
async function handleAuthRequest(event) {
  rateLimitMiddleware(event, 10, 6e4);
  return auth.handler(event.request);
}
async function GET(event) {
  return handleAuthRequest(event);
}
async function POST(event) {
  return handleAuthRequest(event);
}
export {
  GET,
  POST
};
