DROP TRIGGER IF EXISTS venues_assign_slug_before_insert ON venues;
DROP FUNCTION IF EXISTS assign_venue_slug();
DROP INDEX IF EXISTS venues_slug_unique_idx;
ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_slug_format_check;
ALTER TABLE venues DROP COLUMN IF EXISTS slug;
