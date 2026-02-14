<script lang="ts">
	interface FAQItem {
		question: string;
		answer: string;
	}

	const faqs: FAQItem[] = [
		{
			question: 'What do I need to get started?',
			answer: 'A Claude subscription (Max or Team plan) and a Telegram account. Rachel Cloud handles everything else — server setup, deployment, and monitoring.'
		},
		{
			question: 'Do I need my own Claude API key?',
			answer: "No. You connect your existing Claude account via OAuth. No API key needed — just authorize with your Anthropic account and you're set."
		},
		{
			question: 'What can Rachel actually do?',
			answer: 'Anything Claude can do, plus more: answer questions, write code, search the web, read files, schedule tasks, set reminders — all through Telegram. She also has persistent memory, so she gets to know you over time.'
		},
		{
			question: 'What if my instance goes down?',
			answer: "We monitor all instances 24/7 and auto-restart them if anything goes wrong. Your assistant stays online so you don't have to worry about it."
		},
		{
			question: 'Can I cancel anytime?',
			answer: 'Yes. No contracts, no cancellation fees. Cancel whenever you want.'
		},
		{
			question: 'Is Rachel open source?',
			answer: 'Fully. Rachel is open source on GitHub — self-host it for free if you want. Rachel Cloud just handles all the infrastructure so you don\'t have to.'
		}
	];

	let openIndex = $state<number | null>(null);

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<section class="py-24 bg-[#0d0d14] border-t border-white/5">
	<div class="max-w-2xl mx-auto px-6">
		<p class="text-sm font-medium text-rose-400 text-center mb-3 tracking-wide uppercase">FAQ</p>
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-16">
			Questions & answers
		</h2>

		<div class="space-y-3">
			{#each faqs as faq, i}
				<div class="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-colors duration-200 {openIndex === i ? 'border-white/10' : ''}">
					<button
						onclick={() => toggle(i)}
						class="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
						aria-expanded={openIndex === i}
					>
						<span class="text-[15px] font-medium text-gray-200">{faq.question}</span>
						<svg
							class="w-4 h-4 text-gray-600 flex-shrink-0 transition-transform duration-200 {openIndex === i ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
						</svg>
					</button>
					{#if openIndex === i}
						<div class="px-5 pb-4">
							<p class="text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
