<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import JsonLd from '$lib/components/seo/JsonLd.svelte';
	import type { WithContext, SoftwareApplication } from 'schema-dts';
	import { inview } from 'svelte-inview';
	import Hero from '$lib/components/landing/Hero.svelte';
	import HowItWorks from '$lib/components/landing/HowItWorks.svelte';
	import Features from '$lib/components/landing/Features.svelte';
	import TelegramDemo from '$lib/components/landing/TelegramDemo.svelte';
	import Pricing from '$lib/components/landing/Pricing.svelte';
	import OpenSource from '$lib/components/landing/OpenSource.svelte';
	import FAQ from '$lib/components/landing/FAQ.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';

	const title = 'Rachel Cloud - Your Personal AI Assistant on Telegram';
	const description =
		'Your personal AI assistant on Telegram. She builds pages, manages contacts, creates documents — all for €40/month.';
	const canonicalUrl = 'https://get-rachel.com';
	const ogImageUrl = `${canonicalUrl}/og-image.png`;

	const jsonLd: WithContext<SoftwareApplication> = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Rachel Cloud',
		applicationCategory: 'CommunicationApplication',
		operatingSystem: 'Web',
		description:
			'Personal AI assistant powered by Claude, running 24/7 on Telegram. Managed hosting, zero setup.',
		offers: {
			'@type': 'Offer',
			price: '40.00',
			priceCurrency: 'EUR'
		},
		url: canonicalUrl
	};

	const inviewOptions = { rootMargin: '-100px', unobserveOnEnter: true };

	function reveal(e: CustomEvent) {
		const node = e.detail.node as HTMLElement;
		node.classList.remove('opacity-0', 'translate-y-8');
		node.classList.add('opacity-100', 'translate-y-0');
	}
</script>

<svelte:head>
	<noscript>
		<style>
			.scroll-reveal {
				opacity: 1 !important;
				transform: none !important;
			}
		</style>
	</noscript>
</svelte:head>

<MetaTags
	{title}
	{description}
	canonical={canonicalUrl}
	openGraph={{
		type: 'website',
		url: canonicalUrl,
		title,
		description,
		images: [
			{
				url: ogImageUrl,
				width: 1200,
				height: 630,
				alt: 'Rachel Cloud - AI Assistant on Telegram'
			}
		],
		siteName: 'Rachel Cloud'
	}}
	twitter={{
		cardType: 'summary_large_image',
		title,
		description: 'Your personal AI assistant on Telegram, powered by Claude. Deploy in under 2 minutes.',
		image: ogImageUrl
	}}
/>
<JsonLd schema={jsonLd} />

<main>
	<Hero />
	<div
		class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out"
		use:inview={inviewOptions}
		oninview_enter={reveal}
	>
		<HowItWorks />
	</div>
	<div
		class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out"
		use:inview={inviewOptions}
		oninview_enter={reveal}
	>
		<Features />
	</div>
	<div
		class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out"
		use:inview={inviewOptions}
		oninview_enter={reveal}
	>
		<TelegramDemo />
	</div>
	<div
		class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out"
		use:inview={inviewOptions}
		oninview_enter={reveal}
	>
		<Pricing />
	</div>
	<div
		class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out"
		use:inview={inviewOptions}
		oninview_enter={reveal}
	>
		<OpenSource />
	</div>
	<div
		class="scroll-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out"
		use:inview={inviewOptions}
		oninview_enter={reveal}
	>
		<FAQ />
	</div>
</main>
<Footer />
