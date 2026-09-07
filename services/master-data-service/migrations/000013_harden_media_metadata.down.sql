DROP INDEX IF EXISTS idx_media_assets_checksum_sha256;

ALTER TABLE media_assets
    DROP COLUMN IF EXISTS uploaded_by,
    DROP COLUMN IF EXISTS height,
    DROP COLUMN IF EXISTS width,
    DROP COLUMN IF EXISTS checksum_sha256;
