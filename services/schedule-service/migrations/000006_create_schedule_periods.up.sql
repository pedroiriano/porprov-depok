-- INFO: Independent inclusive date ranges; existing matches and participants are unchanged.
CREATE TABLE schedule_periods (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cabor_id UUID NOT NULL,
 cabor_name TEXT NOT NULL, label TEXT NOT NULL DEFAULT '',
 starts_on DATE NOT NULL, ends_on DATE NOT NULL,
 notes TEXT NOT NULL DEFAULT '', is_published BOOLEAN NOT NULL DEFAULT false,
 version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 deleted_at TIMESTAMPTZ, deleted_by TEXT, delete_reason TEXT,
 CHECK (ends_on >= starts_on), CHECK (length(label) <= 120), CHECK (length(notes) <= 1000)
);
CREATE UNIQUE INDEX schedule_periods_active_unique ON schedule_periods(cabor_id,lower(label),starts_on,ends_on) WHERE deleted_at IS NULL;
CREATE INDEX schedule_periods_public_dates ON schedule_periods(starts_on,ends_on,id) WHERE deleted_at IS NULL AND is_published;
CREATE TABLE schedule_period_revisions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), period_id UUID NOT NULL REFERENCES schedule_periods(id),
 version BIGINT NOT NULL, action TEXT NOT NULL, snapshot JSONB NOT NULL,
 actor_id TEXT NOT NULL, actor_username TEXT NOT NULL, reason TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(period_id,version)
);
CREATE FUNCTION prevent_schedule_period_revision_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Schedule period revisions are immutable'; END; $$;
CREATE TRIGGER schedule_period_revision_immutable BEFORE UPDATE OR DELETE ON schedule_period_revisions
FOR EACH ROW EXECUTE FUNCTION prevent_schedule_period_revision_mutation();
CREATE TABLE schedule_period_outbox (
 id BIGSERIAL PRIMARY KEY, event_id UUID NOT NULL UNIQUE, payload JSONB NOT NULL,
 published_at TIMESTAMPTZ, attempts INTEGER NOT NULL DEFAULT 0,
 available_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX schedule_period_outbox_pending ON schedule_period_outbox(available_at) WHERE published_at IS NULL;
