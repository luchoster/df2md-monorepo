-- Customer accounts: profiles, dogs and orders.
-- Customers read and edit their own profile and dogs. Orders are written only by the server
-- (Stripe webhook, using the secret key) and customers can read their own.

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text default 'NV',
  postal_code text,
  delivery_notes text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Customers read their profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "Customers update their profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Customers may edit these columns only; stripe_customer_id and the timestamps are server-set.
-- (A column-level revoke would not override Supabase's default table-wide grant.)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (
  first_name, last_name, phone, address_line1, address_line2, city, state, postal_code,
  delivery_notes
) on public.profiles to authenticated;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- A profile row for every new sign-up, seeded from the sign-up form's metadata
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- pets
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 80),
  breed text check (char_length(breed) <= 80),
  birth_date date,
  created_at timestamptz not null default now()
);

create index pets_user_id_idx on public.pets (user_id);
alter table public.pets enable row level security;

create policy "Customers manage their dogs" on public.pets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 10001) unique,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  customer_name text,
  phone text,
  status text not null default 'paid'
    check (status in ('paid', 'out_for_delivery', 'delivered', 'ready_for_pickup', 'picked_up', 'cancelled', 'refunded')),
  kind text not null default 'order' check (kind in ('order', 'autoship_renewal')),
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  delivery_date date,
  requested_time text,
  address text,
  notes text,
  autoship_schedule text,
  subtotal integer not null,
  discount integer not null default 0,
  tax integer not null default 0,
  total integer not null,
  currency text not null default 'usd',
  stripe_checkout_session_id text unique,
  stripe_invoice_id text unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_email_idx on public.orders (lower(email));
alter table public.orders enable row level security;

-- Own orders, including guest orders placed with the same (confirmed) email before signing up
create policy "Customers read their orders" on public.orders
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(email) = lower((select auth.jwt() ->> 'email'))
  );

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text,
  variant_key text,
  title text not null,
  option text,
  unit_amount integer not null,
  quantity integer not null check (quantity > 0),
  autoship boolean not null default false
);

create index order_items_order_id_idx on public.order_items (order_id);
alter table public.order_items enable row level security;

-- Orders are written by the server (secret key) only
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;

create policy "Customers read their order items" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
