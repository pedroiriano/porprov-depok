ALTER TABLE matches
ADD CONSTRAINT matches_venue_id_fkey
FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;
