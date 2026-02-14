# Phase 4: Landing Page & Public Launch - Research

**Researched:** 2026-02-14
**Domain:** SvelteKit landing page, SEO, conversion optimization, Polar checkout integration
**Confidence:** HIGH

## Summary

The landing page for Rachel Cloud will be a prerendered SvelteKit page at the root route (`/`), replacing the current placeholder. The existing project uses SvelteKit 2 + Svelte 5 + Tailwind CSS (currently via CDN -- must be migrated to proper `@tailwindcss/vite` plugin). The page needs to communicate "personal AI assistant on Telegram, managed hosting, $20/month" within 10 seconds.

The project already has a working Polar checkout integration via Better Auth at `/api/auth/checkout?slug=rachel-cloud-monthly`. The landing page CTA should route unauthenticated users to `/signup` first (since checkout requires authentication), then the existing onboarding flow handles checkout. For the landing page itself, no new backend work is needed -- this is a purely frontend phase with SEO additions.

Svelte 5's built-in transitions (`svelte/transition`) are sufficient for landing page animations (fade, fly, slide, scale). For scroll-triggered reveals, `svelte-inview` (~2KB, Intersection Observer-based) is the lightest option. No heavy animation library is needed.

**Primary recommendation:** Build a single prerendered `+page.svelte` with Tailwind CSS (properly installed), Svelte built-in transitions + `svelte-inview` for scroll reveals, `svelte-meta-tags` for SEO, a custom Telegram chat mockup component, and `github-buttons` for the star widget. CTA links to `/signup`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | ^2.0.0 | Framework (already installed) | Already in project |
| Svelte | ^5.0.0 | UI framework (already installed) | Already in project, use `$props()`, `$state()`, `$derived()` |
| Tailwind CSS | ^4.x | Utility-first CSS | Already used (CDN), must migrate to `@tailwindcss/vite` |
| `@tailwindcss/vite` | latest | Vite plugin for Tailwind v4 | Official SvelteKit integration method for Tailwind v4 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `svelte-meta-tags` | ^4.5.0 | SEO meta tags, Open Graph, Twitter Cards | Every page needs SEO tags; component-based approach |
| `svelte-inview` | ^4.0.4 | Intersection Observer for scroll-triggered animations | Reveal-on-scroll for landing page sections |
| `github-buttons` | latest | GitHub star/fork button widget | Open-source section to drive GitHub stars |
| `schema-dts` | latest | TypeScript types for Schema.org JSON-LD | Type-safe structured data in `<svelte:head>` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `svelte-meta-tags` | Manual `<svelte:head>` tags | svelte-meta-tags provides typed props, handles edge cases, manages defaults; manual is fine for simple cases but error-prone for OG/Twitter |
| `svelte-inview` | `svelte-motion` (Framer Motion port) | svelte-motion is 0.12.2, last updated 2+ years ago, much heavier; svelte-inview is 2KB and actively maintained |
| `svelte-inview` | Svelte built-in transitions only | Built-in transitions don't have scroll-trigger capability; you'd need manual IntersectionObserver code |
| `github-buttons` | shields.io badge | github-buttons shows live star count with official GitHub styling; shields.io is static image badge |
| Tailwind v4 via `@tailwindcss/vite` | Keep CDN Tailwind | CDN is blocking render, not tree-shaken, no custom config, no `@apply`, not production-ready |

**Installation:**
```bash
bun add -d tailwindcss @tailwindcss/vite
bun add svelte-meta-tags svelte-inview schema-dts
```

