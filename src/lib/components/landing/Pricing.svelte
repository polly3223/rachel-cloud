<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<section class="py-24 bg-[#0a0a0f] border-t border-white/5">
	<div class="max-w-3xl mx-auto px-6">
		<p class="text-sm font-medium text-[#0086EE] text-center mb-3 tracking-wide uppercase">{$t.pricing.label}</p>
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
			{$t.pricing.title}
		</h2>
		<p class="text-center text-gray-500 mb-16 max-w-md mx-auto">
			{$t.pricing.subtitle}
		</p>

		<div class="relative max-w-md mx-auto">
			<!-- Glow behind card -->
			<div class="absolute -inset-1 bg-[#0086EE]/15 rounded-3xl blur-xl"></div>

			<div class="relative rounded-2xl border border-white/10 bg-[#111119] p-8 sm:p-10">
				<div class="text-center">
					<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#0086EE]/20 bg-[#0086EE]/10 text-xs text-[#0086EE] mb-6">
						<span class="w-1.5 h-1.5 rounded-full bg-[#0086EE]"></span>
						{$t.pricing.planBadge}
					</div>

					<h3 class="text-xl font-semibold text-white mb-6">{$t.pricing.planName}</h3>

					<div class="mb-8">
						<span class="text-5xl font-extrabold text-[#0086EE]">{$t.pricing.price}</span>
						<span class="text-lg text-gray-500">{$t.pricing.priceUnit}</span>
					</div>

					<ul class="text-left space-y-4 mb-10">
						{#each $t.pricing.features as feature}
							<li class="flex items-center gap-3">
								<span class="text-[#0086EE] text-sm">&#10003;</span>
								<span class="text-gray-300 text-sm">{feature}</span>
							</li>
						{/each}
					</ul>

					<a
						href="/login"
						data-track="pricing-cta"
						class="block w-full px-8 py-3.5 rounded-xl font-medium text-white text-center bg-[#0086EE] hover:bg-[#1a94f0] transition-all duration-300 shadow-lg shadow-[#0086EE]/25 hover:shadow-[#0086EE]/40"
					>
						{$t.pricing.cta}
					</a>
					<p class="mt-4 text-xs text-gray-600">
						{$t.pricing.subtext}
					</p>
				</div>
			</div>
		</div>

	</div>
</section>
