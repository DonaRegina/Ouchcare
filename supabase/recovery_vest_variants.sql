-- Seed: recovery_vest_variants.sql
-- Inserts size & material variants for "Medical Recovery Vest for Pets" into product_variants.
-- Deletes existing variants for the product first to avoid duplicates.
BEGIN;

-- Find the product id by name. Change the WHERE clause if you identify the product by slug or other field.
WITH pid AS (
  SELECT id
  FROM products
  WHERE name = 'Medical Recovery Vest for Pets'
  LIMIT 1
)
-- Remove existing variants for this product (if any).
DELETE FROM product_variants
WHERE product_id = (SELECT id FROM pid);

-- Insert all variants (material, size, price_huf)
INSERT INTO product_variants (product_id, material, size, price_huf)
SELECT pid.id, v.material, v.size, v.price_huf
FROM (
  VALUES
    -- Full Cotton
    ('Full Cotton','XXS', 9500),
    ('Full Cotton','XS' ,10000),
    ('Full Cotton','S'  ,10500),
    ('Full Cotton','M'  ,11500),
    ('Full Cotton','L'  ,12500),
    ('Full Cotton','XL' ,13000),
    ('Full Cotton','XXL',13500),
    -- Recycled Cotton
    ('Recycled Cotton','XXS', 8100),
    ('Recycled Cotton','XS' , 8400),
    ('Recycled Cotton','S'  , 8800),
    ('Recycled Cotton','M'  , 9100),
    ('Recycled Cotton','L'  , 9800),
    ('Recycled Cotton','XL' ,10200),
    ('Recycled Cotton','XXL',10600)
) AS v(material, size, price_huf), pid;

COMMIT;
