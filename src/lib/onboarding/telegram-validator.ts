/**
 * Telegram Bot API token validator
 * Uses the getMe endpoint to validate bot tokens
 */

interface TelegramUser {
	id: number;
	is_bot: boolean;
	first_name: string;
	username?: string;
}

interface TelegramResponse {
	ok: boolean;
	result?: TelegramUser;
	description?: string;
	error_code?: number;
}

interface ValidationResult {
	valid: boolean;
	botUsername?: string;
	error?: string;
}

/**
 * Validate a Telegram bot token using the getMe API endpoint
 * @param token - The bot token to validate
 * @returns Promise resolving to validation result with bot username or error
 */
export async function validateTelegramBotToken(token: string): Promise<ValidationResult> {
	// Validate input
	if (!token || typeof token !== 'string' || token.trim().length === 0) {
		return { valid: false, error: 'Token is required' };
	}

	// Retry logic with exponential backoff
	const maxRetries = 3;
	let lastError: string | undefined;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			// Make request to Telegram Bot API with timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
				method: 'GET',
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			// Parse response
			const data: TelegramResponse = await response.json();

			// Handle Telegram API errors (4xx - don't retry)
			if (!data.ok) {
				return {
					valid: false,
					error: data.description || 'Invalid token'
				};
			}

			// Validate that the token belongs to a bot
			if (!data.result?.is_bot) {
				return {
					valid: false,
					error: 'Token does not belong to a bot'
				};
			}

			// Success
			return {
				valid: true,
				botUsername: data.result.username
			};
		} catch (error) {
			// Handle network errors and timeouts (retry these)
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					lastError = 'Request timeout. Please try again.';
				} else {
					lastError = 'Failed to validate token. Please check your connection.';
				}
			} else {
				lastError = 'An unexpected error occurred';
			}

			// If this isn't the last attempt, wait with exponential backoff
			if (attempt < maxRetries - 1) {
				const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}
		}
	}

	// All retries failed
	return {
		valid: false,
		error: lastError || 'Failed to validate token after multiple attempts'
	};
}
