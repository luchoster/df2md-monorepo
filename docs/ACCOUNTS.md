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

**Authentication → Emails → Templates**: paste each file from `supabase/templates/` into the
matching template (same look as the order emails: green header, white card, store details).

| Template | File | Subject |
|---|---|---|
| Magic Link | `magic-link.html` | `Your Dog Food 2 My Door sign-in code` |
| Confirm signup | `confirm-signup.html` | `Confirm your email for Dog Food 2 My Door` |
| Reset Password | `reset-password.html` | `Reset your Dog Food 2 My Door password` |
| Invite user | `invite.html` | `You're invited to Dog Food 2 My Door` |
| Change Email Address | `change-email.html` | `Confirm your new Dog Food 2 My Door email` |
| Reauthentication | `reauthentication.html` | `Your Dog Food 2 My Door confirmation code` |

- The links go to `/auth/confirm` with a token hash, so they also work when opened on another
  device. In the sign-in code and sign-up emails, `{{ .RedirectTo }}` carries the page to return
  to (`?next=…`), so those only work when the site sends them. Password resets, invites and email
  changes link straight to `https://dogfood2mydoor.com/auth/confirm`, so they also work when
  sent from the Supabase dashboard (Authentication → Users → Send password recovery).
- Magic Link is the emailed sign-in code and must keep `{{ .Token }}`. Codes are 8 digits
  (Providers → Email → Email OTP length); `LOGIN_CODE_LENGTH` in
  `apps/web/lib/account/login-code.ts` must match.
- The logo and fonts load from `https://dogfood2mydoor.com`.

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
