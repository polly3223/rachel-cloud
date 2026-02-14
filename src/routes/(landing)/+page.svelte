<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import JsonLd from '$lib/components/seo/JsonLd.svelte';
	import type { WithContext, SoftwareApplication } from 'schema-dts';
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
		'Get your own AI assistant powered by Claude, running 24/7 on Telegram. Managed hosting, zero setup. $20/month.';
	const canonicalUrl = 'https://rachelcloud.com';
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
			price: '20.00',
			priceCurrency: 'USD'
		},
		url: canonicalUrl
	};
</script>

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
	<HowItWorks />
	<Features />
	<TelegramDemo />
	<Pricing />
	<OpenSource />
	<FAQ />
</main>
<Footer />