Note: `github-buttons` is loaded via `<script>` tag, not npm install.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── routes/
│   ├── +page.svelte            # Landing page (prerendered)
│   ├── +page.ts                # export const prerender = true
│   ├── +layout.svelte          # Root layout (Tailwind import, global meta)
│   ├── sitemap.xml/
│   │   └── +server.ts          # Dynamic sitemap endpoint
│   ├── signup/+page.svelte     # (existing)
│   ├── login/+page.svelte      # (existing)
│   └── dashboard/              # (existing)
├── lib/
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Hero.svelte
│   │   │   ├── HowItWorks.svelte
│   │   │   ├── Features.svelte
│   │   │   ├── TelegramDemo.svelte
│   │   │   ├── Pricing.svelte
│   │   │   ├── OpenSource.svelte
│   │   │   ├── FAQ.svelte
│   │   │   └── Footer.svelte
│   │   └── seo/
│   │       └── JsonLd.svelte
│   └── assets/
│       └── og-image.png        # Open Graph share image (1200x630)
├── app.css                     # Tailwind import
└── app.html                    # (existing)
```

### Pattern 1: Prerendered Landing Page
**What:** The landing page is prerendered at build time as static HTML. All other routes (dashboard, onboarding) remain SSR.
**When to use:** Marketing/landing pages with no dynamic data.
**Example:**
```typescript
// src/routes/+page.ts
// Source: https://svelte.dev/docs/kit/page-options
export const prerender = true;
```

The root `+layout.svelte` should NOT set `prerender = true` (dashboard pages need SSR). Only the landing page itself opts in.

### Pattern 2: SEO Meta Tags via svelte-meta-tags
**What:** Component-based meta tag management in `<svelte:head>`.
**When to use:** Every page, with page-specific overrides.
**Example:**
```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { MetaTags } from 'svelte-meta-tags';
</script>

<MetaTags
  title="Rachel Cloud - Your Personal AI Assistant on Telegram"
  description="Get your own AI assistant powered by Claude, running 24/7 on Telegram. Managed hosting, zero setup. $20/month."
  canonical="https://rachel-cloud.com"
  openGraph={{
    type: 'website',
    url: 'https://rachel-cloud.com',
    title: 'Rachel Cloud - Your Personal AI Assistant on Telegram',
    description: 'Get your own AI assistant powered by Claude, running 24/7 on Telegram. Managed hosting, zero setup. $20/month.',
    images: [
      {
        url: 'https://rachel-cloud.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rachel Cloud - AI Assistant on Telegram'
      }
    ],
    siteName: 'Rachel Cloud'
  }}
  twitter={{
    cardType: 'summary_large_image',
    title: 'Rachel Cloud - Your Personal AI Assistant on Telegram',
    description: 'Get your own AI assistant powered by Claude, running 24/7 on Telegram.',
    image: 'https://rachel-cloud.com/og-image.png'
  }}
/>
```

### Pattern 3: JSON-LD Structured Data
**What:** Schema.org structured data for rich search results.
**When to use:** Landing page for SoftwareApplication schema.
**Example:**
```svelte
<!-- src/lib/components/seo/JsonLd.svelte -->
<script lang="ts">
  import type { Thing, WithContext } from 'schema-dts';

  interface Props {
    schema: WithContext<Thing>;
  }

  let { schema }: Props = $props();
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(schema)}</script>`}
</svelte:head>
```

Usage in landing page:
```svelte
<script lang="ts">
  import JsonLd from '$lib/components/seo/JsonLd.svelte';
  import type { WithContext, SoftwareApplication } from 'schema-dts';

  const jsonLd: WithContext<SoftwareApplication> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Rachel Cloud',
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Web',
    description: 'Personal AI assistant powered by Claude, running 24/7 on Telegram.',
    offers: {
      '@type': 'Offer',
      price: '20.00',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31'
    },
    url: 'https://rachel-cloud.com'
  };
</script>

<JsonLd schema={jsonLd} />
```

### Pattern 4: Scroll-Triggered Reveal Animations
**What:** Sections animate into view as user scrolls down.
**When to use:** Landing page sections for engagement.
**Example:**
```svelte
<script lang="ts">
  import { inview } from 'svelte-inview';
  import { fly } from 'svelte/transition';

  let isVisible = $state(false);
</script>

<div
  use:inview={{ rootMargin: '-50px', unobserveOnEnter: true }}
  oninview_enter={() => (isVisible = true)}
>
  {#if isVisible}
    <div transition:fly={{ y: 30, duration: 600 }}>
      <!-- Section content -->
    </div>
  {/if}
</div>
```

Note: `svelte-inview` v4 uses Svelte 5 event syntax. Check that `oninview_enter` is the correct event name (may be `on:inview_enter` in older API -- verify at implementation time).

### Pattern 5: Tailwind v4 Migration
**What:** Replace CDN Tailwind with proper Vite plugin installation.
**When to use:** First task in this phase -- everything else depends on it.
**Example:**
```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit()
  ]
});
```

