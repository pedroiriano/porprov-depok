DROP TRIGGER IF EXISTS cabors_assign_slug_before_insert ON cabors;
DROP FUNCTION IF EXISTS assign_cabor_slug();
DROP INDEX IF EXISTS cabors_slug_unique_idx;
ALTER TABLE cabors DROP CONSTRAINT IF EXISTS cabors_slug_format_check;
ALTER TABLE cabors DROP COLUMN IF EXISTS slug;
