DROP INDEX IF EXISTS idx_media_assets_deleted_at;
DROP INDEX IF EXISTS idx_city_guides_deleted_at;
DROP INDEX IF EXISTS idx_kontingens_deleted_at;
DROP INDEX IF EXISTS idx_nomor_tandings_deleted_at;
DROP INDEX IF EXISTS idx_cabors_deleted_at;
DROP INDEX IF EXISTS uq_kontingens_active_name;
DROP INDEX IF EXISTS uq_cabors_active_name;

ALTER TABLE media_assets
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS updated_at;
ALTER TABLE city_guides
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE kontingens
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE nomor_tandings
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE cabors
    DROP COLUMN IF EXISTS delete_reason,
    DROP COLUMN IF EXISTS deleted_by,
    DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE cabors ADD CONSTRAINT cabors_name_key UNIQUE (name);
ALTER TABLE kontingens ADD CONSTRAINT kontingens_name_key UNIQUE (name);
