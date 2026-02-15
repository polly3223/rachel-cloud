import type { Translations } from '../index';

const it: Translations = {
	hero: {
		badge: 'La tua assistente AI personale, attiva 24 ore su 24',
		h1Line1: 'Gestisci il tuo business',
		h1Line2: 'come un supereroe',
		subtitle:
			'Rachel \u00E8 un\'assistente AI su Telegram che crea landing page, traccia i tuoi contatti, gestisce la rubrica, programma promemoria, genera documenti e fa ricerche \u2014 cos\u00EC tu puoi concentrarti su ci\u00F2 che conta: chiudere i deal.',
		cta1: 'Inizia a $20/mese',
		cta2: 'Scopri come funziona',
		subtext: 'Open source \u00B7 I tuoi dati restano tuoi \u00B7 Disdici quando vuoi'
	},

	howItWorks: {
		label: 'Come funziona',
		title: 'Pronta in pochi minuti. Zero competenze tecniche.',
		step1: {
			title: 'Registrati in 60 secondi',
			description:
				'Crea il tuo account, scegli il piano e collega il tuo abbonamento Claude. Fine \u2014 niente da scaricare, niente da installare.'
		},
		step2: {
			title: 'Collega Telegram',
			description:
				'Segui la nostra guida semplicissima per collegare Telegram. Ti accompagniamo passo dopo passo \u2014 ci vogliono circa 2 minuti.'
		},
		step3: {
			title: 'Inizia a dare ordini',
			description:
				'Apri Telegram e di\u2019 a Rachel cosa ti serve. Crea una landing page, trova contatti, imposta promemoria \u2014 \u00E8 pronta a lavorare per te.'
		}
	},

	features: {
		label: 'Cosa pu\u00F2 fare Rachel per te',
		title: 'Come assumere un\'assistente a tempo pieno per $20/mese',
		subtitle:
			'Rachel si occupa del lavoro che ti ruba la giornata, cos\u00EC puoi dedicare il tuo tempo a ci\u00F2 che conta davvero.',
		feature1: {
			title: 'Crea landing page e raccogli contatti',
			description:
				'Di\u2019 a Rachel di creare una pagina web per la tua offerta. La costruisce, traccia chi compila i form e ti manda i contatti come Excel o CSV direttamente su Telegram.'
		},
		feature2: {
			title: 'Gestisci contatti e follow-up',
			description:
				'Chiedi "con chi ho parlato la settimana scorsa?" e Rachel te lo dice. Ricorda ogni conversazione, ogni contatto, ogni dettaglio \u2014 cos\u00EC non ti sfugge nulla.'
		},
		feature3: {
			title: 'Documenti, presentazioni e report',
			description:
				'Ti serve un preventivo? Un report? Una presentazione? Descrivile e Rachel le genera al volo. Pronte da inviare.'
		},
		feature4: {
			title: 'Promemoria e gestione attivit\u00E0',
			description:
				'"Ricordami di chiamare Marco luned\u00EC alle 9." Fatto. Rachel tiene sotto controllo attivit\u00E0, scadenze e follow-up mentre tu dormi.'
		},
		feature5: {
			title: 'Ricerche istantanee su qualsiasi cosa',
			description:
				'"Trovami i migliori fornitori di packaging nel Nord Italia." Rachel cerca, confronta e ti d\u00E0 un riepilogo \u2014 in minuti, non in ore.'
		},
		feature6: {
			title: 'Traduzioni, email e social media',
			description:
				'Traduci messaggi istantaneamente in qualsiasi lingua. Scrivi email, crea post per i social, genera contenuti \u2014 tutto da un semplice messaggio su Telegram.'
		}
	},

	telegramDemo: {
		label: 'Guardala in azione',
		title: 'Apri Telegram e chiedi',
		subtitle:
			'Ecco come si gestisce un business con Rachel. Nessuna app da imparare. Nessuna dashboard. Solo una chat.',
		online: 'online',
		inputPlaceholder: 'Messaggio',
		messages: {
			user1: 'Quante persone si sono iscritte sulla mia landing page oggi?',
			rachel1:
				'Oggi hai ricevuto 7 nuove iscrizioni! Ecco il riepilogo:\n\n1. Marco Rossi \u2014 marco@rossi.it\n2. Elena Bianchi \u2014 elena.b@gmail.com\n3. Fabio Conti \u2014 fabio@contigroup.com\n4. Sara De Luca \u2014 sara.deluca@outlook.com\n5. Luca Moretti \u2014 luca.m@hotmail.it\n6. Anna Ferrari \u2014 a.ferrari@yahoo.com\n7. Giulia Greco \u2014 giulia@greco.biz\n\nVuoi che ti mandi la lista completa come file Excel?',
			user2:
				'S\u00EC, mandami l\'Excel. E ricordami di chiamare Marco Rossi domani alle 9 \u2014 sembra un contatto caldo.',
			rachel2:
				'Fatto! Ecco il tuo file: iscrizioni_2026-02-14.xlsx\n\nPromemoria impostato: Chiamare Marco Rossi \u2014 domani (sabato) alle 9:00.\n\nTra l\'altro, Marco ha visitato la tua pagina 3 volte prima di iscriversi. Sicuramente interessato.',
			user3:
				'Scrivi un\'email di follow-up per tutte e 7 le iscrizioni. Professionale ma amichevole, menziona la nostra consulenza gratuita.',
			rachel3:
				'Ecco la tua bozza:\n\nOggetto: Grazie per il tuo interesse \u2014 parliamone!\n\nCiao [Nome],\n\nGrazie per esserti iscritto! Mi farebbe piacere offrirti una consulenza gratuita di 15 minuti per capire come possiamo aiutare il tuo business.\n\nRispondi a questa email con un orario che ti va bene, oppure scegli uno slot qui: [link al tuo calendario]\n\nA presto!\n\nVuoi che modifichi il tono o aggiunga qualcosa?'
		}
	},

	pricing: {
		label: 'Prezzo',
		title: 'Meno di un caff\u00E8 al giorno. Si ripaga nella prima settimana.',
		subtitle:
			'Pensa a quante ore spendi in amministrazione, ricerche e follow-up. Rachel ti restituisce quelle ore.',
		planBadge: 'Tutto incluso',
		planName: 'Rachel Cloud',
		price: '$20',
		priceUnit: '/mese',
		features: [
			'La tua assistente AI su Telegram \u2014 disponibile 24/7',
			'Crea landing page, traccia contatti, esporta dati',
			'Gestione contatti, promemoria e pianificazione',
			'Documenti, ricerche, traduzioni \u2014 su richiesta',
			'Server privato dedicato \u2014 i tuoi dati restano tuoi',
			'Monitoraggio 24/7 con ripristino automatico',
			'Disdici quando vuoi \u2014 nessun vincolo, nessun trucco'
		],
		cta: 'Inizia ora \u2014 $20/mese',
		subtext:
			'+ il tuo abbonamento Claude (separato) \u00B7 Insieme si ripagano in ore risparmiate',
	},

	openSource: {
		label: 'Trasparente e affidabile',
		title: 'Open source. Tutto tuo.',
		paragraph1:
			'Il codice di Rachel \u00E8 100% open source. I tuoi dati vivono sul tuo server privato \u2014 non li vediamo, non li vendiamo, non li tocchiamo.',
		paragraph2:
			'Vuoi installarlo da solo? Fai pure \u2014 \u00E8 gratis. Vuoi che ci pensiamo noi a tutto? Ecco Rachel Cloud a $20/mese.',
		starButton: 'Star',
		githubButton: 'Vedi su GitHub'
	},

	faq: {
		label: 'FAQ',
		title: 'Hai domande? Abbiamo le risposte.',
		items: [
			{
				question: 'Devo essere esperto di tecnologia per usare Rachel?',
				answer:
					'Assolutamente no. Se sai mandare un messaggio, sai usare Rachel. Tutto avviene su Telegram \u2014 scrivi quello che ti serve in linguaggio normale. Niente codice, niente dashboard, niente corsi da seguire.'
			},
			{
				question: 'Cosa pu\u00F2 fare Rachel per il mio business?',
				answer:
					'Rachel pu\u00F2 creare landing page e tracciare contatti, gestire la tua rubrica e i follow-up, generare documenti e presentazioni, programmare promemoria e attivit\u00E0, cercare fornitori o concorrenti, tradurre messaggi in qualsiasi lingua, scrivere email e post per i social \u2014 e molto altro. Pensala come un\'assistente personale che non dorme mai.'
			},
			{
				question: 'Come funzionano le landing page e il tracciamento contatti?',
				answer:
					'Basta dire a Rachel che tipo di pagina ti serve \u2014 la costruisce e la pubblica. Quando qualcuno compila un form, Rachel salva i dati e ti avvisa. Puoi chiederle in qualsiasi momento un riepilogo o esportare la lista completa come Excel o CSV, consegnata direttamente su Telegram.'
			},
			{
				question: 'Cosa mi serve per iniziare?',
				answer:
					'Un account Telegram e un abbonamento Claude (di Anthropic). Rachel Cloud si occupa di tutto il resto \u2014 il server, la configurazione e il monitoraggio. Sarai operativo in meno di 5 minuti.'
			},
			{
				question: 'Perch\u00E9 ho bisogno anche di un abbonamento Claude?',
				answer:
					'Rachel \u00E8 alimentata da Claude, uno dei modelli AI pi\u00F9 avanzati al mondo. Il tuo abbonamento Claude d\u00E0 a Rachel la sua intelligenza. Lo colleghi con un semplice login \u2014 nessuna configurazione tecnica. Il costo combinato di Rachel Cloud + Claude si ripaga velocemente se pensi alle ore risparmiate.'
			},
			{
				question: 'I miei dati sono al sicuro?',
				answer:
					'S\u00EC. Rachel funziona sul tuo server privato \u2014 non condiviso con nessun altro. Le tue conversazioni, i tuoi contatti e i dati del tuo business restano sul tuo server. Rachel \u00E8 anche completamente open source, quindi chiunque pu\u00F2 verificare esattamente cosa fa il software. Non vediamo e non accediamo mai ai tuoi dati.'
			},
			{
				question: 'Posso disdire quando voglio?',
				answer:
					'Certo. Nessun contratto, nessuna penale, nessun vincolo. Disdici quando vuoi con un click.'
			},
		]
	},

	footer: {
		brandName: 'Rachel',
		tagline: 'La tua assistente AI personale, attiva 24 ore su 24',
		navGetStarted: 'Inizia ora',
		navLogin: 'Accedi',
		navGitHub: 'GitHub',
		copyright: 'Rachel Cloud \u00B7 Open source \u00B7 I tuoi dati restano tuoi'
	}
};

export default it;
