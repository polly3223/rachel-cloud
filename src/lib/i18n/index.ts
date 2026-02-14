import { writable, derived } from 'svelte/store';
import en from './translations/en';
import it from './translations/it';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Locale = 'en' | 'it';

interface FAQItem {
	question: string;
	answer: string;
}

interface Step {
	title: string;
	description: string;
}

interface Feature {
	title: string;
	description: string;
}

export interface Translations {
	hero: {
		badge: string;
		h1Line1: string;
		h1Line2: string;
		subtitle: string;
		cta1: string;
		cta2: string;
		subtext: string;
	};
	howItWorks: {
		label: string;
		title: string;
		step1: Step;
		step2: Step;
		step3: Step;
	};
	features: {
		label: string;
		title: string;
		subtitle: string;
		feature1: Feature;
		feature2: Feature;
		feature3: Feature;
		feature4: Feature;
		feature5: Feature;
		feature6: Feature;
	};
	telegramDemo: {
		label: string;
		title: string;
		subtitle: string;
		online: string;
		inputPlaceholder: string;
		messages: {
			user1: string;
			rachel1: string;
			user2: string;
			rachel2: string;
			user3: string;
			rachel3: string;
		};
	};
	pricing: {
		label: string;
		title: string;
		subtitle: string;
		planBadge: string;
		planName: string;
		price: string;
		priceUnit: string;
		features: string[];
		cta: string;
		subtext: string;
		referralEmoji: string;
		referralHighlight: string;
		referralText: string;
	};
	openSource: {
		label: string;
		title: string;
		paragraph1: string;
		paragraph2: string;
		starButton: string;
		githubButton: string;
	};
	faq: {
		label: string;
		title: string;
		items: FAQItem[];
	};
	footer: {
		brandName: string;
		tagline: string;
		navGetStarted: string;
		navLogin: string;
		navGitHub: string;
		copyright: string;
		referralEmoji: string;
		referralText: string;
		referralLink: string;
	};
}

// ---------------------------------------------------------------------------
// Translation map
// ---------------------------------------------------------------------------

const translations: Record<Locale, Translations> = { en, it };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'rachel-locale';
const SUPPORTED_LOCALES: Locale[] = ['en', 'it'];
const DEFAULT_LOCALE: Locale = 'it';

/**
 * Detect the best locale to use on first visit.
 *
 * Priority:
 *   1. localStorage preference (returning visitor)
 *   2. Browser language — if it starts with "it", pick Italian
 *   3. Fall back to Italian (primary market)
 */
function detectLocale(): Locale {
	// Server-side: always return default
	if (typeof window === 'undefined') {
		return DEFAULT_LOCALE;
	}

	// 1. Saved preference
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) {
			return saved as Locale;
		}
	} catch {
		// localStorage may be unavailable (private browsing, etc.)
	}

	// 2. Browser language
	const browserLang = navigator.language ?? '';
	if (browserLang.startsWith('it')) {
		return 'it';
	}
	if (browserLang.startsWith('en')) {
		return 'en';
	}

	// 3. Default to Italian (primary market)
	return DEFAULT_LOCALE;
}

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

/** Current locale — writable so the LanguageSwitcher can update it. */
export const locale = writable<Locale>(detectLocale());

// Persist changes to localStorage
locale.subscribe((value: Locale) => {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, value);
	} catch {
		// Silently ignore storage errors
	}
});

/**
 * Derived store that returns the full translations object for the active locale.
 *
 * Usage in Svelte components:
 * ```svelte
 * <script>
 *   import { t } from '$lib/i18n';
 * </script>
 * <h1>{$t.hero.h1Line1}</h1>
 * ```
 */
export const t = derived(locale, ($locale: Locale): Translations => {
	return translations[$locale] ?? translations[DEFAULT_LOCALE];
});
