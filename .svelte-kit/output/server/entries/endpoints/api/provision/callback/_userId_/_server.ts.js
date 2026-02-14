import { json } from "@sveltejs/kit";
import { d as db, s as subscriptions } from "../../../../../../chunks/index3.js";
import { eq } from "drizzle-orm";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POST = async ({ params, request }) => {
  const { userId } = params;
  if (!userId || !UUID_REGEX.test(userId)) {
    console.warn(
      `[provision-callback] Invalid userId format: ${userId ?? "(empty)"}`
    );
    return json(
      { error: "Bad Request", message: "Invalid userId format" },
      { status: 400 }
    );
  }
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      console.warn(
        `[provision-callback] Could not parse JSON body for userId ${userId}, proceeding with empty body`
      );
    }
    const hostname = body.hostname ?? null;
    const instanceId = body.instance_id ?? null;
    console.log(
      `[provision-callback] Received callback for userId=${userId} hostname=${hostname ?? "(none)"} instance_id=${instanceId ?? "(none)"}`
    );
    const existing = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    if (existing.length === 0) {
      console.warn(
        `[provision-callback] No subscription found for userId=${userId}`
      );
      return json(
        { error: "Not Found", message: "No subscription found for this user" },
        { status: 404 }
      );
    }
    const subscription = existing[0];
    if (subscription.provisioningStatus !== "cloud_init" && subscription.provisioningStatus !== "creating") {
      console.log(
        `[provision-callback] Subscription for userId=${userId} already at status="${subscription.provisioningStatus}", skipping update`
      );
      return json({
        success: true,
        message: "Callback already processed"
      });
    }
    await db.update(subscriptions).set({
      provisioningStatus: "injecting_secrets",
      vpsHostname: hostname ?? subscription.vpsHostname,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(subscriptions.userId, userId));
    console.log(
      `[provision-callback] Updated userId=${userId} to provisioningStatus=injecting_secrets`
    );
    return json({
      success: true,
      message: "Cloud-init completion recorded"
    });
  } catch (error) {
    console.error(
      `[provision-callback] Error processing callback for userId=${userId}:`,
      error
    );
    return json(
      {
        error: "Internal Server Error",
        message: "Failed to process cloud-init callback"
      },
      { status: 500 }
    );
  }
};
export {
  POST
};
