-- INFO: Slug dipakai hanya sebagai identifier publik yang mudah dibaca.
-- UUID tetap menjadi primary key dan referensi lintas service.
ALTER TABLE venues ADD COLUMN slug VARCHAR(255);

WITH normalized AS (
    SELECT
        id,
        COALESCE(
            NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')), ''),
            'venue'
        ) AS base_slug,
        ROW_NUMBER() OVER (
            PARTITION BY COALESCE(
                NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g')), ''),
                'venue'
            )
            ORDER BY created_at, id
        ) AS duplicate_number
    FROM venues
)
UPDATE venues
SET slug = CASE
    WHEN normalized.duplicate_number = 1 THEN normalized.base_slug
    ELSE normalized.base_slug || '-' || SUBSTRING(REPLACE(venues.id::TEXT, '-', '') FROM 1 FOR 8)
END
FROM normalized
WHERE venues.id = normalized.id;

ALTER TABLE venues ALTER COLUMN slug SET NOT NULL;
ALTER TABLE venues ADD CONSTRAINT venues_slug_format_check
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
CREATE UNIQUE INDEX venues_slug_unique_idx ON venues (slug);

CREATE OR REPLACE FUNCTION assign_venue_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
BEGIN
    IF NEW.slug IS NOT NULL AND BTRIM(NEW.slug) <> '' THEN
        RETURN NEW;
    END IF;

    base_slug := COALESCE(
        NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(NEW.name), '[^a-z0-9]+', '-', 'g')), ''),
        'venue'
    );
    NEW.slug := base_slug;

    IF EXISTS (SELECT 1 FROM venues WHERE slug = NEW.slug AND id <> NEW.id) THEN
        NEW.slug := base_slug || '-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8);
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER venues_assign_slug_before_insert
BEFORE INSERT ON venues
FOR EACH ROW EXECUTE FUNCTION assign_venue_slug();