```css
/* src/app.css */
@import "tailwindcss";
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

Remove the CDN `<script src="https://cdn.tailwindcss.com">` from `+layout.svelte`.

### Anti-Patterns to Avoid
- **Tailwind CDN in production:** The CDN version generates all utilities on-the-fly in the browser, is not tree-shaken, blocks rendering, and is explicitly marked "for development only." Must migrate before launch.
- **Animating everything:** Only animate elements that benefit from it (section reveals, hero elements). Over-animation feels cheap and slows perceived performance.
- **Client-side rendering the landing page:** The landing page MUST be prerendered or SSR'd for SEO. Never set `ssr = false` on the landing page route.
- **Putting dynamic data on the landing page:** The landing page should be 100% static content. No database queries, no session checks. This keeps it fast and prerenderable.
- **Fat hero images without optimization:** Use WebP/AVIF formats, proper `srcset`, and `loading="lazy"` for below-fold images. The OG image can be PNG for compatibility.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SEO meta tags | Manual `<meta>` string building | `svelte-meta-tags` | Handles all OG/Twitter tag variations, prevents duplicate tags, typed props |
| JSON-LD | Manual JSON string construction | `schema-dts` + small component | TypeScript types catch schema errors at build time |
| Intersection Observer | Custom IntersectionObserver code | `svelte-inview` action | 2KB, handles cleanup, threshold/margin config, battle-tested |
| GitHub star button | Custom GitHub API fetch + render | `github-buttons` script | Handles caching, rate limiting, GitHub auth, styling |
| Telegram chat mockup | Screenshot images | Custom CSS component | Screenshots break at different screen sizes, look unprofessional on retina; CSS bubbles scale perfectly and can be animated |
| Sitemap | Static XML file | SvelteKit server endpoint | Dynamic generation means it stays in sync with routes |

**Key insight:** The landing page itself is simple -- the complexity is in the details (SEO tags, OG images, structured data, responsive design, accessibility). Use purpose-built tools for these details and spend creative energy on copy and visual design.

## Common Pitfalls

### Pitfall 1: Tailwind CDN in Production
**What goes wrong:** Page loads with flash of unstyled content, Tailwind CDN generates ~3MB of CSS client-side, Google PageSpeed tanks.
**Why it happens:** CDN was a quick setup during development, never replaced.
**How to avoid:** First task in this phase: migrate to `@tailwindcss/vite`. Remove CDN script tag from `+layout.svelte`.
**Warning signs:** `<script src="https://cdn.tailwindcss.com">` in any layout or page file.

### Pitfall 2: Missing OG Image Dimensions
**What goes wrong:** Social media previews show broken/missing image or wrong aspect ratio.
**Why it happens:** OG image tags missing `width` and `height` properties, or image isn't 1200x630px.
**How to avoid:** Always specify dimensions in OG meta tags. Create OG image at exactly 1200x630px. Test with Facebook Sharing Debugger and Twitter Card Validator.
**Warning signs:** Sharing the URL on Slack/Twitter shows no preview image.

### Pitfall 3: Landing Page Not Prerendered
**What goes wrong:** Landing page loads slowly, SEO crawler sees loading state instead of content.
**Why it happens:** Forgot `export const prerender = true` in `+page.ts`, or landing page imports server-only modules.
**How to avoid:** Create `src/routes/+page.ts` with `export const prerender = true`. Verify at build time that the landing page HTML is fully rendered in the build output.
**Warning signs:** `vite build` output doesn't show the landing page in prerendered pages list.

### Pitfall 4: CTA Links to Checkout Directly (Without Auth)
**What goes wrong:** Unauthenticated visitors click "Sign Up" CTA, hit `/api/auth/checkout`, get redirected to login, lose context, confusion.
**Why it happens:** The existing checkout endpoint (`/api/auth/checkout?slug=rachel-cloud-monthly`) requires authentication (`authenticatedUsersOnly: true` in the Polar config).
**How to avoid:** Landing page CTA should link to `/signup` (which already exists). After signup, the onboarding flow handles checkout. The path is: Landing Page -> Sign Up -> Onboarding (payment step) -> Checkout.
**Warning signs:** Any `<a href="/api/auth/checkout">` on the landing page.

### Pitfall 5: Svelte 5 Syntax Mistakes
**What goes wrong:** Using Svelte 4 syntax (`export let`, `on:click`, `<slot>`) in a Svelte 5 project.
**Why it happens:** Most tutorial code online is Svelte 4. The existing codebase uses Svelte 5 (`$props()`, `$state()`, `onclick`, `{@render children()}`).
**How to avoid:** Follow the patterns already established in the codebase. Use `$props()` not `export let`, `onclick` not `on:click`, `{@render children()}` not `<slot>`.
**Warning signs:** Compiler warnings about deprecated Svelte 4 syntax.

### Pitfall 6: Forgetting to Handle Mobile Responsiveness
**What goes wrong:** Landing page looks great on desktop, broken on mobile (where 60%+ of traffic comes from).
**Why it happens:** Developing primarily on a large monitor.
**How to avoid:** Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`). Design mobile-first. Test at 375px width (iPhone SE) as minimum.
**Warning signs:** Horizontal scrollbar on mobile, text overflowing containers, unreadable font sizes.

