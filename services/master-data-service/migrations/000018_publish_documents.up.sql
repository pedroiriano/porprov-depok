-- SECURITY: Existing documents remain private; publication is an explicit owner action.
ALTER TABLE documents ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE documents ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE documents ADD CONSTRAINT documents_pin_requires_publication CHECK(NOT is_pinned OR (is_published AND deleted_at IS NULL));
CREATE UNIQUE INDEX documents_single_public_pin ON documents((true)) WHERE is_pinned;
CREATE INDEX documents_public_created ON documents(created_at DESC,id) WHERE is_published AND deleted_at IS NULL;
