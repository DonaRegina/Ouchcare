create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('customer', 'vet', 'admin');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('pending', 'paid', 'processing', 'shipped', 'cancelled');
  end if;
end
$$;

create or replace function public.is_vet_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('vet', 'admin')
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null unique,
  role public.user_role not null default 'customer',
  clinic_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists clinic_name text;

update public.profiles
set full_name = coalesce(nullif(full_name, ''), email, 'OUCHCare user')
where full_name is null or full_name = '';

alter table public.profiles
  alter column full_name set not null;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text,
  name text not null,
  description text not null,
  price_huf integer,
  hero_image_url text,
  material text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists slug text,
  add column if not exists price_huf integer,
  add column if not exists hero_image_url text,
  add column if not exists material text,
  add column if not exists is_active boolean not null default true;

update public.products
set slug = coalesce(nullif(slug, ''), regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'base_price'
  ) then
    update public.products
    set price_huf = coalesce(price_huf, round(coalesce(base_price, 0))::integer)
    where price_huf is null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'image_url'
  ) then
    update public.products
    set hero_image_url = coalesce(nullif(hero_image_url, ''), image_url, '')
    where hero_image_url is null or hero_image_url = '';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'category'
  ) then
    update public.products
    set material = coalesce(nullif(material, ''), category, 'Unknown')
    where material is null or material = '';
  end if;
end
$$;

alter table public.products
  alter column slug set not null,
  alter column price_huf set not null,
  alter column hero_image_url set not null,
  alter column material set not null;

create unique index if not exists products_slug_key on public.products (slug);
create index if not exists idx_products_is_active on public.products (is_active);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  additional_price_cents integer not null default 0,
  stock integer not null default 0,
  unique(product_id, size)
);

create index if not exists idx_product_variants_product_id on public.product_variants(product_id);

create table if not exists public.pet_measurements (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  neck_cm numeric(6,2) not null check (neck_cm > 0),
  chest_cm numeric(6,2) not null check (chest_cm > 0),
  back_length_cm numeric(6,2) not null check (back_length_cm > 0),
  leg_girth_cm numeric(6,2) not null check (leg_girth_cm > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pet_measurements_updated_at on public.pet_measurements;
create trigger set_pet_measurements_updated_at
before update on public.pet_measurements
for each row execute procedure public.set_timestamp_updated_at();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_cents integer not null check (total_cents >= 0),
  status public.order_status not null default 'pending',
  stripe_session_id text,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists total_cents integer,
  add column if not exists stripe_session_id text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'total'
  ) then
    update public.orders
    set total_cents = coalesce(total_cents, round(coalesce(total, 0))::integer)
    where total_cents is null;
  end if;
end
$$;

alter table public.orders
  alter column total_cents set not null;

create index if not exists idx_orders_user_id_created_at on public.orders(user_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_stripe_session_id on public.orders(stripe_session_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  measurements jsonb not null default '{}'::jsonb check (jsonb_typeof(measurements) = 'object')
);

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists unit_price_cents integer,
  add column if not exists measurements jsonb not null default '{}'::jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'order_items'
      and column_name = 'price'
  ) then
    update public.order_items
    set unit_price_cents = coalesce(unit_price_cents, round(coalesce(price, 0))::integer)
    where unit_price_cents is null;
  end if;
end
$$;

alter table public.order_items
  alter column unit_price_cents set not null;

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);
create index if not exists idx_order_items_variant_id on public.order_items(variant_id);

create table if not exists public.vet_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  question text not null,
  answer text not null,
  category text not null default 'General',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vet_articles_category on public.vet_articles(category);
create index if not exists idx_vet_articles_is_published_sort_order on public.vet_articles(is_published, sort_order, created_at desc);

drop trigger if exists set_vet_articles_updated_at on public.vet_articles;
create trigger set_vet_articles_updated_at
before update on public.vet_articles
for each row execute procedure public.set_timestamp_updated_at();

