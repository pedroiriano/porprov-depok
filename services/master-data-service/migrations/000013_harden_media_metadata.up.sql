-- SECURITY: Metadata ini membuktikan integritas, dimensi aman, dan actor unggahan.
ALTER TABLE media_assets
    ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT,
    ADD COLUMN IF NOT EXISTS width INT,
    ADD COLUMN IF NOT EXISTS height INT,
    ADD COLUMN IF NOT EXISTS uploaded_by TEXT;

CREATE INDEX IF NOT EXISTS idx_media_assets_checksum_sha256
    ON media_assets (checksum_sha256)
    WHERE deleted_at IS NULL AND checksum_sha256 IS NOT NULL;
