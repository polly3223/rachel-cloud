import { r as requireAuth } from "../../../../../chunks/session.js";
import { d as db, c as claudeTokens } from "../../../../../chunks/index3.js";
import { r as refreshToken } from "../../../../../chunks/claude-oauth.js";
import { d as decryptToken, e as encryptToken } from "../../../../../chunks/encryption.js";
import { eq } from "drizzle-orm";
import { error, json } from "@sveltejs/kit";
async function getValidToken(userId) {
  try {
    const records = await db.select().from(claudeTokens).where(eq(claudeTokens.userId, userId)).limit(1);
    if (records.length === 0) {
      return null;
    }
    const record = records[0];
    const now = /* @__PURE__ */ new Date();
    const isExpired = record.expiresAt.getTime() - now.getTime() < 5 * 60 * 1e3;
    if (!isExpired) {
      return decryptToken(record.encryptedAccessToken);
    }
    console.log(`Claude token expired for user ${userId}, refreshing...`);
    const refreshTokenValue = decryptToken(record.encryptedRefreshToken);
    const newTokens = await refreshToken(refreshTokenValue);
    const encryptedAccessToken = encryptToken(newTokens.access_token);
    const encryptedRefreshToken = encryptToken(newTokens.refresh_token);
    const expiresAt = new Date(Date.now() + newTokens.expires_in * 1e3);
    await db.update(claudeTokens).set({
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresAt,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(claudeTokens.userId, userId));
    console.log(`Successfully refreshed Claude token for user ${userId}`);
    return newTokens.access_token;
  } catch (error2) {
    console.error(`Failed to get valid Claude token for user ${userId}:`, error2);
    return null;
  }
}
async function POST(event) {
  try {
    const session = await requireAuth(event);
    const userId = session.user.id;
    const token = await getValidToken(userId);
    if (!token) {
      throw error(404, "Claude account not connected");
    }
    const records = await db.select().from(claudeTokens).where(eq(claudeTokens.userId, userId)).limit(1);
    if (records.length === 0) {
      throw error(404, "Claude account not connected");
    }
    const record = records[0];
    return json({
      success: true,
      expiresAt: record.expiresAt.toISOString(),
      message: "Token refreshed successfully"
    });
  } catch (err) {
    if (err instanceof Response) {
      throw err;
    }
    console.error("Token refresh error:", err);
    return json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to refresh token"
      },
      { status: 500 }
    );
  }
}
export {
  POST
};
