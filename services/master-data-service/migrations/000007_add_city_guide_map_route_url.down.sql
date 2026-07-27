ALTER TABLE city_guides
    DROP CONSTRAINT IF EXISTS city_guides_map_route_url_length_check,
    DROP COLUMN IF EXISTS map_route_url;
