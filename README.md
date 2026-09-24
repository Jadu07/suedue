# suedue

Modern, zero-latency shared expense ledger with automated WhatsApp dispatch and FamPay UPI instant verification.

## Features
- **Bills & Splits:** Split bills by item, share, or percentage with dynamic dues calculation.
- **Instant UPI Verification:** Native IMAP IDLE engine listening to Google push notifications for FamPay receipts with sub-second verification.
- **WhatsApp Integration:** Automated reminder and claim link dispatching via OpenWA.
- **Split deployment:** Next.js on Vercel and the long-lived Python Gmail verifier on Render.

## Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Vercel plus Render deployment runbook.
