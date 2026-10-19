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
   `https://<domain>/api/stripe/webhook`, API version `2026-08-26.dahlia`, the 3 events above.
   Copy its signing secret.
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
- [ ] No renewal invoices stuck in **draft** in Stripe (Invoices → Draft) for more than ~2 hours.
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
ca_1KNMZBmM0lzZtdKcTPz1VqSqV2mW3l1c`, no application fee). Snipcart "pauses" by adding a 100%-off
forever coupon, and its failed payments are left open (36 open renewal invoices, no retries).

**Who charges the renewals: Stripe.** Checked Oct 19, 2026 on live drafts: a renewal invoice is
created with `auto_advance: true` and Stripe schedules its own charge an hour later
(`next_payment_attempt`); Stripe turns `auto_advance` off once the invoice is paid. So renewals
keep charging after Snipcart is turned off, and no webhook change is needed.

**What Stripe says about disconnecting a platform.** Subscriptions are **not** cancelled when an
account disconnects a platform. The open question is only what Snipcart itself does on the way out
(cancel subscriptions? email customers?), hence the questions below.

**Questions for Snipcart support:**
1. When we deactivate the store / cancel the plan, does Snipcart cancel, pause or leave the
   Stripe subscriptions it created? Does it keep finalizing renewal invoices?
2. Does it send customers any email when it stops (cancellation notices)? We don't want any.
3. Can we disconnect the Stripe gateway ourselves, or does support have to do it?
4. How long is our data (orders, customers, subscriptions) kept, and can we still export it?
