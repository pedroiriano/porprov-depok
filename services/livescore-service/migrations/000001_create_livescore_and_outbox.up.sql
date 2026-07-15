CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS livescore_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    revision_number BIGINT NOT NULL,
    score_a INTEGER NOT NULL CHECK (score_a >= 0),
    score_b INTEGER NOT NULL CHECK (score_b >= 0),
    status VARCHAR(50) NOT NULL,
    correction_of UUID REFERENCES livescore_revisions(id),
    correction_reason TEXT,
    actor_id VARCHAR(255) NOT NULL,
    request_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (match_id, revision_number),
    CHECK ((correction_of IS NULL AND correction_reason IS NULL) OR (correction_of IS NOT NULL AND length(trim(correction_reason)) >= 5))
);

CREATE TABLE IF NOT EXISTS livescore_current (
    match_id UUID PRIMARY KEY,
    revision_id UUID NOT NULL REFERENCES livescore_revisions(id),
    revision_number BIGINT NOT NULL,
    score_a INTEGER NOT NULL CHECK (score_a >= 0),
    score_b INTEGER NOT NULL CHECK (score_b >= 0),
    status VARCHAR(50) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    subject VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_livescore_revisions_match ON livescore_revisions(match_id, revision_number DESC);
CREATE INDEX IF NOT EXISTS idx_livescore_outbox_pending ON outbox_events(next_attempt_at, created_at) WHERE published_at IS NULL;

-- SECURITY: Riwayat revisi bersifat append-only; koreksi selalu membuat revisi baru.
CREATE OR REPLACE FUNCTION prevent_livescore_revision_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'livescore revisions are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS livescore_revisions_immutable ON livescore_revisions;
CREATE TRIGGER livescore_revisions_immutable
BEFORE UPDATE OR DELETE ON livescore_revisions
FOR EACH ROW EXECUTE FUNCTION prevent_livescore_revision_mutation();
