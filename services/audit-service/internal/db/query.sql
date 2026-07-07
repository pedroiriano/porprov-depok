-- name: InsertAuditLog :one
INSERT INTO audit_logs (service_name, entity_name, entity_id, action, payload)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListAuditLogs :many
SELECT * FROM audit_logs
ORDER BY created_at DESC;
