CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS form_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(255) NOT NULL,
    route_key VARCHAR(255) NOT NULL,
    entity_key VARCHAR(255) NOT NULL,
    form_version VARCHAR(80) NOT NULL,
    payload JSONB NOT NULL,
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT form_drafts_payload_object CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT form_drafts_version_positive CHECK (version > 0),
    CONSTRAINT form_drafts_expiry_after_creation CHECK (expires_at > created_at),
    CONSTRAINT form_drafts_owner_key_unique UNIQUE (actor_id, route_key, entity_key, form_version)
);

CREATE INDEX IF NOT EXISTS idx_form_drafts_expiry ON form_drafts (expires_at);
CREATE INDEX IF NOT EXISTS idx_form_drafts_actor_updated ON form_drafts (actor_id, updated_at DESC);