-- Legacy products columns may still be present and NOT NULL in existing projects.
-- Relax and backfill them so canonical inserts (price_huf/hero_image_url/material) succeed.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'base_price'
  ) then
    execute 'alter table public.products alter column base_price drop not null';
    execute 'update public.products set base_price = coalesce(base_price, price_huf::numeric) where base_price is null and price_huf is not null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'image_url'
  ) then
    execute 'alter table public.products alter column image_url drop not null';
    execute 'update public.products set image_url = coalesce(nullif(image_url, ''''), hero_image_url, '''') where image_url is null or image_url = ''''';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'category'
  ) then
    execute 'alter table public.products alter column category drop not null';
    execute 'update public.products set category = coalesce(nullif(category, ''''), material, ''General'') where category is null or category = ''''';
  end if;
end
$$;

-- Default OUCH catalog item currently sold.
insert into public.products (
  slug,
  name,
  description,
  price_huf,
  hero_image_url,
  material,
  is_active
)
values (
  'recover-suit',
  'Medical Recovery Vest for Pets',
  'Veterinarian-approved recovery vest for cats and dogs that need shoulder, upper neck, and rib coverage without a full-body suit. Designed for post-surgery recovery, allergy testing, radiotherapy support, and dermatology protection. Made from double-layer cotton with a soft inner layer and a durable outer layer to resist scratching and claws. Easy on and off to reduce stress for pets, owners, and vets.',
  300000,
  '/products/medical-recovery-vest.jpg',
  'Double-layer cotton',
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  price_huf = excluded.price_huf,
  hero_image_url = excluded.hero_image_url,
  material = excluded.material,
  is_active = excluded.is_active;

with product as (
  select id
  from public.products
  where slug = 'recover-suit'
)
insert into public.product_variants (product_id, size, additional_price_cents, stock)
select
  product.id,
  variant.size,
  variant.additional_price_cents,
  variant.stock
from product
cross join (
  values
    ('XS'::text, -40000, 50),
    ('S'::text, -30000, 50),
    ('M'::text, 0, 50),
    ('L'::text, 20000, 50),
    ('XL'::text, 35000, 50),
    ('CUSTOM'::text, 45000, 999)
) as variant(size, additional_price_cents, stock)
on conflict (product_id, size) do update
set
  additional_price_cents = excluded.additional_price_cents,
  stock = excluded.stock;

-- Legacy tables from the previous schema can remain in place. The app now reads/writes the tables above.
-- If you want a clean cutover later, you can migrate data from public.measurements -> public.pet_measurements,
-- public.vet_advice/faq -> public.vet_articles, then drop the old tables after verification.

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.pet_measurements enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.vet_articles enable row level security;

-- profiles
 drop policy if exists profiles_select on public.profiles;
 drop policy if exists profiles_insert on public.profiles;
 drop policy if exists profiles_update on public.profiles;
 drop policy if exists profiles_delete on public.profiles;

create policy profiles_select
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_vet_or_admin());

create policy profiles_insert
on public.profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_vet_or_admin());

create policy profiles_update
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_vet_or_admin())
with check (id = auth.uid() or public.is_vet_or_admin());

create policy profiles_delete
on public.profiles
for delete
to authenticated
using (public.is_vet_or_admin());

-- products
 drop policy if exists products_select on public.products;
 drop policy if exists products_insert on public.products;
 drop policy if exists products_update on public.products;
 drop policy if exists products_delete on public.products;

create policy products_select
on public.products
for select
to anon, authenticated
using (true);

create policy products_insert
on public.products
for insert
to authenticated
with check (public.is_vet_or_admin());

create policy products_update
on public.products
for update
to authenticated
using (public.is_vet_or_admin())
with check (public.is_vet_or_admin());

create policy products_delete
on public.products
for delete
to authenticated
using (public.is_vet_or_admin());

-- product_variants
 drop policy if exists product_variants_select on public.product_variants;
 drop policy if exists product_variants_insert on public.product_variants;
 drop policy if exists product_variants_update on public.product_variants;
 drop policy if exists product_variants_delete on public.product_variants;

create policy product_variants_select
on public.product_variants
for select
to anon, authenticated
using (true);

create policy product_variants_insert
on public.product_variants
for insert
to authenticated
with check (public.is_vet_or_admin());

create policy product_variants_update
on public.product_variants
for update
to authenticated
using (public.is_vet_or_admin())
with check (public.is_vet_or_admin());

create policy product_variants_delete
on public.product_variants
for delete
to authenticated
using (public.is_vet_or_admin());

-- pet_measurements
 drop policy if exists pet_measurements_select on public.pet_measurements;
 drop policy if exists pet_measurements_insert on public.pet_measurements;
 drop policy if exists pet_measurements_update on public.pet_measurements;
 drop policy if exists pet_measurements_delete on public.pet_measurements;

create policy pet_measurements_select
on public.pet_measurements
for select
to authenticated
using (user_id = auth.uid() or public.is_vet_or_admin());

create policy pet_measurements_insert
on public.pet_measurements
for insert
to authenticated
with check (user_id = auth.uid() or public.is_vet_or_admin());

create policy pet_measurements_update
on public.pet_measurements
for update
to authenticated
using (user_id = auth.uid() or public.is_vet_or_admin())
with check (user_id = auth.uid() or public.is_vet_or_admin());

create policy pet_measurements_delete
on public.pet_measurements
for delete
to authenticated
using (user_id = auth.uid() or public.is_vet_or_admin());

-- orders
 drop policy if exists orders_select on public.orders;
 drop policy if exists orders_insert on public.orders;
 drop policy if exists orders_update on public.orders;
 drop policy if exists orders_delete on public.orders;

create policy orders_select
on public.orders
for select
to authenticated
using (user_id = auth.uid() or public.is_vet_or_admin());

create policy orders_insert
on public.orders
for insert
to authenticated
with check (user_id = auth.uid() or public.is_vet_or_admin());

create policy orders_update
on public.orders
for update
to authenticated
using (user_id = auth.uid() or public.is_vet_or_admin())
with check (user_id = auth.uid() or public.is_vet_or_admin());

create policy orders_delete
on public.orders
for delete
to authenticated
using (user_id = auth.uid() or public.is_vet_or_admin());

-- order_items
 drop policy if exists order_items_select on public.order_items;
 drop policy if exists order_items_insert on public.order_items;
 drop policy if exists order_items_update on public.order_items;
 drop policy if exists order_items_delete on public.order_items;

create policy order_items_select
on public.order_items
for select
to authenticated
using (
  public.is_vet_or_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

create policy order_items_insert
on public.order_items
for insert
to authenticated
with check (
  public.is_vet_or_admin()
  or (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
    and (
      variant_id is null
      or exists (
        select 1
        from public.product_variants pv
        where pv.id = order_items.variant_id
      )
    )
  )
);

create policy order_items_update
on public.order_items
for update
to authenticated
using (
  public.is_vet_or_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
)
with check (
  public.is_vet_or_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

create policy order_items_delete
on public.order_items
for delete
to authenticated
using (
  public.is_vet_or_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

-- vet_articles
 drop policy if exists vet_articles_select on public.vet_articles;
 drop policy if exists vet_articles_insert on public.vet_articles;
 drop policy if exists vet_articles_update on public.vet_articles;
 drop policy if exists vet_articles_delete on public.vet_articles;

create policy vet_articles_select
on public.vet_articles
for select
to anon, authenticated
using (is_published = true or public.is_vet_or_admin());

create policy vet_articles_insert
on public.vet_articles
for insert
to authenticated
with check (public.is_vet_or_admin());

create policy vet_articles_update
on public.vet_articles
for update
to authenticated
using (public.is_vet_or_admin())
with check (public.is_vet_or_admin());

create policy vet_articles_delete
on public.vet_articles
for delete
to authenticated
using (public.is_vet_or_admin());
