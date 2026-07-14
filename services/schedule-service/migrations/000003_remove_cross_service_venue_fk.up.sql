ALTER TABLE matches
DROP CONSTRAINT IF EXISTS matches_venue_id_fkey;

COMMENT ON COLUMN matches.venue_id IS
'External UUID owned by venue-service; validated through the service contract.';
