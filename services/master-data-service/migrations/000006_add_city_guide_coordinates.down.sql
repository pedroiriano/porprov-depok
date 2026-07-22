DROP INDEX IF EXISTS idx_city_guides_active_coordinates;

ALTER TABLE city_guides
    DROP CONSTRAINT IF EXISTS city_guides_longitude_check,
    DROP CONSTRAINT IF EXISTS city_guides_latitude_check,
    DROP CONSTRAINT IF EXISTS city_guides_coordinate_pair_check,
    DROP COLUMN IF EXISTS longitude,
    DROP COLUMN IF EXISTS latitude;
