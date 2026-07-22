ALTER TABLE city_guides
    ADD COLUMN latitude DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;

ALTER TABLE city_guides
    ADD CONSTRAINT city_guides_coordinate_pair_check
        CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
    ADD CONSTRAINT city_guides_latitude_check
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT city_guides_longitude_check
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

CREATE INDEX idx_city_guides_active_coordinates
    ON city_guides (latitude, longitude)
    WHERE deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
