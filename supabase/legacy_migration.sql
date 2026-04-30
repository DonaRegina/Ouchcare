begin;

-- Copy legacy measurements into the canonical table.
do $$
begin
  if exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = 'measurements'
  ) then
    insert into public.pet_measurements (
      user_id,
      neck_cm,
      chest_cm,
      back_length_cm,
      leg_girth_cm,
      created_at,
      updated_at
    )
    select
      m.user_id,
      m.neck,
      m.chest,
      m.back_length,
      m.leg_girth,
      coalesce(m.created_at, now()),
      coalesce(m.created_at, now())
    from public.measurements m
    on conflict (user_id) do update
    set
      neck_cm = excluded.neck_cm,
      chest_cm = excluded.chest_cm,
      back_length_cm = excluded.back_length_cm,
      leg_girth_cm = excluded.leg_girth_cm,
      updated_at = excluded.updated_at;
  end if;
end
$$;

-- Copy legacy vet advice into the canonical article table.
do $$
begin
  if exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = 'vet_advice'
  ) then
    insert into public.vet_articles (
      slug,
      question,
      answer,
      category,
      sort_order,
      is_published,
      created_at,
      updated_at
    )
    select
      'advice-' || regexp_replace(lower(coalesce(va.title, 'vet-advice')), '[^a-z0-9]+', '-', 'g') as slug,
      va.title,
      va.content,
      coalesce(nullif(va.category, ''), 'General'),
      row_number() over (order by va.category nulls last, va.title) - 1,
      true,
      now(),
      now()
    from public.vet_advice va
    on conflict (slug) do update
    set
      question = excluded.question,
      answer = excluded.answer,
      category = excluded.category,
      is_published = true,
      updated_at = now();
  end if;

  if exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = 'faq'
  ) then
    insert into public.vet_articles (
      slug,
      question,
      answer,
      category,
      sort_order,
      is_published,
      created_at,
      updated_at
    )
    select
      'faq-' || regexp_replace(lower(coalesce(f.question, 'faq')), '[^a-z0-9]+', '-', 'g') as slug,
      f.question,
      f.answer,
      'General',
      1000 + row_number() over (order by f.question) - 1,
      true,
      now(),
      now()
    from public.faq f
    on conflict (slug) do update
    set
      question = excluded.question,
      answer = excluded.answer,
      category = excluded.category,
      is_published = true,
      updated_at = now();
  end if;
end
$$;

-- Optional cleanup after verifying the copy:
-- drop table if exists public.measurements;
-- drop table if exists public.vet_advice;
-- drop table if exists public.faq;

commit;
