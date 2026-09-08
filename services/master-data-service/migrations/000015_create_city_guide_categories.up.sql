-- CHANGE: Kategori Panduan Kota menjadi data referensi dinamis dengan siklus hidup mandiri.
CREATE TABLE city_guide_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deactivated_at TIMESTAMPTZ,
    deactivated_by VARCHAR(255),
    deactivation_reason TEXT,
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(255),
    delete_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_city_guide_categories_active_name
    ON city_guide_categories (LOWER(name)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_city_guide_categories_slug ON city_guide_categories (slug);
CREATE INDEX idx_city_guide_categories_status
    ON city_guide_categories (is_active, deleted_at, name);

-- INFO: Backfill tidak mengubah nilai kategori lama; ia hanya membuat referensi untuk setiap nilai yang sudah ada.
INSERT INTO city_guide_categories (name, slug)
SELECT category,
       LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(category), '[^[:alnum:]]+', '-', 'g'), '(^-|-$)', '', 'g'))
FROM (SELECT DISTINCT TRIM(category) AS category FROM city_guides WHERE TRIM(category) <> '') source
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE city_guides ADD COLUMN category_id UUID;
UPDATE city_guides guide
SET category_id = category.id
FROM city_guide_categories category
WHERE LOWER(category.name) = LOWER(TRIM(guide.category));

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM city_guides WHERE category_id IS NULL) THEN
        RAISE EXCEPTION 'Semua Panduan Kota harus memiliki kategori sebelum migrasi dilanjutkan';
    END IF;
END $$;

ALTER TABLE city_guides ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE city_guides ADD CONSTRAINT city_guides_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES city_guide_categories(id) ON DELETE RESTRICT;
CREATE INDEX idx_city_guides_category_id ON city_guides(category_id) WHERE deleted_at IS NULL;
