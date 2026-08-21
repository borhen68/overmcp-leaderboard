# OverMCP

The internet's live product leaderboard. Products make one-time bids for public
placement; rankings, paid-bid activity, visitors, and outbound clicks all come
from the production database. There is no seeded or fabricated leaderboard data.

## Stack

- Next.js 16 and React 19
- Turso/libSQL with Drizzle ORM
- Stripe Checkout with signed, idempotent webhooks
- Vercel-ready server rendering

## Local setup

1. Copy `.env.example` to `.env.local` and add Turso and Stripe test credentials.
2. Create the database tables.
3. Start the app.

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

For local Stripe webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the emitted `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

## Production

Set every variable from `.env.example` in the hosting environment, set
`NEXT_PUBLIC_APP_URL=https://overmcp.com`, run `npm run db:migrate` against the
production Turso database, and register this Stripe endpoint:

`https://overmcp.com/api/stripe/webhook`

Subscribe it to `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`,
`charge.refunded`, `charge.dispute.created`, and `charge.dispute.closed`.

The restricted Stripe key must have write access to Checkout Sessions and read
access to retrieve them. The webhook endpoint must be allowed to receive the
events listed above.
