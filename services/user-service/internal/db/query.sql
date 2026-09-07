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

-- name: CountUsersPage :one
SELECT COUNT(*)
FROM users
WHERE deleted_at IS NULL
  AND (
    sqlc.arg('search')::text = ''
    OR username ILIKE '%' || sqlc.arg('search')::text || '%'
    OR email ILIKE '%' || sqlc.arg('search')::text || '%'
    OR COALESCE(full_name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
    OR role ILIKE '%' || sqlc.arg('search')::text || '%'
  );

-- name: ListUsersPage :many
SELECT *
FROM users
WHERE deleted_at IS NULL
  AND (
    sqlc.arg('search')::text = ''
    OR username ILIKE '%' || sqlc.arg('search')::text || '%'
    OR email ILIKE '%' || sqlc.arg('search')::text || '%'
    OR COALESCE(full_name, '') ILIKE '%' || sqlc.arg('search')::text || '%'
    OR role ILIKE '%' || sqlc.arg('search')::text || '%'
  )
ORDER BY
  CASE WHEN sqlc.arg('sort_by')::text = 'username' AND sqlc.arg('sort_order')::text = 'asc' THEN LOWER(username) END ASC,
  CASE WHEN sqlc.arg('sort_by')::text = 'username' AND sqlc.arg('sort_order')::text = 'desc' THEN LOWER(username) END DESC,
  CASE WHEN sqlc.arg('sort_by')::text = 'full_name' AND sqlc.arg('sort_order')::text = 'asc' THEN LOWER(COALESCE(full_name, '')) END ASC,
  CASE WHEN sqlc.arg('sort_by')::text = 'full_name' AND sqlc.arg('sort_order')::text = 'desc' THEN LOWER(COALESCE(full_name, '')) END DESC,
  CASE WHEN sqlc.arg('sort_by')::text = 'email' AND sqlc.arg('sort_order')::text = 'asc' THEN LOWER(email) END ASC,
  CASE WHEN sqlc.arg('sort_by')::text = 'email' AND sqlc.arg('sort_order')::text = 'desc' THEN LOWER(email) END DESC,
  CASE WHEN sqlc.arg('sort_by')::text = 'role' AND sqlc.arg('sort_order')::text = 'asc' THEN LOWER(role) END ASC,
  CASE WHEN sqlc.arg('sort_by')::text = 'role' AND sqlc.arg('sort_order')::text = 'desc' THEN LOWER(role) END DESC,
  CASE WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'asc' THEN created_at END ASC,
  CASE WHEN sqlc.arg('sort_by')::text = 'created_at' AND sqlc.arg('sort_order')::text = 'desc' THEN created_at END DESC,
  id ASC
LIMIT sqlc.arg('page_limit')::integer
OFFSET sqlc.arg('page_offset')::integer;

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
