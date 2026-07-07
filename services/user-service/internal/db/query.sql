-- name: CreateUser :one
INSERT INTO users (
  keycloak_id, username, email, full_name, role
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByKeycloakID :one
SELECT * FROM users
WHERE keycloak_id = $1 LIMIT 1;

-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at DESC;

-- name: UpdateUser :one
UPDATE users
SET 
  username = COALESCE(NULLIF($2::text, ''), username),
  email = COALESCE(NULLIF($3::text, ''), email),
  full_name = COALESCE(NULLIF($4::text, ''), full_name),
  role = COALESCE(NULLIF($5::text, ''), role),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;
