# TechPoint UAE (prototype)

Catalogue site that mirrors a supplier's stock/prices automatically, adds your markup, and routes
every customer to you via WhatsApp / email / call / quote form.

## Run

```bash
npm install
npm run dev -- -p 3100        # website  -> http://localhost:3100  (admin: /admin)
npm run sync                  # one sync now
npm run sync:loop             # sync forever, every SYNC_EVERY_HOURS (default 3)
```

Edit `.env.local` (add `SUPABASE_SERVICE_ROLE_KEY` = the secret key from Supabase > Project Settings > API Keys): WhatsApp number, phone, email, `ADMIN_PASSWORD`.
Optional instant email alerts: add `RESEND_API_KEY`, `NOTIFY_EMAIL` (and `NOTIFY_FROM`).

Sync options: `--groups graphic_cards,laptops,networking-devices --pages 3 --max 0 --delay 1500`
(env equivalents: `SYNC_GROUPS`, `SYNC_PAGES`, `SYNC_MAX`, `SYNC_DELAY_MS`, `SYNC_EVERY_HOURS`).

## How it works

- `sources/microless.mjs` - the ONLY supplier-specific file (reads public pages' schema.org data:
  name, SKU, price, stock). Replace it with an official distributor feed/API and nothing else changes.
- `scripts/sync.mjs` - upserts products, records price/stock history, marks unlisted items out of stock.
- `lib/pricing.js` - sell price = supplier x (1 + markup), rounded up. Priority: product override >
  category markup > default markup (all editable in `/admin`).
- Out-of-stock products stay visible as "Available on request"; enquiries still work.
- `/api/enquiry` stores every form submission and WhatsApp click in the DB (and emails you if configured).
- Data lives in Supabase (project `it-quote-store`). All access is server-side with the service-role key; RLS is on with no public policies, so supplier cost can never be read with the public key.

## Before going live

1. Get permission or an official feed from the supplier - this prototype reads a retailer's public pages.
2. Replace hotlinked supplier images with your own/licensed ones and write your own descriptions.
3. Host the sync on an always-on machine or a scheduled job (GitHub Actions cron running `npm run sync`).
4. Set real contact details and a strong `ADMIN_PASSWORD`.
