-- Customers, orders and Autoships brought over from the old shop (Snipcart, billing through the
-- live Stripe account). Written by scripts/import (secret key) only.

-- ---------------------------------------------------------------- orders from Snipcart
alter table public.orders
  add column source text not null default 'site' check (source in ('site', 'snipcart')),
  add column legacy_id text unique,      -- Snipcart order token
  add column legacy_number text,         -- Snipcart invoice number, e.g. DF-8361 (shown instead of `number`)
  add column refunded integer not null default 0;

-- ---------------------------------------------------------------- legacy_customers
-- The customer's Snipcart record and their LIVE-mode Stripe customer. Kept apart from
-- profiles.stripe_customer_id while the site runs on test keys; copied over at cutover.
create table public.legacy_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  snipcart_customer_id text not null unique,
  snipcart_status text,
  snipcart_created_at timestamptz,
  stripe_customer_id text,
  cards jsonb not null default '[]',     -- [{brand, last4, exp_month, exp_year}] from Stripe
  imported_at timestamptz not null default now()
);

alter table public.legacy_customers enable row level security;
revoke all on public.legacy_customers from anon, authenticated;

-- ---------------------------------------------------------------- legacy_subscriptions
-- Snapshot of each Snipcart Autoship (a live Stripe subscription). Read-only for customers.
create table public.legacy_subscriptions (
  id text primary key,                   -- live Stripe subscription id
  snipcart_id text not null unique,
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  status text not null check (status in ('active', 'paused', 'past_due', 'cancelled')),
  title text not null,
  option text,
  product_id text,                       -- Sanity product _id
  quantity integer not null default 1,
  unit_amount integer not null,          -- cents, before tax
  interval text not null check (interval in ('day', 'week', 'month', 'year')),
  interval_count integer not null default 1,
  next_billing_date date,
  card jsonb,                            -- {brand, last4, exp_month, exp_year}
  started_at timestamptz,
  paused_at timestamptz,
  imported_at timestamptz not null default now()
);

create index legacy_subscriptions_user_id_idx on public.legacy_subscriptions (user_id);
alter table public.legacy_subscriptions enable row level security;
revoke insert, update, delete on public.legacy_subscriptions from anon, authenticated;

create policy "Customers read their old Autoships" on public.legacy_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
