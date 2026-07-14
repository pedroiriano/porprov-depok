DROP INDEX IF EXISTS uq_venues_active_name;
DROP INDEX IF EXISTS idx_venues_deleted_at;

ALTER TABLE venues
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at;
