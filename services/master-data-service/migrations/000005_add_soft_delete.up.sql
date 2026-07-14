-- CHANGE: Seluruh entity persisten Master Data menggunakan tombstone yang dapat dipulihkan.
-- INFO: CREATE IF NOT EXISTS memperbaiki database lama yang pernah dibaseline tanpa migration 000002/000004 aktual.
CREATE TABLE IF NOT EXISTS city_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cabors
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT NULL,
    ADD COLUMN IF NOT EXISTS delete_reason TEXT NULL;

ALTER TABLE nomor_tandings
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT NULL,
    ADD COLUMN IF NOT EXISTS delete_reason TEXT NULL;

ALTER TABLE kontingens
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT NULL,
    ADD COLUMN IF NOT EXISTS delete_reason TEXT NULL;

ALTER TABLE city_guides
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT NULL,
    ADD COLUMN IF NOT EXISTS delete_reason TEXT NULL;

ALTER TABLE media_assets
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT NULL,
    ADD COLUMN IF NOT EXISTS delete_reason TEXT NULL;

-- CHANGE: Nama dapat digunakan kembali setelah record lama diarsipkan.
ALTER TABLE cabors DROP CONSTRAINT IF EXISTS cabors_name_key;
ALTER TABLE kontingens DROP CONSTRAINT IF EXISTS kontingens_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cabors_active_name ON cabors (LOWER(name)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_kontingens_active_name ON kontingens (LOWER(name)) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cabors_deleted_at ON cabors (deleted_at);
CREATE INDEX IF NOT EXISTS idx_nomor_tandings_deleted_at ON nomor_tandings (deleted_at);
CREATE INDEX IF NOT EXISTS idx_kontingens_deleted_at ON kontingens (deleted_at);
CREATE INDEX IF NOT EXISTS idx_city_guides_deleted_at ON city_guides (deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_deleted_at ON media_assets (deleted_at);
