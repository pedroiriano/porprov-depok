-- name: CreateCabor :one
INSERT INTO cabors (name, description, icon_url)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListCabors :many
SELECT * FROM cabors
ORDER BY name ASC;

-- name: CreateNomorTanding :one
INSERT INTO nomor_tandings (cabor_id, name, gender_category, match_type)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListNomorTandings :many
SELECT * FROM nomor_tandings
ORDER BY name ASC;

-- name: CreateKontingen :one
INSERT INTO kontingens (name, region_type, logo_url)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListKontingens :many
SELECT * FROM kontingens
ORDER BY name ASC;

-- name: GetCaborByID :one
SELECT * FROM cabors WHERE id = $1 LIMIT 1;

-- name: UpdateCabor :one
UPDATE cabors
SET 
  name = COALESCE(NULLIF($2::text, ''), name),
  description = COALESCE(NULLIF($3::text, ''), description),
  icon_url = COALESCE(NULLIF($4::text, ''), icon_url),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteCabor :exec
DELETE FROM cabors WHERE id = $1;

-- name: GetKontingenByID :one
SELECT * FROM kontingens WHERE id = $1 LIMIT 1;

-- name: UpdateKontingen :one
UPDATE kontingens
SET 
  name = COALESCE(NULLIF($2::text, ''), name),
  region_type = COALESCE(NULLIF($3::text, ''), region_type),
  logo_url = COALESCE(NULLIF($4::text, ''), logo_url),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteKontingen :exec
DELETE FROM kontingens WHERE id = $1;
