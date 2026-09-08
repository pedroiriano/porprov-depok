DROP INDEX IF EXISTS idx_audit_logs_actor_username;
ALTER TABLE audit_logs
    DROP COLUMN IF EXISTS actor_kind,
    DROP COLUMN IF EXISTS actor_display_name,
    DROP COLUMN IF EXISTS actor_username;
