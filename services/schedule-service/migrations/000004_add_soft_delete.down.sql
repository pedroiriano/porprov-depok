DROP INDEX IF EXISTS idx_match_participants_deleted_at;
DROP INDEX IF EXISTS idx_matches_deleted_at;
DROP INDEX IF EXISTS idx_schedule_venues_deleted_at;

ALTER TABLE match_participants
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE matches
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE venues
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at;
