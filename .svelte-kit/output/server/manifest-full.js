export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: null,
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js')),
			__memo(() => import('./nodes/10.js')),
			__memo(() => import('./nodes/11.js')),
			__memo(() => import('./nodes/12.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/(landing)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,4,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/api/auth/[...all]",
				pattern: /^\/api\/auth(?:\/([^]*))?\/?$/,
				params: [{"name":"all","optional":false,"rest":true,"chained":true}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/auth/_...all_/_server.ts.js'))
			},
			{
				id: "/api/billing/cancel",
				pattern: /^\/api\/billing\/cancel\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/billing/cancel/_server.ts.js'))
			},
			{
				id: "/api/claude/callback",
				pattern: /^\/api\/claude\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/claude/callback/_server.ts.js'))
			},
			{
				id: "/api/claude/connect",
				pattern: /^\/api\/claude\/connect\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/claude/connect/_server.ts.js'))
			},
			{
				id: "/api/claude/disconnect",
				pattern: /^\/api\/claude\/disconnect\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/claude/disconnect/_server.ts.js'))
			},
			{
				id: "/api/claude/refresh",
				pattern: /^\/api\/claude\/refresh\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/claude/refresh/_server.ts.js'))
			},
			{
				id: "/api/onboarding/validate-bot",
				pattern: /^\/api\/onboarding\/validate-bot\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/onboarding/validate-bot/_server.ts.js'))
			},
			{
				id: "/api/provision/callback/[userId]",
				pattern: /^\/api\/provision\/callback\/([^/]+?)\/?$/,
				params: [{"name":"userId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/provision/callback/_userId_/_server.ts.js'))
			},
			{
				id: "/api/provision/deploy",
				pattern: /^\/api\/provision\/deploy\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/provision/deploy/_server.ts.js'))
			},
			{
				id: "/(app)/auth/callback",
				pattern: /^\/auth\/callback\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/(app)/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/(app)/dashboard/billing",
				pattern: /^\/dashboard\/billing\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/(app)/dashboard/claude",
				pattern: /^\/dashboard\/claude\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/(app)/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/(app)/onboarding",
				pattern: /^\/onboarding\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/robots.txt",
				pattern: /^\/robots\.txt\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/robots.txt/_server.ts.js'))
			},
			{
				id: "/(app)/signup",
				pattern: /^\/signup\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/sitemap.xml",
				pattern: /^\/sitemap\.xml\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/sitemap.xml/_server.ts.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
