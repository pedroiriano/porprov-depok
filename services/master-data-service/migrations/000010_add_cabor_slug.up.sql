-- INFO: UUID tetap menjadi primary key dan referensi lintas service.
-- Slug hanya menjadi identifier publik yang mudah dibaca.
ALTER TABLE cabors ADD COLUMN slug VARCHAR(255);

WITH normalized AS (
    SELECT id,
        COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')), ''), 'cabor') AS base_slug,
        ROW_NUMBER() OVER (
            PARTITION BY COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')), ''), 'cabor')
            ORDER BY created_at, id
        ) AS duplicate_number
    FROM cabors
)
UPDATE cabors
SET slug = CASE
    WHEN normalized.duplicate_number = 1 THEN normalized.base_slug
    ELSE normalized.base_slug || '-' || SUBSTRING(REPLACE(cabors.id::TEXT, '-', '') FROM 1 FOR 8)
END
FROM normalized
WHERE cabors.id = normalized.id;

ALTER TABLE cabors ALTER COLUMN slug SET NOT NULL;
ALTER TABLE cabors ADD CONSTRAINT cabors_slug_format_check CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE UNIQUE INDEX cabors_slug_unique_idx ON cabors (slug);

CREATE OR REPLACE FUNCTION assign_cabor_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
BEGIN
    IF NEW.slug IS NOT NULL AND BTRIM(NEW.slug) <> '' THEN
        RETURN NEW;
    END IF;
    base_slug := COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(NEW.name), '[^a-z0-9]+', '-', 'g')), ''), 'cabor');
    NEW.slug := base_slug;
    IF EXISTS (SELECT 1 FROM cabors WHERE slug = NEW.slug AND id <> NEW.id) THEN
        NEW.slug := base_slug || '-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER cabors_assign_slug_before_insert
BEFORE INSERT ON cabors
FOR EACH ROW EXECUTE FUNCTION assign_cabor_slug();
