CREATE TABLE IF NOT EXISTS media_derivatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    variant TEXT NOT NULL CHECK (variant IN ('thumbnail', 'list', 'detail')),
    file_url TEXT NOT NULL,
    width INT NOT NULL CHECK (width > 0),
    height INT NOT NULL CHECK (height > 0),
    file_size INT NOT NULL CHECK (file_size > 0),
    checksum_sha256 TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (media_id, variant)
);

CREATE INDEX IF NOT EXISTS idx_media_derivatives_media_id ON media_derivatives (media_id);
