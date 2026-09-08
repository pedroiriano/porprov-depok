DROP TABLE IF EXISTS user_notifications;
DROP TABLE IF EXISTS access_role_permissions;
DROP TABLE IF EXISTS access_permissions;
DROP TABLE IF EXISTS access_roles;
DROP INDEX IF EXISTS idx_users_lifecycle;
ALTER TABLE users
    DROP COLUMN IF EXISTS status_reason,
    DROP COLUMN IF EXISTS status_changed_by,
    DROP COLUMN IF EXISTS status_changed_at,
    DROP COLUMN IF EXISTS is_active;
