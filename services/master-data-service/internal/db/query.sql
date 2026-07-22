-- name: CreateCabor :one
INSERT INTO cabors (name, description, icon_url, kategori, total_medali, technical_delegate, status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListCabors :many
SELECT * FROM cabors
WHERE deleted_at IS NULL
ORDER BY name ASC;

-- name: CreateNomorTanding :one
INSERT INTO nomor_tandings (cabor_id, name, gender_category, match_type)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListNomorTandings :many
SELECT * FROM nomor_tandings
WHERE deleted_at IS NULL
ORDER BY name ASC;

-- name: GetNomorTandingByID :one
SELECT * FROM nomor_tandings WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: UpdateNomorTanding :one
UPDATE nomor_tandings
SET
  cabor_id = $2,
  name = $3,
  gender_category = $4,
  match_type = $5,
  updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: CreateKontingen :one
INSERT INTO kontingens (name, region_type, logo_url)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListKontingens :many
SELECT * FROM kontingens
WHERE deleted_at IS NULL
ORDER BY name ASC;

-- name: GetCaborByID :one
SELECT * FROM cabors WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: UpdateCabor :one
UPDATE cabors
SET
  name = COALESCE(NULLIF($2::text, ''), name),
  description = COALESCE(NULLIF($3::text, ''), description),
  icon_url = COALESCE(NULLIF($4::text, ''), icon_url),
  kategori = COALESCE(NULLIF($5::text, ''), kategori),
  total_medali = COALESCE(NULLIF($6::integer, 0), total_medali),
  technical_delegate = COALESCE(NULLIF($7::text, ''), technical_delegate),
  status = COALESCE(NULLIF($8::text, ''), status),
  updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: GetKontingenByID :one
SELECT * FROM kontingens WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: UpdateKontingen :one
UPDATE kontingens
SET
  name = COALESCE(NULLIF($2::text, ''), name),
  region_type = COALESCE(NULLIF($3::text, ''), region_type),
  logo_url = COALESCE(NULLIF($4::text, ''), logo_url),
  updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: CreateCityGuide :one
INSERT INTO city_guides (title, category, description, address, image_url, latitude, longitude)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListCityGuides :many
SELECT * FROM city_guides
WHERE deleted_at IS NULL
  AND category = COALESCE(NULLIF($1::text, ''), category)
ORDER BY title ASC;

-- name: GetCityGuideByID :one
SELECT * FROM city_guides WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: UpdateCityGuide :one
UPDATE city_guides
SET
  title = $2,
  category = $3,
  description = NULLIF($4::text, ''),
  address = NULLIF($5::text, ''),
  image_url = NULLIF($6::text, ''),
  latitude = $7,
  longitude = $8,
  updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: CreateMedia :one
INSERT INTO media_assets (
  file_name, file_url, mime_type, file_size
) VALUES (
  $1, $2, $3, $4
)
RETURNING *;

-- name: GetMedia :many
SELECT * FROM media_assets
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- name: GetMediaByID :one
SELECT * FROM media_assets
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;
