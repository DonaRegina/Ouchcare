begin;

alter table public.products
  add column if not exists price_huf integer;

-- Prices are already stored in HUF; no conversion is needed.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'base_price_huf'
  ) then
    execute 'update public.products set price_huf = base_price_huf where price_huf is null and base_price_huf is not null';
  end if;
end
$$;

alter table public.products
  alter column price_huf set not null;

alter table public.products
  drop column if exists base_price_huf;

commit;
