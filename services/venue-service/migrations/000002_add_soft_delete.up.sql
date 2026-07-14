-- CHANGE: Venue diarsipkan dan dapat dipulihkan tanpa memutus referensi lintas service.
ALTER TABLE venues
    ADD COLUMN deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN deleted_by TEXT NULL,
    ADD COLUMN delete_reason TEXT NULL;

CREATE INDEX idx_venues_deleted_at ON venues (deleted_at);
CREATE UNIQUE INDEX uq_venues_active_name ON venues (LOWER(name)) WHERE deleted_at IS NULL;
