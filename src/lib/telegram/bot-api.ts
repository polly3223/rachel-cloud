/**
 * Thin wrapper around the Telegram Bot API.
 * Used by the shared bot router to send messages directly.
 *
 * @module telegram/bot-api
 */

const TELEGRAM_API = 'https://api.telegram.org';

function getBotToken(): string {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	if (!token) {
		throw new Error('TELEGRAM_BOT_TOKEN env var is required');
	}
	return token;
}

/**
 * Send a text message to a Telegram chat.
 */
export async function sendMessage(
	chatId: number,
	text: string,
	options?: {
		parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
		replyToMessageId?: number;
	}
): Promise<void> {
	const token = getBotToken();
	const url = `${TELEGRAM_API}/bot${token}/sendMessage`;

	const body: Record<string, unknown> = {
		chat_id: chatId,
		text,
	};

	if (options?.parseMode) {
		body.parse_mode = options.parseMode;
	}
	if (options?.replyToMessageId) {
		body.reply_to_message_id = options.replyToMessageId;
	}

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const error = await response.text();
		console.error(`[bot-api] sendMessage failed: ${response.status} ${error}`);
	}
}

/**
 * Register the webhook URL for the shared bot.
 * Call this once during setup.
 */
export async function setWebhook(webhookUrl: string): Promise<boolean> {
	const token = getBotToken();
	const url = `${TELEGRAM_API}/bot${token}/setWebhook`;

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			url: webhookUrl,
			allowed_updates: ['message', 'callback_query', 'edited_message'],
		}),
	});

	const result = await response.json() as { ok: boolean; description?: string };

	if (!result.ok) {
		console.error(`[bot-api] setWebhook failed: ${result.description}`);
		return false;
	}

	console.log(`[bot-api] Webhook set to ${webhookUrl}`);
	return true;
}

/**
 * Get current webhook info (for debugging).
 */
export async function getWebhookInfo(): Promise<unknown> {
	const token = getBotToken();
	const url = `${TELEGRAM_API}/bot${token}/getWebhookInfo`;

	const response = await fetch(url);
	return response.json();
}
