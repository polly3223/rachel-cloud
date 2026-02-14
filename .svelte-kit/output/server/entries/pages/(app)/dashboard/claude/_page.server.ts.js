import { r as requireAuth } from "../../../../../chunks/session.js";
import { d as db, c as claudeTokens } from "../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const load = async (event) => {
  const session = await requireAuth(event);
  const userId = session.user.id;
  const records = await db.select().from(claudeTokens).where(eq(claudeTokens.userId, userId)).limit(1);
  return {
    connected: records.length > 0,
    expiresAt: records.length > 0 ? records[0].expiresAt.toISOString() : null
  };
};
export {
  load
};
