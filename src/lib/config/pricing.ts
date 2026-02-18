/**
 * Centralized pricing configuration for Rachel Cloud.
 * Change prices here — they propagate everywhere in the app.
 */

export const PRICING = {
	/** Monthly subscription price in USD */
	amount: 20,

	/** Currency symbol */
	currency: '$',

	/** Currency code (for structured data / APIs) */
	currencyCode: 'USD',

	/** Billing period */
	period: 'month',

	/** Formatted price string: "$20" */
	get price(): string {
		return `${this.currency}${this.amount}`;
	},

	/** Formatted with period: "$20/month" */
	get priceWithPeriod(): string {
		return `${this.price}/${this.period}`;
	},

	/** Short format: "$20/mo" */
	get priceShort(): string {
		return `${this.price}/mo`;
	},
} as const;
