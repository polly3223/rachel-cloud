import { json } from "@sveltejs/kit";
import { r as requireAuth } from "../../../../../chunks/session.js";
import { e as encryptToken } from "../../../../../chunks/encryption.js";
import { d as db, t as telegramBots } from "../../../../../chunks/index3.js";
import { randomUUID } from "node:crypto";
async function validateTelegramBotToken(token) {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return { valid: false, error: "Token is required" };
  }
  const maxRetries = 3;
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1e4);
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        method: "GET",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!data.ok) {
        return {
          valid: false,
          error: data.description || "Invalid token"
        };
      }
      if (!data.result?.is_bot) {
        return {
          valid: false,
          error: "Token does not belong to a bot"
        };
      }
      return {
        valid: true,
        botUsername: data.result.username
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          lastError = "Request timeout. Please try again.";
        } else {
          lastError = "Failed to validate token. Please check your connection.";
        }
      } else {
        lastError = "An unexpected error occurred";
      }
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1e3;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  return {
    valid: false,
    error: lastError || "Failed to validate token after multiple attempts"
  };
}
async function POST(event) {
  try {
    const session = await requireAuth(event);
    const userId = session.user.id;
    const body = await event.request.json();
    const { token } = body;
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return json({ error: "Token is required" }, { status: 400 });
    }
    const validation = await validateTelegramBotToken(token.trim());
    if (!validation.valid) {
      return json({ error: validation.error }, { status: 400 });
    }
    const encryptedToken = encryptToken(token.trim());
    await db.insert(telegramBots).values({
      id: randomUUID(),
      userId,
      botUsername: validation.botUsername || null,
      encryptedToken,
      validated: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).onConflictDoUpdate({
      target: telegramBots.userId,
      set: {
        botUsername: validation.botUsername || null,
        encryptedToken,
        validated: true,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return json({
      success: true,
      botUsername: validation.botUsername
    });
  } catch (error) {
    console.error("Bot validation error:", error);
    if (error instanceof Response) {
      throw error;
    }
    return json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
export {
  POST
};
