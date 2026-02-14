import { r as requireAuth } from "../../../../../chunks/session.js";
import { g as getSubscription } from "../../../../../chunks/subscription-manager.js";
const load = async (event) => {
  const session = await requireAuth(event);
  const subscription = await getSubscription(session.user.id);
  const hasActiveSubscription = subscription?.status === "active";
  const isGracePeriod = subscription?.status === "grace_period";
  const isCanceled = subscription?.status === "canceled" || subscription?.status === "none";
  return {
    subscription,
    hasActiveSubscription,
    isGracePeriod,
    isCanceled
  };
};
export {
  load
};
