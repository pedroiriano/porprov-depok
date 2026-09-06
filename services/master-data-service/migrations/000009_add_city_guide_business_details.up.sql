-- CHANGE: Menyimpan kontak dan atribut layanan City Guide secara terstruktur tanpa field screenshot eksternal.
ALTER TABLE city_guides
    ADD COLUMN contact_phone VARCHAR(32),
    ADD COLUMN whatsapp VARCHAR(32),
    ADD COLUMN email VARCHAR(254),
    ADD COLUMN website_url TEXT,
    ADD COLUMN instagram_url TEXT,
    ADD COLUMN facebook_url TEXT,
    ADD COLUMN tiktok_url TEXT,
    ADD COLUMN service_types TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN service_area TEXT,
    ADD COLUMN operating_hours TEXT,
    ADD COLUMN price_range TEXT,
    ADD COLUMN fleet_types TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN fleet_count INTEGER;

ALTER TABLE city_guides
    ADD CONSTRAINT city_guides_fleet_count_check
        CHECK (fleet_count IS NULL OR fleet_count >= 0),
    ADD CONSTRAINT city_guides_contact_phone_length_check
        CHECK (contact_phone IS NULL OR char_length(contact_phone) <= 32),
    ADD CONSTRAINT city_guides_whatsapp_length_check
        CHECK (whatsapp IS NULL OR char_length(whatsapp) <= 32),
    ADD CONSTRAINT city_guides_website_url_length_check
        CHECK (website_url IS NULL OR char_length(website_url) <= 2048),
    ADD CONSTRAINT city_guides_social_url_length_check
        CHECK (
            (instagram_url IS NULL OR char_length(instagram_url) <= 2048)
            AND (facebook_url IS NULL OR char_length(facebook_url) <= 2048)
            AND (tiktok_url IS NULL OR char_length(tiktok_url) <= 2048)
        );

CREATE INDEX idx_city_guides_active_category_title
    ON city_guides (category, title)
    WHERE deleted_at IS NULL;

COMMENT ON COLUMN city_guides.service_types IS
    'Jenis layanan, misalnya nasi kotak, prasmanan, antar-jemput, atau sewa kendaraan.';
COMMENT ON COLUMN city_guides.fleet_types IS
    'Jenis armada untuk kategori Info Travel/Jasa Transportasi.';
COMMENT ON COLUMN city_guides.fleet_count IS
    'Jumlah seluruh unit armada aktif yang ditawarkan penyedia transportasi.';
