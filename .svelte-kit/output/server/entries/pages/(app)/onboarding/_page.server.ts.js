import "@sveltejs/kit";
import { r as requireAuth } from "../../../../chunks/session.js";
import { d as db, s as subscriptions, t as telegramBots } from "../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const load = async (event) => {
  const session = await requireAuth(event);
  const userId = session.user.id;
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId)
  });
  const bot = await db.query.telegramBots.findFirst({
    where: eq(telegramBots.userId, userId)
  });
  let step;
  if (!subscription || subscription.status === "none") {
    step = "payment";
  } else if (!bot || !bot.validated) {
    step = "telegram_bot";
  } else {
    step = "provisioning";
  }
  return {
    step,
    hasSubscription: subscription?.status === "active",
    hasBot: bot?.validated || false,
    botUsername: bot?.botUsername || null
  };
};
export {
  load
};