## Code Examples

### Landing Page Section Layout (Recommended)
```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { MetaTags } from 'svelte-meta-tags';
  import JsonLd from '$lib/components/seo/JsonLd.svelte';
  import Hero from '$lib/components/landing/Hero.svelte';
  import HowItWorks from '$lib/components/landing/HowItWorks.svelte';
  import Features from '$lib/components/landing/Features.svelte';
  import TelegramDemo from '$lib/components/landing/TelegramDemo.svelte';
  import Pricing from '$lib/components/landing/Pricing.svelte';
  import OpenSource from '$lib/components/landing/OpenSource.svelte';
  import FAQ from '$lib/components/landing/FAQ.svelte';
  import Footer from '$lib/components/landing/Footer.svelte';

  // ... meta tags config, JSON-LD schema ...
</script>

<MetaTags {/* ... */} />
<JsonLd schema={jsonLd} />

<main>
  <Hero />
  <HowItWorks />
  <Features />
  <TelegramDemo />
  <Pricing />
  <OpenSource />
  <FAQ />
  <Footer />
</main>
```

### Telegram Chat Mockup Component (CSS-based)
```svelte
<!-- src/lib/components/landing/TelegramDemo.svelte -->
<script lang="ts">
  interface Message {
    text: string;
    sender: 'user' | 'rachel';
    time: string;
  }

  const messages: Message[] = [
    { text: 'Hey Rachel, can you summarize the news today?', sender: 'user', time: '10:30 AM' },
    { text: 'Here are today\'s top stories...', sender: 'rachel', time: '10:30 AM' },
    { text: 'Set a reminder for my meeting at 3pm', sender: 'user', time: '10:31 AM' },
    { text: 'Done! I\'ll remind you at 2:45 PM.', sender: 'rachel', time: '10:31 AM' }
  ];
</script>

<div class="max-w-sm mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
  <!-- Telegram-style header -->
  <div class="bg-blue-500 text-white px-4 py-3 flex items-center gap-3">
    <div class="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-lg font-bold">R</div>
    <div>
      <div class="font-semibold">Rachel</div>
      <div class="text-xs text-blue-100">online</div>
    </div>
  </div>
  <!-- Messages -->
  <div class="p-4 space-y-3 bg-gray-50 min-h-[300px]">
    {#each messages as msg}
      <div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[80%] px-3 py-2 rounded-lg text-sm {msg.sender === 'user'
          ? 'bg-blue-500 text-white rounded-br-none'
          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'}">
          <p>{msg.text}</p>
          <p class="text-xs mt-1 {msg.sender === 'user' ? 'text-blue-100' : 'text-gray-400'} text-right">
            {msg.time}
          </p>
        </div>
      </div>
    {/each}
  </div>
</div>
```

### GitHub Star Button Integration
```svelte
<!-- src/lib/components/landing/OpenSource.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    // Load github-buttons script dynamically
    const script = document.createElement('script');
    script.src = 'https://buttons.github.io/buttons.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
</script>

<section class="py-20 bg-gray-900 text-white">
  <div class="max-w-4xl mx-auto text-center px-4">
    <h2 class="text-3xl font-bold mb-4">Open Source</h2>
    <p class="text-lg text-gray-300 mb-8">
      Rachel8 is open source. Self-host it yourself, or let us handle everything.
    </p>
    <div class="flex items-center justify-center gap-4">
      <a
        class="github-button"
        href="https://github.com/polly3223/Rachel8"
        data-icon="octicon-star"
        data-size="large"
        data-show-count="true"
        aria-label="Star polly3223/Rachel8 on GitHub"
      >
        Star
      </a>
      <a
        href="https://github.com/polly3223/Rachel8"
        class="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on GitHub
      </a>
    </div>
  </div>
</section>
```

