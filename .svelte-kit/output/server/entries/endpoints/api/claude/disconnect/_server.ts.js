import { r as requireAuth } from "../../../../../chunks/session.js";
import { d as db, c as claudeTokens } from "../../../../../chunks/index3.js";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
async function POST(event) {
  try {
    const session = await requireAuth(event);
    const userId = session.user.id;
    await db.delete(claudeTokens).where(eq(claudeTokens.userId, userId));
    return json({
      success: true,
      message: "Claude account disconnected successfully"
    });
  } catch (err) {
    if (err instanceof Response) {
      throw err;
    }
    console.error("Disconnect error:", err);
    return json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to disconnect"
      },
      { status: 500 }
    );
  }
}
export {
  POST
};
