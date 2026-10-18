# Launch checklist: Snipcart → new site

What's left before customers move from the old shop (Snipcart, billing through the live Stripe
account) to the new site. Setup details for accounts are in [ACCOUNTS.md](ACCOUNTS.md).

Status as of Oct 18, 2026: all customers, orders and Autoships are imported into Supabase, live
Stripe customer ids are on the profiles, and the site still runs on **sandbox** Stripe keys.
Snipcart is still live and still billing Autoships.

## 1. Before launch day

- [ ] **Sign-in emails.** Supabase → Authentication → Emails → Magic Link: the template must
      include `{{ .Token }}` (the sign-in code). Template text is in ACCOUNTS.md §2.
- [ ] **SMTP.** Supabase → Authentication → Emails → SMTP: use Resend (`RESEND_API_KEY`). The
      built-in mailer only sends a couple of emails an hour.
- [ ] **Code sign-in test.** On df2md.zera.us: `/login?method=code` with a real inbox → code
      arrives → sign in → (imported account) "Choose your password" → account pages.
- [ ] **Sandbox purchase test.** Sandbox webhook to `https://df2md.zera.us/api/stripe/webhook`
      (API version `2026-08-26.dahlia`; events `checkout.session.completed`,
      `checkout.session.async_payment_succeeded`, `invoice.paid`), its secret in Vercel as
      `STRIPE_WEBHOOK_SECRET`. Buy with `4242 4242 4242 4242` → the order shows under Orders.
- [ ] **Confirm who charges Snipcart's renewals** (see §5): give the read-only key
      `STRIPE_READ_KEY` the **Events: Read** permission, then check the `invoice.finalized`
      events. If Snipcart's servers charge them, build the `invoice.created` handler (§5) first.
- [ ] **Ask Snipcart support** the questions in §5 and note the answers here.
- [ ] **Customer announcement** written: new site, sign in with an emailed code
      (`https://<domain>/login?method=code`), choose a password, Autoships carry over.
- [ ] **Remove the sandbox test Autoships** on luchoster@gmail.com (two Snipcart-style test
      subscriptions, and their `legacy_subscriptions` rows with `snipcart_id` `sandbox-test-*`).

## 2. Launch day, in this order

Run the scripts from `scripts/import` with the repo-root `.env`. Nothing here emails anyone.

1. **Freeze the old shop.** Stop new Snipcart orders (maintenance message / disable checkout)
   but leave Snipcart connected to Stripe until step 7.
2. **Final export and import.**
   ```bash
   bun run snipcart:export                        # → ~/Sites/dogfood/backups/snipcart
   bun run customers                              # dry run: check the counts
   bun run customers --apply --link-stripe        # new orders, refreshed statuses, live ids
   ```
3. **Live Stripe webhook.** Stripe (live) → Developers → Webhooks → add endpoint
   `https://<domain>/api/stripe/webhook`, API version `2026-08-26.dahlia`, the 3 events above
   (plus `invoice.created` if §5 says so). Copy its signing secret.
4. **Switch Vercel to live keys** (Production): `STRIPE_SECRET_KEY` (live `sk_live_…`),
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live `pk_live_…`), `STRIPE_WEBHOOK_SECRET` (step 3).
   Redeploy.
5. **Supabase URLs.** Authentication → URL Configuration: Site URL = the real domain, redirect
   URLs include `https://<domain>/**`.
6. **Smoke test with a real account** (yours): sign in, Orders shows history, Autoship shows the
   live subscriptions (no "set up on our previous website" duplicates), a small real purchase
   goes through and lands under Orders (refund it afterwards).
7. **Turn off Snipcart** as agreed with Snipcart support (§5), so it stops acting on renewals and
   stops emailing customers.
8. **Convert Snipcart's pauses** (103 Autoships paused with a 100%-off coupon) to Stripe pauses:
   ```bash
   bun run autoship:pause                                         # dry run (read-only key)
   bun run autoship:pause --key STRIPE_SECRET_KEY --apply         # with the LIVE secret key
   ```
   Only after step 7: while Snipcart runs, a customer resuming there would stay paused here.
9. **DNS** to Vercel, if the domain isn't pointed there yet.
10. **Send the announcement.**

## 3. First days after launch

- [ ] Every Autoship renewal produces an order on the new site (Supabase `orders` with
      `kind = 'autoship_renewal'`) and a paid invoice in Stripe. Check daily for a week.
- [ ] No renewal invoices stuck in **draft** in Stripe (Invoices → Draft). Stuck drafts mean
      nobody is finalizing them (§5).
- [ ] Payment problems: 8 Autoships were already `past_due` at import, and 36 old renewal
      invoices are still open from Snipcart's time. Decide whether to chase or void them.
- [ ] Customers who can't get in: they use "Email me a sign-in code"; there's no password to
      reset until they choose one.

## 4. If something goes wrong

- Site problem: switch Vercel back to the sandbox keys and turn Snipcart's checkout back on.
  Nothing in Stripe was changed except the pause conversion (step 8).
- Undo a pause conversion for one subscription: Stripe → subscription → Resume, or re-pause it
  from the customer's Autoship page.

## 5. Snipcart and Stripe: what happens at the switch

Researched Oct 18, 2026 from the live data (read-only key) and the Stripe/Snipcart docs.

**How Snipcart bills today.** All 144 Autoships are real Stripe subscriptions on the store's own
Stripe account, created through Snipcart's Stripe Connect app (`application:
ca_1KNMZBmM0lzZtdKcTPz1VqSqV2mW3l1c`, no application fee). Each renewal invoice is created by
Stripe with `auto_advance: false`, and is finalized and charged 60–72 minutes later. Invoices
with `auto_advance: false` never advance on their own, which strongly suggests Snipcart's servers
finalize and charge each renewal. Snipcart "pauses" by adding a 100%-off forever coupon, and its
failed payments are left open (36 open renewal invoices, no retries).

**What Stripe says about disconnecting a platform.** Subscriptions are **not** cancelled when an
account disconnects a platform, and Stripe recommends agreeing on subscription migration with the
platform before disconnecting.

**The risk.** Once Snipcart is off (or disconnected), nobody may finalize renewal invoices: they
would sit in draft and the active Autoships would silently stop charging and stop producing
orders. Our webhook only reacts to `invoice.paid`, so it wouldn't notice.

**To confirm** (Events: Read on `STRIPE_READ_KEY`): `invoice.finalized` events for
`subscription_cycle` invoices with a `request.id` were finalized by an API call (Snipcart);
without one, Stripe did it automatically.

**Fix if confirmed:** handle `invoice.created` in our webhook: for a draft renewal of a
subscription with `metadata.snipcart_subscription_id` and `auto_advance: false`, set
`auto_advance: true` so Stripe finalizes and charges it after its usual hour. Add
`invoice.created` to the live webhook's events. It can't double-charge (one invoice per cycle).
Alternative: recreate the 41 active Autoships as our own subscriptions (same card, price,
schedule, `billing_cycle_anchor` at their next date) and cancel Snipcart's.

**Questions for Snipcart support:**
1. When we deactivate the store / cancel the plan, does Snipcart cancel, pause or leave the
   Stripe subscriptions it created? Does it keep finalizing renewal invoices?
2. Does it send customers any email when it stops (cancellation notices)? We don't want any.
3. Can we disconnect the Stripe gateway ourselves, or does support have to do it?
4. How long is our data (orders, customers, subscriptions) kept, and can we still export it?
