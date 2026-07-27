ALTER TABLE city_guides
    ADD COLUMN map_route_url TEXT;

ALTER TABLE city_guides
    ADD CONSTRAINT city_guides_map_route_url_length_check
        CHECK (map_route_url IS NULL OR char_length(map_route_url) <= 2048);

COMMENT ON COLUMN city_guides.map_route_url IS
    'Optional HTTPS Google Maps route URL. Consumers fall back to latitude/longitude when empty.';
