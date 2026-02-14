<script lang="ts">
	interface FAQItem {
		question: string;
		answer: string;
	}

	const faqs: FAQItem[] = [
		{
			question: 'What do I need to get started?',
			answer: 'A Claude subscription (Max or Team plan) and a Telegram account. Rachel Cloud handles everything else -- server setup, deployment, and monitoring.'
		},
		{
			question: 'Do I need my own Claude API key?',
			answer: 'No. You connect your existing Claude account via OAuth. No API key needed -- just authorize with your Anthropic account and you\'re set.'
		},
		{
			question: 'What can Rachel do?',
			answer: 'Anything Claude can do: answer questions, write and review code, summarize content, search the web, read files, manage scheduled tasks, and more -- all via Telegram. Rachel also has persistent memory so she remembers your preferences and past conversations.'
		},
		{
			question: 'What happens if my instance goes down?',
			answer: 'We monitor all instances 24/7 and auto-restart them if anything goes wrong. Your assistant stays online so you don\'t have to think about it.'
		},
		{
			question: 'Can I cancel anytime?',
			answer: 'Yes. Cancel anytime with a 3-day grace period. No long-term contracts, no cancellation fees.'
		},
		{
			question: 'Is Rachel open source?',
			answer: 'Yes! Rachel is fully open source on GitHub. You can self-host it on your own server for free, or let Rachel Cloud handle all the infrastructure for $20/month.'
		}
	];

	let openIndex = $state<number | null>(null);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<section class="py-20 sm:py-24 bg-gray-50">
	<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">
			Frequently Asked Questions
		</h2>

		<div class="space-y-4">
			{#each faqs as faq, i}
				<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
					<button
						onclick={() => toggle(i)}
						class="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
						aria-expanded={openIndex === i}
					>
						<span class="text-lg font-medium text-gray-900">{faq.question}</span>
						<svg
							class="w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 {openIndex === i ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
						</svg>
					</button>
					{#if openIndex === i}
						<div class="px-6 pb-5">
							<p class="text-gray-600 leading-relaxed">{faq.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
