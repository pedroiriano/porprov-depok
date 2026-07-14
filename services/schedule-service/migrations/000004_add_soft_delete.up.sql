-- CHANGE: Semua tabel persisten Schedule memiliki tombstone, termasuk tabel legacy/internal.
ALTER TABLE venues
    ADD COLUMN deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN deleted_by TEXT NULL,
    ADD COLUMN delete_reason TEXT NULL;

ALTER TABLE matches
    ADD COLUMN deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN deleted_by TEXT NULL,
    ADD COLUMN delete_reason TEXT NULL;

ALTER TABLE match_participants
    ADD COLUMN deleted_at TIMESTAMPTZ NULL,
    ADD COLUMN deleted_by TEXT NULL,
    ADD COLUMN delete_reason TEXT NULL;

CREATE INDEX idx_schedule_venues_deleted_at ON venues (deleted_at);
CREATE INDEX idx_matches_deleted_at ON matches (deleted_at);
CREATE INDEX idx_match_participants_deleted_at ON match_participants (deleted_at);
