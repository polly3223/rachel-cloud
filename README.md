# Rachel Cloud

Managed hosting platform for Rachel — personal AI assistants on Telegram.

## TODO: Go-Live Checklist

- [ ] Set `SESSION_SECRET` env var (generate a random 64-char hex string)
- [ ] Set `ADMIN_TELEGRAM_ID` env var (Lorenzo's Telegram user ID)
- [ ] Set `TELEGRAM_BOT_TOKEN` env var (shared Rachel bot token from BotFather)
- [ ] Register webhook with Telegram: `POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://get-rachel.com/api/telegram/webhook`
- [ ] Switch `POLAR_MODE` from `sandbox` to `production`
- [ ] End-to-end test: message bot → /start → subscribe → container provisioned → chat works
- [ ] Set up Resend API key for transactional email (optional)
