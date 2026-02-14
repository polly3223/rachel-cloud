<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import JsonLd from '$lib/components/seo/JsonLd.svelte';
	import type { WithContext, SoftwareApplication } from 'schema-dts';

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

<div class="min-h-screen bg-white">
	<div class="max-w-4xl mx-auto px-4">
		<h1 class="text-4xl font-bold text-center mt-20">Rachel Cloud</h1>
		<p class="text-center text-gray-600 mt-4">Your personal AI assistant on Telegram</p>
		<div class="text-center mt-8">
			<a href="/signup" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block">Sign Up</a>
		</div>
	</div>
</div>
