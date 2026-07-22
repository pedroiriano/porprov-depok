-- name: CreateUser :one
INSERT INTO users (
  keycloak_id, username, email, full_name, role
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: GetUserByKeycloakID :one
SELECT * FROM users
WHERE keycloak_id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: ListUsers :many
SELECT * FROM users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateUser :one
UPDATE users
SET 
  username = COALESCE(NULLIF(sqlc.arg('username')::text, ''), username),
  email = COALESCE(NULLIF(sqlc.arg('email')::text, ''), email),
  full_name = COALESCE(NULLIF(sqlc.arg('full_name')::text, ''), full_name),
  role = COALESCE(NULLIF(sqlc.arg('role')::text, ''), role),
  updated_at = NOW()
WHERE id = sqlc.arg('id') AND deleted_at IS NULL
RETURNING *;

-- name: DeleteUser :exec
UPDATE users
SET deleted_at = NOW(),
    deleted_by = sqlc.arg('deleted_by')::varchar,
    delete_reason = COALESCE(NULLIF(sqlc.arg('delete_reason')::text, ''), delete_reason)
WHERE id = sqlc.arg('id');
