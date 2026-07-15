DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs;
DROP FUNCTION IF EXISTS prevent_audit_log_mutation();
DROP INDEX IF EXISTS idx_audit_logs_actor;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS uq_audit_logs_event_id;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS payload_hash, DROP COLUMN IF EXISTS ip_address, DROP COLUMN IF EXISTS request_id, DROP COLUMN IF EXISTS actor_id, DROP COLUMN IF EXISTS event_type, DROP COLUMN IF EXISTS event_version, DROP COLUMN IF EXISTS event_id;
