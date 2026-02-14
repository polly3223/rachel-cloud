<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<section class="py-24 bg-[#0a0a0f] border-t border-white/5">
	<div class="max-w-3xl mx-auto px-6">
		<p class="text-sm font-medium text-emerald-400 text-center mb-3 tracking-wide uppercase">{$t.pricing.label}</p>
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
			{$t.pricing.title}
		</h2>
		<p class="text-center text-gray-500 mb-16 max-w-md mx-auto">
			{$t.pricing.subtitle}
		</p>

		<div class="relative max-w-md mx-auto">
			<!-- Glow behind card -->
			<div class="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-cyan-600/20 rounded-3xl blur-xl"></div>

			<div class="relative rounded-2xl border border-white/10 bg-[#111119] p-8 sm:p-10">
				<div class="text-center">
					<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 mb-6">
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
						{$t.pricing.planBadge}
					</div>

					<h3 class="text-xl font-semibold text-white mb-6">{$t.pricing.planName}</h3>

					<div class="mb-8">
						<span class="text-5xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{$t.pricing.price}</span>
						<span class="text-lg text-gray-500">{$t.pricing.priceUnit}</span>
					</div>

					<ul class="text-left space-y-4 mb-10">
						{#each $t.pricing.features as feature}
							<li class="flex items-center gap-3">
								<span class="text-emerald-400 text-sm">&#10003;</span>
								<span class="text-gray-300 text-sm">{feature}</span>
							</li>
						{/each}
					</ul>

					<a
						href="/signup"
						class="block w-full px-8 py-3.5 rounded-xl font-medium text-white text-center bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
					>
						{$t.pricing.cta}
					</a>
					<p class="mt-4 text-xs text-gray-600">
						{$t.pricing.subtext}
					</p>
				</div>
			</div>
		</div>

		<!-- Referral banner -->
		<div class="mt-12 text-center">
			<div class="inline-flex items-center gap-3 px-6 py-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
				<span class="text-lg">{$t.pricing.referralEmoji}</span>
				<span class="text-sm text-gray-300">
					<span class="font-semibold text-violet-400">{$t.pricing.referralHighlight}</span> &mdash; {$t.pricing.referralText}
				</span>
			</div>
		</div>
	</div>
</section>
