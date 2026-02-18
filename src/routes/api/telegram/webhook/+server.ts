/**
 * POST /api/telegram/webhook
 *
 * Receives ALL updates from the shared Rachel Telegram bot.
 * Routes each update to the appropriate user's container.
 *
 * This endpoint is registered as the webhook URL for the shared bot via:
 *   curl "https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://get-rachel.com/api/telegram/webhook"
 *
 * Must always return 200 OK quickly — Telegram retries on failure.
 *
 * @module telegram-webhook
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { routeUpdate } from '$lib/telegram/router';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const update = await request.json();
		const updateId = (update as Record<string, unknown>).update_id;
		console.log(`[webhook] Received update ${updateId}`);

		// Route asynchronously — don't block the webhook response
		// Telegram expects a fast 200 OK
		void routeUpdate(update).catch((error) => {
			console.error('[webhook] Error routing update:', error);
		});

		return json({ ok: true });
	} catch (error) {
		console.error('[webhook] Error parsing update:', error);
		return json({ ok: true }); // Always return 200 to avoid Telegram retries
	}
};
