DROP INDEX IF EXISTS city_guides_single_active_venue_pin;
ALTER TABLE city_guides DROP COLUMN IF EXISTS is_pinned_venue_recommendation;
