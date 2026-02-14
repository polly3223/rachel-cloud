<script lang="ts">
	interface Message {
		text: string;
		sender: 'user' | 'rachel';
		time: string;
	}

	const messages: Message[] = [
		{
			text: "What's on my calendar today?",
			sender: 'user',
			time: '9:15 AM'
		},
		{
			text: "You have 3 things today:\n\n10:00 AM — Team standup\n1:00 PM — Lunch with Sarah\n4:00 PM — Dentist appointment\n\nYour morning is free until standup.",
			sender: 'rachel',
			time: '9:15 AM'
		},
		{
			text: 'Remind me to call the dentist tomorrow at 10am',
			sender: 'user',
			time: '9:16 AM'
		},
		{
			text: "Done! I'll remind you tomorrow (Wednesday) at 10:00 AM to call the dentist.",
			sender: 'rachel',
			time: '9:16 AM'
		},
		{
			text: 'What did we talk about last week?',
			sender: 'user',
			time: '9:17 AM'
		},
		{
			text: "Last week we covered:\n\n— Your trip planning for Portland in March\n— The new project proposal you were drafting\n— Setting up weekly meal prep reminders\n\nWant me to pull up details on any of these?",
			sender: 'rachel',
			time: '9:17 AM'
		}
	];
</script>

<section class="py-24 bg-[#0a0a0f] border-t border-white/5">
	<div class="max-w-5xl mx-auto px-6">
		<p class="text-sm font-medium text-cyan-400 text-center mb-3 tracking-wide uppercase">See it in action</p>
		<h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
			Just open Telegram and talk
		</h2>
		<p class="text-center text-gray-500 mb-14 max-w-md mx-auto">
			This is what a real conversation with Rachel looks like.
		</p>

		<div class="max-w-sm mx-auto">
			<div class="rounded-2xl shadow-2xl shadow-black/50 overflow-hidden border border-white/10">
				<!-- Header -->
				<div class="bg-[#1c2733] px-4 py-3 flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-violet-500/20">
						R
					</div>
					<div class="flex-1">
						<div class="font-semibold text-white text-sm">Rachel</div>
						<div class="text-xs text-emerald-400 flex items-center gap-1">
							<span class="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
							online
						</div>
					</div>
				</div>

				<!-- Messages -->
				<div class="px-3 py-4 space-y-2.5 bg-[#0e1621] min-h-[380px]">
					{#each messages as msg}
						<div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[80%] px-3.5 py-2 text-[13px] leading-relaxed {msg.sender === 'user'
									? 'bg-[#2b5278] text-white rounded-2xl rounded-br-md'
									: 'bg-[#182533] text-gray-200 rounded-2xl rounded-bl-md'}"
							>
								<p class="whitespace-pre-line">{msg.text}</p>
								<p class="text-[10px] mt-1 text-right {msg.sender === 'user' ? 'text-blue-300/50' : 'text-gray-600'}">
									{msg.time}
								</p>
							</div>
						</div>
					{/each}

					<!-- Typing -->
					<div class="flex justify-start">
						<div class="bg-[#182533] rounded-2xl rounded-bl-md px-4 py-3">
							<div class="flex items-center gap-1">
								<span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
								<span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full delay-150"></span>
								<span class="typing-dot w-1.5 h-1.5 bg-gray-500 rounded-full delay-300"></span>
							</div>
						</div>
					</div>
				</div>

				<!-- Input bar -->
				<div class="bg-[#17212b] px-3 py-2.5 flex items-center gap-2 border-t border-white/5">
					<div class="flex-1 bg-[#242f3d] rounded-full px-4 py-2 text-sm text-gray-600">
						Message
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes typing {
		0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
		30% { opacity: 1; transform: translateY(-2px); }
	}
	.typing-dot { animation: typing 1.4s ease-in-out infinite; }
	.delay-150 { animation-delay: 0.15s; }
	.delay-300 { animation-delay: 0.3s; }
</style>