### Sitemap Endpoint
```typescript
// src/routes/sitemap.xml/+server.ts
export const prerender = true;

export async function GET() {
  const pages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/signup', priority: '0.8', changefreq: 'monthly' },
    { url: '/login', priority: '0.5', changefreq: 'monthly' }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>https://rachel-cloud.com${p.url}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap.trim(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600'
    }
  });
}
```

### Polar Embedded Checkout (Alternative CTA Pattern)
```svelte
<!--
  Alternative: If you want to embed Polar checkout directly on the landing page
  without requiring auth first. This bypasses the Better Auth checkout flow
  and creates a standalone checkout session.

  NOTE: This only works for unauthenticated "anonymous" checkouts.
  The current setup uses authenticatedUsersOnly: true in the Polar config,
  so this pattern would require config changes. Recommend sticking with
  /signup CTA for now.
-->
<a
  href="__POLAR_CHECKOUT_LINK_URL__"
  data-polar-checkout
  data-polar-checkout-theme="light"
>
  Sign Up - $20/month
</a>

<script
  defer
  data-auto-init
  src="https://cdn.jsdelivr.net/npm/@polar-sh/checkout@latest/dist/embed.global.js"
></script>
```

## Landing Page Section Breakdown

Based on research of 100+ developer tool landing pages (Evil Martians study) and AI SaaS best practices:

