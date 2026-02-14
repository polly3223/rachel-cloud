import { e as exchangeCode } from "../../../../../chunks/claude-oauth.js";
import { e as encryptToken } from "../../../../../chunks/encryption.js";
import { d as db, c as claudeTokens } from "../../../../../chunks/index3.js";
import { r as requireAuth } from "../../../../../chunks/session.js";
import { error, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
async function GET(event) {
  try {
    const session = await requireAuth(event);
    const userId = session.user.id;
    const code = event.url.searchParams.get("code");
    if (!code) {
      throw error(400, "Missing authorization code");
    }
    const codeVerifier = event.cookies.get("pkce_verifier");
    if (!codeVerifier) {
      throw error(400, "PKCE flow incomplete: missing code verifier");
    }
    const tokens = await exchangeCode(code, codeVerifier);
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = encryptToken(tokens.refresh_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1e3);
    const existing = await db.select().from(claudeTokens).where(eq(claudeTokens.userId, userId)).limit(1);
    if (existing.length > 0) {
      await db.update(claudeTokens).set({
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(claudeTokens.userId, userId));
    } else {
      await db.insert(claudeTokens).values({
        id: crypto.randomUUID(),
        userId,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
    }
    event.cookies.delete("pkce_verifier", { path: "/" });
    throw redirect(302, "/dashboard/claude?success=true");
  } catch (err) {
    event.cookies.delete("pkce_verifier", { path: "/" });
    if (err instanceof Response) {
      throw err;
    }
    console.error("Claude OAuth callback error:", err);
    throw error(500, `OAuth callback failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}
export {
  GET
};
