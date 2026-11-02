-- SECURITY: Additive private documents; existing media/domain records are untouched.
CREATE TABLE document_policy (
 id SMALLINT PRIMARY KEY CHECK(id=1), version BIGINT NOT NULL DEFAULT 1,
 allowed_mime_types TEXT[] NOT NULL DEFAULT ARRAY['application/pdf'],
 max_file_bytes BIGINT NOT NULL DEFAULT 52428800 CHECK(max_file_bytes BETWEEN 1048576 AND 104857600),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_by TEXT NOT NULL
);
INSERT INTO document_policy(id,updated_by) VALUES(1,'migration:17');
CREATE TABLE documents (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 200),
 description TEXT NOT NULL DEFAULT '' CHECK(length(description)<=2000),
 original_name TEXT NOT NULL, storage_name TEXT NOT NULL UNIQUE, mime_type TEXT NOT NULL,
 file_bytes BIGINT NOT NULL CHECK(file_bytes>0), checksum_sha256 TEXT NOT NULL,
 version BIGINT NOT NULL DEFAULT 1, created_by TEXT NOT NULL, created_username TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 deleted_at TIMESTAMPTZ, deleted_by TEXT, delete_reason TEXT
);
CREATE INDEX documents_active_created ON documents(created_at DESC,id) WHERE deleted_at IS NULL;
CREATE INDEX documents_archived ON documents(deleted_at DESC,id) WHERE deleted_at IS NOT NULL;
CREATE TABLE document_revisions (
 id BIGSERIAL PRIMARY KEY, document_id UUID REFERENCES documents(id), version BIGINT NOT NULL,
 action TEXT NOT NULL, snapshot JSONB NOT NULL, actor_id TEXT NOT NULL, actor_username TEXT NOT NULL,
 reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX document_revisions_version ON document_revisions(document_id,version) WHERE document_id IS NOT NULL;
CREATE UNIQUE INDEX document_policy_revisions_version ON document_revisions(version) WHERE document_id IS NULL;
CREATE FUNCTION prevent_document_revision_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Document revisions are immutable'; END; $$;
CREATE TRIGGER document_revisions_immutable BEFORE UPDATE OR DELETE ON document_revisions
FOR EACH ROW EXECUTE FUNCTION prevent_document_revision_mutation();
INSERT INTO document_revisions(document_id,version,action,snapshot,actor_id,actor_username,reason)
SELECT NULL,version,'POLICY_INITIAL',jsonb_build_object('version',version,'allowed_mime_types',allowed_mime_types,'max_file_bytes',max_file_bytes),'migration:17','migration:17','Batas awal PDF 50 MiB' FROM document_policy;
CREATE TABLE document_outbox (
 id BIGSERIAL PRIMARY KEY, event_id TEXT NOT NULL UNIQUE, payload JSONB NOT NULL,
 published_at TIMESTAMPTZ, attempts INTEGER NOT NULL DEFAULT 0,
 available_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX document_outbox_pending ON document_outbox(available_at) WHERE published_at IS NULL;
