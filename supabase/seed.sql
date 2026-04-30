-- One-time seed data for storefront products.
-- Run this after schema.sql to populate visible shop items.

insert into public.products (
  slug,
  name,
  description,
  price_huf,
  hero_image_url,
  material,
  is_active
)
values
  (
    'recover-suit',
    'Medical Recovery Vest for Pets',
    'Veterinarian-approved vest for post-surgery recovery with comfortable shoulder and rib coverage for cats and dogs.',
    300000,
    '/products/medical-recovery-vest.jpg',
    'Double-layer cotton',
    true
  ),
  (
    'soft-collar-wrap',
    'Soft Collar Wrap',
    'Cone alternative designed for calmer recovery and reduced stress during eating, sleeping, and resting.',
    14900,
    '/products/soft-collar.jpg',
    'Medical mesh + neoprene',
    true
  ),
  (
    'post-op-leg-guard',
    'Post-op Leg Guard',
    'Targeted protective sleeve for limb procedures and dermatology recovery with breathable stretch support.',
    18900,
    '/products/leg-guard.jpg',
    'Stretch knit with antimicrobial lining',
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
