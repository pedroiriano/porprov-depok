ALTER TABLE city_guides DROP CONSTRAINT IF EXISTS city_guides_category_id_fkey;
ALTER TABLE city_guides DROP COLUMN IF EXISTS category_id;
DROP TABLE IF EXISTS city_guide_categories;
