<script lang="ts">
	interface FAQItem {
		question: string;
		answer: string;
	}

	const faqs: FAQItem[] = [
		{
			question: 'Do I need to be technical to use Rachel?',
			answer: 'Not at all. If you can send a text message, you can use Rachel. Everything happens through Telegram — just type what you need in plain language. No coding, no dashboards, no training required.'
		},
		{
			question: 'What exactly can Rachel do for my business?',
			answer: 'Rachel can build landing pages and track leads, manage your contacts and follow-ups, generate documents and presentations, schedule reminders and tasks, research suppliers or competitors, translate messages in any language, draft emails and social media posts — and much more. Think of her as a personal assistant who never sleeps.'
		},
		{
			question: 'How does the landing page and lead tracking work?',
			answer: 'Just tell Rachel what kind of page you need — she builds it and publishes it. When someone fills in a form, Rachel captures the data and notifies you. You can ask her anytime for a summary or export the full list as an Excel or CSV file, delivered right to your Telegram.'
		},
		{
			question: 'What do I need to get started?',
			answer: 'A Telegram account and a Claude subscription (from Anthropic). Rachel Cloud handles everything else — the server, the setup, and the monitoring. You\'ll be up and running in under 5 minutes.'
		},
		{
			question: 'Why do I also need a Claude subscription?',
			answer: 'Rachel is powered by Claude, one of the most advanced AI models in the world. Your Claude subscription gives Rachel her brainpower. You connect it via a simple login — no technical setup. The combined cost of Rachel Cloud + Claude pays for itself quickly when you consider the hours saved.'
		},
		{
			question: 'Is my data safe?',
			answer: 'Yes. Rachel runs on your own private server — not shared with anyone else. Your conversations, contacts, and business data stay on your server. Rachel is also fully open source, so anyone can verify exactly what the software does. We never see or access your data.'
		},
		{
			question: 'Can I cancel anytime?',
			answer: 'Absolutely. No contracts, no cancellation fees, no lock-in. Cancel whenever you want with one click.'
		},
		{
			question: 'What is the referral program?',
			answer: 'Share Rachel with a friend and you both get \u20AC10 off. They save on their first month, you save on your next one. Simple as that.'
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
			Got questions? We've got answers.
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
