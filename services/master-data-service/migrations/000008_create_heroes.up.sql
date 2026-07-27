-- CHANGE: Hero utama dikelola sebagai konten terstruktur, bukan hardcoded di Public Web.
-- SECURITY: Tombstone mempertahankan histori dan memungkinkan pemulihan terotorisasi.
CREATE TABLE heroes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(180) NOT NULL,
    highlight_text VARCHAR(100),
    description TEXT NOT NULL,
    background_image_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_by TEXT,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT,
    delete_reason TEXT,
    CONSTRAINT heroes_title_not_blank CHECK (BTRIM(title) <> ''),
    CONSTRAINT heroes_description_not_blank CHECK (BTRIM(description) <> ''),
    CONSTRAINT heroes_background_not_blank CHECK (BTRIM(background_image_url) <> '')
);

-- INFO: Hanya satu Hero aktif yang boleh menjadi sumber tampilan Landing Page.
CREATE UNIQUE INDEX uq_heroes_single_active
    ON heroes (is_active)
    WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_heroes_deleted_at ON heroes (deleted_at);
CREATE INDEX idx_heroes_updated_at ON heroes (updated_at DESC);

-- INFO: Seed mempertahankan tampilan canonical sampai operator memilih gambar dari Media Library.
INSERT INTO heroes (
    title,
    highlight_text,
    description,
    background_image_url,
    is_active,
    created_by,
    updated_by
) VALUES (
    'Panggung Juara Jawa Barat.',
    'Jawa Barat.',
    'Saksikan PORPROV XV Jawa Barat 2026 dari Kota Depok—jadwal, venue, LiveScore, dan perjalanan para atlet dalam satu portal resmi.',
    '/assets/images/alun-alun.png',
    TRUE,
    'system-migration',
    'system-migration'
);
