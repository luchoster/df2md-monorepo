# Customer accounts: setup

Accounts use **Supabase Auth** (email + password). Profiles, dogs and the order history live in
Supabase. **Autoship subscriptions and saved cards stay in Stripe**, which remains the source of
truth; the account pages read and change them through the Stripe API.

Until `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set, the account
pages say "coming soon" and checkout works as guest-only.

## 1. Supabase project

1. Create a project (region close to Las Vegas, e.g. `us-west-1`).
2. **SQL editor** → run `supabase/migrations/20260929000000_accounts.sql`
   (or `supabase db push` with the Supabase CLI).
3. **Project Settings → API Keys**: copy the URL, the publishable key and a secret key into the
   environment (see `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (server only: the Stripe webhook uses it to save orders)

## 2. Auth settings

**Authentication → URL Configuration**
- Site URL: `https://dogfood2mydoor.com` (or the preview URL while testing)
- Redirect URLs: `https://dogfood2mydoor.com/auth/confirm`, `http://localhost:3000/auth/confirm`,
  and the preview domain's `/auth/confirm`

**Authentication → Sign In / Providers → Email**
- Keep **Confirm email** on. Guest orders show up in an account by matching the confirmed email.
- Minimum password length: 8

**Authentication → Emails → Templates**: so the links also work when they're opened on another
device, point them at `/auth/confirm` with a token hash. `{{ .RedirectTo }}` already carries the
page to return to (`?next=…`):
- Confirm signup: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Confirm your email</a>`
- Reset password: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a>`

**Authentication → Emails → SMTP**: the built-in sender only allows a few emails an hour.
Before launch, connect a real sender (Resend works: `smtp.resend.com`, port 465, user `resend`,
password = a Resend API key, from `orders@dogfood2mydoor.com` on a verified domain).

## 3. Stripe

- **Webhook** → `https://<site>/api/stripe/webhook`, events:
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`.
  Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
  Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
- **Settings → Billing → Customer portal**: save the configuration once (test and live mode). "Payment
  methods" in the account opens this portal. Allow updating payment methods; leave subscription
  cancel/update off there (the account's Autoship page handles those).

## How it fits together

| Where | What |
|---|---|
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth screens (shadcnblocks Login 2 / Signup 4 / Forgot + Reset Password 1) |
| `/auth/confirm` | Email link landing: confirms sign-up or password reset, then continues to `next` |
| `/account` | Profile and default delivery address (prefills checkout) |
| `/account/orders`, `/account/orders/[number]` | Order history (Order History 3) and order detail (Order Summary 1) |
| `/account/autoship` | Autoship list from Stripe: change frequency, quantities and next order date; pause, resume, cancel |
| `/account/dogs` | The customer's dogs |
| Payment methods | Stripe customer portal |
| `proxy.ts` | Refreshes the auth cookie on account pages and checkout only (catalog pages stay static) |

- **Orders** are written by the Stripe webhook: one row per paid checkout, plus one per Autoship
  renewal (`invoice.paid`, `billing_reason = subscription_cycle`). Renewal delivery dates follow
  the delivery rules in Site settings on the day the renewal is charged.
- **Signed-in checkout** uses the account's Stripe customer (created on first checkout) and tags the
  session with `user_id`. Guests are matched to an existing Stripe customer by email, as before.
- **Linking guests**: a customer who checked out as a guest and signs up later with the same
  (confirmed) email sees those orders, and their Stripe customer (Autoship, saved cards) is linked
  on first visit.
- **Changing an Autoship's frequency or next date** sets the subscription's `trial_end` to the chosen
  date with no proration, so nobody is charged early; the new schedule starts from that date.
- **Pausing** uses Stripe's `pause_collection` (`void`): renewals are skipped and no order is
  created until the customer resumes.
- Row-level security: customers read and edit only their own profile and dogs, and only read their
  own orders. Orders are written with the secret key only.
