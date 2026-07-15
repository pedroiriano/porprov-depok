CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS medal_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kontingen_id UUID NOT NULL,
    gold INTEGER NOT NULL DEFAULT 0 CHECK (gold >= 0),
    silver INTEGER NOT NULL DEFAULT 0 CHECK (silver >= 0),
    bronze INTEGER NOT NULL DEFAULT 0 CHECK (bronze >= 0),
    evidence_url TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'OFFICIAL')),
    submitted_by VARCHAR(255) NOT NULL,
    verified_by VARCHAR(255),
    verification_notes TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (gold + silver + bronze > 0)
);

CREATE TABLE IF NOT EXISTS medal_submission_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES medal_submissions(id),
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    reason TEXT,
    request_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE INDEX IF NOT EXISTS idx_medal_submissions_status ON medal_submissions(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_medal_history_submission ON medal_submission_history(submission_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medal_outbox_pending ON outbox_events(next_attempt_at, created_at) WHERE published_at IS NULL;

CREATE OR REPLACE FUNCTION prevent_medal_history_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'medal submission history is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS medal_submission_history_immutable ON medal_submission_history;
CREATE TRIGGER medal_submission_history_immutable
BEFORE UPDATE OR DELETE ON medal_submission_history
FOR EACH ROW EXECUTE FUNCTION prevent_medal_history_mutation();
