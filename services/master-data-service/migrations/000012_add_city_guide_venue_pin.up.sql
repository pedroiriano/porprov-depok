-- INFO: Hanya satu City Guide aktif yang boleh menjadi rekomendasi utama seluruh venue.
ALTER TABLE city_guides
    ADD COLUMN is_pinned_venue_recommendation BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX city_guides_single_active_venue_pin
    ON city_guides ((1))
    WHERE is_pinned_venue_recommendation = TRUE AND deleted_at IS NULL;

-- CHANGE: Default produk adalah Department Sports Lab bila record aktif tersebut tersedia.
UPDATE city_guides
SET is_pinned_venue_recommendation = TRUE,
    updated_at = NOW()
WHERE id = (
    SELECT id
    FROM city_guides
    WHERE deleted_at IS NULL
      AND LOWER(BTRIM(title)) = LOWER('Department Sports Lab')
    ORDER BY created_at ASC, id ASC
    LIMIT 1
);

COMMENT ON COLUMN city_guides.is_pinned_venue_recommendation IS
    'Exactly one active City Guide may be prioritized on every public Venue detail page.';
