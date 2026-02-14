import type { Translations } from '../index';

const en: Translations = {
	hero: {
		badge: 'Your personal AI that works for you 24/7',
		h1Line1: 'Run your business',
		h1Line2: 'like a superhuman',
		subtitle:
			'Rachel is an AI assistant on Telegram that builds landing pages, tracks your leads, manages contacts, schedules reminders, creates documents, and handles research — so you can focus on closing deals.',
		cta1: 'Start for \u20AC40/mo',
		cta2: 'See how it works',
		subtext: 'Open source \u00B7 You own your data \u00B7 Cancel anytime'
	},

	howItWorks: {
		label: 'How it works',
		title: 'Ready in minutes. No tech skills needed.',
		step1: {
			title: 'Sign up in 60 seconds',
			description:
				"Create your account, pick your plan, and connect your Claude subscription. That's it — no downloads, no installs."
		},
		step2: {
			title: 'Connect Telegram',
			description:
				'Follow our simple guide to link your Telegram. We walk you through every step — takes about 2 minutes.'
		},
		step3: {
			title: 'Start giving orders',
			description:
				"Open Telegram and tell Rachel what you need. Build a landing page, find leads, set reminders — she's ready to work."
		}
	},

	features: {
		label: 'What Rachel can do for you',
		title: 'Like hiring a full-time assistant for \u20AC40/mo',
		subtitle:
			'Rachel handles the work that eats up your day, so you can spend your time where it actually matters.',
		feature1: {
			title: 'Build landing pages & collect leads',
			description:
				'Tell Rachel to create a web page for your offer. She builds it, tracks who fills in forms, and sends you the leads as Excel or CSV right on Telegram.'
		},
		feature2: {
			title: 'Manage contacts & follow-ups',
			description:
				'Ask "who did I talk to last week?" and Rachel tells you. She remembers every conversation, every contact, every detail — so you never drop the ball.'
		},
		feature3: {
			title: 'Documents, presentations & reports',
			description:
				'Need a proposal? A report? A pitch deck? Just describe what you need and Rachel generates it on the spot. Ready to send.'
		},
		feature4: {
			title: 'Reminders & task scheduling',
			description:
				'"Remind me to call Marco on Monday at 9am." Done. Rachel keeps track of your tasks, deadlines, and follow-ups while you sleep.'
		},
		feature5: {
			title: 'Research anything, instantly',
			description:
				'"Find me the best suppliers for packaging in Northern Italy." Rachel searches, compares, and gives you a summary — in minutes, not hours.'
		},
		feature6: {
			title: 'Translations, emails & social media',
			description:
				'Translate messages instantly in any language. Draft emails, write social media posts, create content — all from a quick Telegram message.'
		}
	},

	telegramDemo: {
		label: 'See it in action',
		title: 'Just open Telegram and ask',
		subtitle:
			'This is what running your business with Rachel actually looks like. No apps to learn. No dashboards. Just chat.',
		online: 'online',
		inputPlaceholder: 'Message',
		messages: {
			user1: 'How many people signed up on my landing page today?',
			rachel1:
				"You got 7 new signups today! Here's the breakdown:\n\n1. Marco Rossi \u2014 marco@rossi.it\n2. Elena Bianchi \u2014 elena.b@gmail.com\n3. Fabio Conti \u2014 fabio@contigroup.com\n4. Sara De Luca \u2014 sara.deluca@outlook.com\n5. Luca Moretti \u2014 luca.m@hotmail.it\n6. Anna Ferrari \u2014 a.ferrari@yahoo.com\n7. Giulia Greco \u2014 giulia@greco.biz\n\nWant me to send you the full list as an Excel file?",
			user2:
				'Yes, send the Excel. And remind me to call Marco Rossi tomorrow at 9am \u2014 he looks like a hot lead.',
			rachel2:
				"Done! Here's your file: signups_2026-02-14.xlsx\n\nReminder set: Call Marco Rossi \u2014 tomorrow (Saturday) at 9:00 AM.\n\nBy the way, Marco visited your page 3 times before signing up. Definitely interested.",
			user3:
				'Draft a follow-up email for all 7 signups. Professional but friendly, mention our free consultation offer.',
			rachel3:
				"Here's your draft:\n\nSubject: Thanks for your interest \u2014 let's chat!\n\nHi [Name],\n\nThanks for signing up! I'd love to offer you a free 15-minute consultation to see how we can help your business.\n\nJust reply to this email with a time that works for you, or pick a slot here: [your calendar link]\n\nLooking forward to it!\n\nWant me to adjust the tone or add anything?"
		}
	},

	pricing: {
		label: 'Pricing',
		title: 'Less than a coffee a day. Pays for itself in week one.',
		subtitle:
			'Think about how many hours you spend on admin, research, and follow-ups. Rachel gives you those hours back.',
		planBadge: 'Everything included',
		planName: 'Rachel Cloud',
		price: '\u20AC40',
		priceUnit: '/month',
		features: [
			'Your own AI assistant on Telegram \u2014 available 24/7',
			'Build landing pages, track leads, export data',
			'Contact management, reminders & scheduling',
			'Documents, research, translations \u2014 on demand',
			'Dedicated private server \u2014 your data stays yours',
			'Monitored 24/7 with auto-recovery',
			'Cancel anytime \u2014 no contracts, no tricks'
		],
		cta: 'Start now \u2014 \u20AC40/mo',
		subtext:
			'+ your Claude subscription (separate) \u00B7 Together they pay for themselves in hours saved',
		referralEmoji: '\uD83C\uDF81',
		referralHighlight: 'Give \u20AC10, Get \u20AC10',
		referralText: 'share Rachel with a friend and you both save'
	},

	openSource: {
		label: 'Transparent & trustworthy',
		title: 'Open source. You own everything.',
		paragraph1:
			"Rachel's code is 100% open source. Your data lives on your own private server \u2014 we never see it, we never sell it, we never touch it.",
		paragraph2:
			"Want to host it yourself? Go ahead \u2014 it's free. Want us to handle everything? That's Rachel Cloud for \u20AC40/mo.",
		starButton: 'Star',
		githubButton: 'View on GitHub'
	},

	faq: {
		label: 'FAQ',
		title: "Got questions? We've got answers.",
		items: [
			{
				question: 'Do I need to be technical to use Rachel?',
				answer:
					'Not at all. If you can send a text message, you can use Rachel. Everything happens through Telegram \u2014 just type what you need in plain language. No coding, no dashboards, no training required.'
			},
			{
				question: 'What exactly can Rachel do for my business?',
				answer:
					'Rachel can build landing pages and track leads, manage your contacts and follow-ups, generate documents and presentations, schedule reminders and tasks, research suppliers or competitors, translate messages in any language, draft emails and social media posts \u2014 and much more. Think of her as a personal assistant who never sleeps.'
			},
			{
				question: 'How does the landing page and lead tracking work?',
				answer:
					'Just tell Rachel what kind of page you need \u2014 she builds it and publishes it. When someone fills in a form, Rachel captures the data and notifies you. You can ask her anytime for a summary or export the full list as an Excel or CSV file, delivered right to your Telegram.'
			},
			{
				question: 'What do I need to get started?',
				answer:
					"A Telegram account and a Claude subscription (from Anthropic). Rachel Cloud handles everything else \u2014 the server, the setup, and the monitoring. You'll be up and running in under 5 minutes."
			},
			{
				question: 'Why do I also need a Claude subscription?',
				answer:
					'Rachel is powered by Claude, one of the most advanced AI models in the world. Your Claude subscription gives Rachel her brainpower. You connect it via a simple login \u2014 no technical setup. The combined cost of Rachel Cloud + Claude pays for itself quickly when you consider the hours saved.'
			},
			{
				question: 'Is my data safe?',
				answer:
					'Yes. Rachel runs on your own private server \u2014 not shared with anyone else. Your conversations, contacts, and business data stay on your server. Rachel is also fully open source, so anyone can verify exactly what the software does. We never see or access your data.'
			},
			{
				question: 'Can I cancel anytime?',
				answer:
					'Absolutely. No contracts, no cancellation fees, no lock-in. Cancel whenever you want with one click.'
			},
			{
				question: 'What is the referral program?',
				answer:
					'Share Rachel with a friend and you both get \u20AC10 off. They save on their first month, you save on your next one. Simple as that.'
			}
		]
	},

	footer: {
		brandName: 'Rachel',
		tagline: 'Your personal AI that works for you 24/7',
		navGetStarted: 'Get Started',
		navLogin: 'Login',
		navGitHub: 'GitHub',
		copyright: 'Rachel Cloud \u00B7 Open source \u00B7 You own your data',
		referralEmoji: '\uD83C\uDF81',
		referralText: 'Give \u20AC10, Get \u20AC10',
		referralLink: 'refer a friend'
	}
};

export default en;
