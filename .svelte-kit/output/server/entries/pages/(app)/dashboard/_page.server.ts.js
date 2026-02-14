import { r as requireAuth } from "../../../../chunks/session.js";
import { g as getSubscription } from "../../../../chunks/subscription-manager.js";
const load = async (event) => {
  const session = await requireAuth(event);
  const subscription = await getSubscription(session.user.id);
  return {
    subscription,
    hasActiveSubscription: subscription?.status === "active",
    isGracePeriod: subscription?.status === "grace_period"
  };
};
export {
  load
};