### Recommended Section Order
| # | Section | Purpose | Above Fold? |
|---|---------|---------|-------------|
| 1 | **Hero** | Headline + subheadline + CTA + visual | YES |
| 2 | **How It Works** | 3-step process (Sign Up -> Connect Telegram -> Chat) | NO |
| 3 | **Features** | Key capabilities (24/7, Claude-powered, Telegram, managed) | NO |
| 4 | **Telegram Demo** | CSS mockup of Telegram conversation with Rachel | NO |
| 5 | **Pricing** | Single $20/month card with feature list + CTA | NO |
| 6 | **Open Source** | Rachel8 repo link + GitHub star button | NO |
| 7 | **FAQ** | Common questions (BYOK, what's included, cancel, etc.) | NO |
| 8 | **Footer** | Links, copyright, legal | NO |

### Hero Section Best Practices (from dev tool research)
- Big, bold headline centered on screen (standard for dev tools in 2025)
- Subheadline explains what it does in one sentence
- Primary CTA "Sign Up" button visible without scrolling
- Price ($20/month) shown in or near the CTA
- Supporting visual: Telegram chat mockup or product screenshot on right side (desktop) / below (mobile)
- No video autoplay in hero -- it slows load time and annoys users

### Pricing Section
- Single plan card (not a comparison table -- there's only one plan)
- Price prominently displayed: "$20/month"
- Feature checklist identical to the one already in onboarding page
- "Sign Up" CTA button
- "Cancel anytime" reassurance text

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind via CDN | `@tailwindcss/vite` plugin (Tailwind v4) | 2024-2025 | Tree-shaking, no render blocking, proper build integration |
| `tailwind.config.js` | CSS-based config with `@import "tailwindcss"` | Tailwind v4 (2025) | No config file needed, CSS-native customization |
| Svelte 4 `export let` | Svelte 5 `$props()` | Svelte 5 (2024) | Already using in this project |
| `on:click` event syntax | `onclick` attribute syntax | Svelte 5 (2024) | Already using in this project |
| `<slot>` | `{@render children()}` | Svelte 5 (2024) | Already using in this project |
| `fb:app_id` in OG tags | No longer needed | ~2023 | Don't include it |
| Static OG images | Dynamic OG image generation (satori/vercel/og) | 2023-2025 | Nice-to-have but static PNG is fine for launch |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Not needed with Tailwind v4. Configuration is done in CSS.
- `postcss.config.js` for Tailwind: Use `@tailwindcss/vite` plugin instead. The PostCSS approach is still supported but the Vite plugin is preferred.
- `svelte-motion`: Last updated 2+ years ago (v0.12.2). Not recommended for new projects. Use Svelte built-in transitions.
- `fb:app_id` in Open Graph tags: No longer best practice to include.

## Open Questions

1. **Svelte-inview Svelte 5 event syntax**
   - What we know: svelte-inview v4.0.4 exists, claims Svelte 5 support. The action-based API (`use:inview`) should work in Svelte 5 unchanged.
   - What's unclear: Whether the event callback uses Svelte 5's `on` prefix syntax or the old `on:` directive syntax. The npm page mentions `on:inview_change` (Svelte 4 syntax).
   - Recommendation: Test at implementation time. If the events don't work with Svelte 5, fall back to a simple custom `use:inview` action wrapping IntersectionObserver directly (10 lines of code).

2. **Polar Checkout Link URL Format**
   - What we know: Polar Checkout Links are created in the Polar dashboard. They support query parameters (`customer_email`, UTM params, etc.). The project already uses Better Auth's `/api/auth/checkout?slug=rachel-cloud-monthly` endpoint.
   - What's unclear: The exact URL format of Polar Checkout Links (whether they look like `https://checkout.polar.sh/...` or something else). The existing project creates checkout sessions server-side via Better Auth plugin.
   - Recommendation: Don't use Polar Checkout Links on the landing page. The existing flow (Sign Up -> Onboarding -> Better Auth Checkout) is already built and working. The CTA should link to `/signup`.

3. **OG Image Creation**
   - What we know: OG images should be 1200x630px PNG. They should show the product name, tagline, and a visual.
   - What's unclear: Whether to create manually (Figma/Canva) or generate dynamically (satori/vercel-og).
   - Recommendation: Create a static OG image manually for launch. Dynamic OG generation is over-engineering for a single landing page. Design it in Figma or Canva and export as PNG.

4. **Existing Page Routes and Layout Separation**
   - What we know: The root `+layout.svelte` currently wraps everything in `<div class="min-h-screen bg-gray-50">` and loads Tailwind CDN. Dashboard pages have their own `+layout.svelte` with sidebar.
   - What's unclear: Whether the landing page needs a different layout than the dashboard.
   - Recommendation: The landing page should NOT use the dashboard layout. The root `+layout.svelte` should be minimal (just Tailwind import + `{@render children()}`). The landing page manages its own full-page layout. The `bg-gray-50` wrapper should move into specific pages or a `(app)` route group layout.

## Sources

### Primary (HIGH confidence)
- SvelteKit official docs - SEO: https://svelte.dev/docs/kit/seo
- SvelteKit official docs - Page options (prerender): https://svelte.dev/docs/kit/page-options
- Tailwind CSS official - SvelteKit installation guide: https://tailwindcss.com/docs/guides/sveltekit
- Polar docs - Checkout Links: https://polar.sh/docs/features/checkout/links
- Polar docs - Embedded Checkout: https://polar.sh/docs/features/checkout/embed
- github-buttons official: https://buttons.github.io/
- Svelte transition docs: https://svelte.dev/docs/svelte/svelte-transition

### Secondary (MEDIUM confidence)
- svelte-meta-tags v4.5.0 (648 GitHub stars, last release Oct 2025): https://github.com/oekazuma/svelte-meta-tags
- svelte-inview v4.0.4 (~2KB, Intersection Observer based): https://github.com/svelte-inview/svelte-inview
- Evil Martians - "100 dev tool landing pages" study: https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025
- Existing project code: `/tmp/rachel-cloud/src/lib/auth/config.ts` (Polar checkout config), `/tmp/rachel-cloud/src/routes/onboarding/+page.svelte` (checkout flow)

### Tertiary (LOW confidence)
- svelte-inview Svelte 5 event syntax: needs validation at implementation time (event callback naming may differ)
- Polar Checkout Link URL format: not directly verified (docs reference dashboard-generated URLs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via npm/GitHub, Tailwind installation verified via official docs
- Architecture: HIGH - Patterns based on SvelteKit official docs and established project conventions
- Pitfalls: HIGH - Based on existing project code analysis and official documentation
- Landing page sections: MEDIUM - Based on third-party research (Evil Martians study), established SaaS patterns
- Animation approach: MEDIUM - svelte-inview Svelte 5 compatibility needs validation at implementation

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days -- stable domain, libraries well-established)
