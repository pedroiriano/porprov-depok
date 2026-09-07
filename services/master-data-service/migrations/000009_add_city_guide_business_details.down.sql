DROP INDEX IF EXISTS idx_city_guides_active_category_title;

ALTER TABLE city_guides
    DROP CONSTRAINT IF EXISTS city_guides_fleet_count_check,
    DROP CONSTRAINT IF EXISTS city_guides_contact_phone_length_check,
    DROP CONSTRAINT IF EXISTS city_guides_whatsapp_length_check,
    DROP CONSTRAINT IF EXISTS city_guides_website_url_length_check,
    DROP CONSTRAINT IF EXISTS city_guides_social_url_length_check,
    DROP COLUMN IF EXISTS fleet_count,
    DROP COLUMN IF EXISTS fleet_types,
    DROP COLUMN IF EXISTS price_range,
    DROP COLUMN IF EXISTS operating_hours,
    DROP COLUMN IF EXISTS service_area,
    DROP COLUMN IF EXISTS service_types,
    DROP COLUMN IF EXISTS tiktok_url,
    DROP COLUMN IF EXISTS facebook_url,
    DROP COLUMN IF EXISTS instagram_url,
    DROP COLUMN IF EXISTS website_url,
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS whatsapp,
    DROP COLUMN IF EXISTS contact_phone;
