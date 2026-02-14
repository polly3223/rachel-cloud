
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/(landing)" | "/(app)" | "/" | "/api" | "/api/auth" | "/api/auth/[...all]" | "/api/billing" | "/api/billing/cancel" | "/api/claude" | "/api/claude/callback" | "/api/claude/connect" | "/api/claude/disconnect" | "/api/claude/refresh" | "/api/onboarding" | "/api/onboarding/validate-bot" | "/api/provision" | "/api/provision/callback" | "/api/provision/callback/[userId]" | "/api/provision/deploy" | "/(app)/auth" | "/(app)/auth/callback" | "/(app)/dashboard" | "/(app)/dashboard/billing" | "/(app)/dashboard/claude" | "/(app)/login" | "/(app)/onboarding" | "/robots.txt" | "/(app)/signup" | "/sitemap.xml";
		RouteParams(): {
			"/api/auth/[...all]": { all: string };
			"/api/provision/callback/[userId]": { userId: string }
		};
		LayoutParams(): {
			"/(landing)": Record<string, never>;
			"/(app)": Record<string, never>;
			"/": { all?: string; userId?: string };
			"/api": { all?: string; userId?: string };
			"/api/auth": { all?: string };
			"/api/auth/[...all]": { all: string };
			"/api/billing": Record<string, never>;
			"/api/billing/cancel": Record<string, never>;
			"/api/claude": Record<string, never>;
			"/api/claude/callback": Record<string, never>;
			"/api/claude/connect": Record<string, never>;
			"/api/claude/disconnect": Record<string, never>;
			"/api/claude/refresh": Record<string, never>;
			"/api/onboarding": Record<string, never>;
			"/api/onboarding/validate-bot": Record<string, never>;
			"/api/provision": { userId?: string };
			"/api/provision/callback": { userId?: string };
			"/api/provision/callback/[userId]": { userId: string };
			"/api/provision/deploy": Record<string, never>;
			"/(app)/auth": Record<string, never>;
			"/(app)/auth/callback": Record<string, never>;
			"/(app)/dashboard": Record<string, never>;
			"/(app)/dashboard/billing": Record<string, never>;
			"/(app)/dashboard/claude": Record<string, never>;
			"/(app)/login": Record<string, never>;
			"/(app)/onboarding": Record<string, never>;
			"/robots.txt": Record<string, never>;
			"/(app)/signup": Record<string, never>;
			"/sitemap.xml": Record<string, never>
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/auth" | "/api/auth/" | `/api/auth/${string}` & {} | `/api/auth/${string}/` & {} | "/api/billing" | "/api/billing/" | "/api/billing/cancel" | "/api/billing/cancel/" | "/api/claude" | "/api/claude/" | "/api/claude/callback" | "/api/claude/callback/" | "/api/claude/connect" | "/api/claude/connect/" | "/api/claude/disconnect" | "/api/claude/disconnect/" | "/api/claude/refresh" | "/api/claude/refresh/" | "/api/onboarding" | "/api/onboarding/" | "/api/onboarding/validate-bot" | "/api/onboarding/validate-bot/" | "/api/provision" | "/api/provision/" | "/api/provision/callback" | "/api/provision/callback/" | `/api/provision/callback/${string}` & {} | `/api/provision/callback/${string}/` & {} | "/api/provision/deploy" | "/api/provision/deploy/" | "/auth" | "/auth/" | "/auth/callback" | "/auth/callback/" | "/dashboard" | "/dashboard/" | "/dashboard/billing" | "/dashboard/billing/" | "/dashboard/claude" | "/dashboard/claude/" | "/login" | "/login/" | "/onboarding" | "/onboarding/" | "/robots.txt" | "/robots.txt/" | "/signup" | "/signup/" | "/sitemap.xml" | "/sitemap.xml/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}