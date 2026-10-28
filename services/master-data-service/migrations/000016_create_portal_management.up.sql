-- SECURITY: Additive only; initial fallback preserves existing publication until explicitly changed.
CREATE TABLE portal_configuration (
 id SMALLINT PRIMARY KEY CHECK (id = 1), version BIGINT NOT NULL DEFAULT 0,
 draft JSONB NOT NULL, published JSONB NOT NULL, published_version BIGINT NOT NULL DEFAULT 0,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_by TEXT NOT NULL
);
CREATE TABLE portal_revisions (
 id BIGSERIAL PRIMARY KEY, version BIGINT NOT NULL UNIQUE,
 action TEXT NOT NULL CHECK (action IN ('SAVE_DRAFT','PUBLISH','RESTORE')),
 document JSONB NOT NULL, actor_id TEXT NOT NULL, actor_username TEXT NOT NULL,
 reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE portal_outbox (
 id BIGSERIAL PRIMARY KEY, event_id TEXT NOT NULL UNIQUE, payload JSONB NOT NULL,
 published_at TIMESTAMPTZ, attempts INTEGER NOT NULL DEFAULT 0,
 available_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX portal_outbox_pending ON portal_outbox(available_at) WHERE published_at IS NULL;
CREATE FUNCTION prevent_portal_revision_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Portal revisions are immutable'; END; $$;
CREATE TRIGGER portal_revisions_immutable BEFORE UPDATE OR DELETE ON portal_revisions
FOR EACH ROW EXECUTE FUNCTION prevent_portal_revision_mutation();
