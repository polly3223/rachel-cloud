# Phase 4: Landing Page & Public Launch - Context

**Created:** 2026-02-14
**Source:** User decisions + research (04-RESEARCH.md)

## Decisions

### LOCKED (Non-negotiable)

1. **Tailwind CSS migration:** Move from CDN (`<script src="https://cdn.tailwindcss.com">`) to `@tailwindcss/vite` plugin. Tailwind v4 with CSS-based config (`@import "tailwindcss"` in `app.css`). No `tailwind.config.js` needed.

2. **Landing page prerendered as static HTML:** `export const prerender = true` in `src/routes/+page.ts`. No dynamic data on landing page.

3. **Telegram chat mockup as CSS component:** Build a custom Svelte component with Tailwind-styled chat bubbles. NOT screenshots. Scales across screen sizes and can be animated.

4. **svelte-meta-tags for SEO:** Use `svelte-meta-tags` (v4.5+) for Open Graph, Twitter Cards, canonical URLs. Component-based approach with typed props.

5. **schema-dts for JSON-LD:** TypeScript types for Schema.org structured data. Small `JsonLd.svelte` wrapper component renders `<script type="application/ld+json">` in `<svelte:head>`.

6. **svelte-inview for scroll animations:** Use `svelte-inview` (v4.0+) as Svelte action (`use:inview`) for scroll-triggered reveals. If Svelte 5 compat issues arise, fall back to a custom IntersectionObserver action (~10 lines).

7. **github-buttons via script tag:** Load `https://buttons.github.io/buttons.js` dynamically in `onMount`. Not installed via npm.

8. **Route groups to separate layouts:** Use SvelteKit route groups: `(landing)` for the landing page (no dashboard chrome), `(app)` for dashboard/onboarding routes (with sidebar layout). Root `+layout.svelte` becomes minimal (Tailwind import + render children).

9. **CTA links to /signup:** Landing page CTAs point to `/signup` (existing auth flow). NOT to `/api/auth/checkout` directly (requires auth). Flow: Landing -> Sign Up -> Onboarding (payment) -> Checkout.

10. **No new backend work:** This is a purely frontend phase. No new API endpoints, database changes, or server-side logic.

## Deferred Ideas

- Dynamic OG image generation (satori/vercel-og) -- static PNG is fine for launch
- Blog/content pages -- only landing page for now
- A/B testing on landing page -- ship first, optimize later
- Video demo/autoplay in hero -- slows load time
- Polar embedded checkout on landing page -- existing /signup flow is already built

## Claude's Discretion

- Exact copy/headline text for landing page sections
- Color scheme and visual design details (follow existing blue/gray palette from login/onboarding)
- FAQ content (common questions about the product)
- Section ordering within the recommended structure (Hero, HowItWorks, Features, TelegramDemo, Pricing, OpenSource, FAQ, Footer)
- Telegram chat mockup conversation content
- Animation timing and easing for scroll reveals
- Whether to include a sitemap.xml endpoint (recommended in research)
