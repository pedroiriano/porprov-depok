-- name: CreateCabor :one
INSERT INTO cabors (name, description, icon_url, hero_image_url, kategori, total_medali, technical_delegate, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

-- name: GetCaborByIdentifier :one
SELECT * FROM cabors
WHERE deleted_at IS NULL
  AND (id::text = sqlc.arg(identifier)::text OR slug = sqlc.arg(identifier)::text)
LIMIT 1;

-- name: UpdateCabor :one
UPDATE cabors
SET
  name = COALESCE(NULLIF($2::text, ''), name),
  description = COALESCE(NULLIF($3::text, ''), description),
  icon_url = COALESCE(NULLIF($4::text, ''), icon_url),
  hero_image_url = NULLIF($5::text, ''),
  kategori = COALESCE(NULLIF($6::text, ''), kategori),
  total_medali = COALESCE(NULLIF($7::integer, 0), total_medali),
  technical_delegate = COALESCE(NULLIF($8::text, ''), technical_delegate),
  status = COALESCE(NULLIF($9::text, ''), status),
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
INSERT INTO city_guides (
  title, category, description, address, image_url, latitude, longitude, map_route_url,
  contact_phone, whatsapp, email, website_url, instagram_url, facebook_url, tiktok_url,
  service_types, service_area, operating_hours, price_range, fleet_types, fleet_count
)
VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8,
  $9, $10, $11, $12, $13, $14, $15,
  $16, $17, $18, $19, $20, $21
)
RETURNING *;

-- name: ListCityGuides :many
SELECT * FROM city_guides
WHERE deleted_at IS NULL
  AND category = COALESCE(NULLIF(sqlc.arg(category)::text, ''), category)
  AND (
    NULLIF(sqlc.arg(search)::text, '') IS NULL
    OR title ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(description, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(address, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR category ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
  )
ORDER BY title ASC;

-- name: ListCityGuidesPaginated :many
SELECT * FROM city_guides
WHERE deleted_at IS NULL
  AND category = COALESCE(NULLIF(sqlc.arg(category)::text, ''), category)
  AND (
    NULLIF(sqlc.arg(search)::text, '') IS NULL
    OR title ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(description, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(address, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR category ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(contact_phone, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(whatsapp, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(email, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
  )
ORDER BY title ASC, id ASC
LIMIT sqlc.arg(page_limit)::integer
OFFSET sqlc.arg(page_offset)::integer;

-- name: CountCityGuides :one
SELECT COUNT(*) FROM city_guides
WHERE deleted_at IS NULL
  AND category = COALESCE(NULLIF(sqlc.arg(category)::text, ''), category)
  AND (
    NULLIF(sqlc.arg(search)::text, '') IS NULL
    OR title ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(description, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(address, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR category ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(contact_phone, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(whatsapp, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(email, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
  );

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
  map_route_url = NULLIF($9::text, ''),
  contact_phone = NULLIF($10::text, ''),
  whatsapp = NULLIF($11::text, ''),
  email = NULLIF($12::text, ''),
  website_url = NULLIF($13::text, ''),
  instagram_url = NULLIF($14::text, ''),
  facebook_url = NULLIF($15::text, ''),
  tiktok_url = NULLIF($16::text, ''),
  service_types = $17,
  service_area = NULLIF($18::text, ''),
  operating_hours = NULLIF($19::text, ''),
  price_range = NULLIF($20::text, ''),
  fleet_types = $21,
  fleet_count = $22,
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

-- name: CreateHero :one
WITH deactivated AS (
  UPDATE heroes AS current_hero
  SET is_active = FALSE, updated_at = NOW(), updated_by = sqlc.arg(actor)
  WHERE sqlc.arg(is_active)::boolean = TRUE AND current_hero.is_active = TRUE AND current_hero.deleted_at IS NULL
  RETURNING current_hero.id
)
INSERT INTO heroes (title, highlight_text, description, background_image_url, is_active, created_by, updated_by)
SELECT sqlc.arg(title), NULLIF(sqlc.arg(highlight_text)::text, ''), sqlc.arg(description),
       sqlc.arg(background_image_url), sqlc.arg(is_active), sqlc.arg(actor), sqlc.arg(actor)
FROM (SELECT COUNT(*) FROM deactivated) synchronization
RETURNING *;

-- name: ListHeroes :many
SELECT * FROM heroes
WHERE deleted_at IS NULL
ORDER BY is_active DESC, updated_at DESC;

-- name: GetActiveHero :one
SELECT * FROM heroes
WHERE is_active = TRUE AND deleted_at IS NULL
LIMIT 1;

-- name: GetHeroByID :one
SELECT * FROM heroes
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: UpdateHero :one
WITH deactivated AS (
  UPDATE heroes AS current_hero
  SET is_active = FALSE, updated_at = NOW(), updated_by = sqlc.arg(actor)
  WHERE sqlc.arg(is_active)::boolean = TRUE
    AND current_hero.id <> sqlc.arg(id)
    AND current_hero.is_active = TRUE
    AND current_hero.deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM heroes AS update_target
      WHERE update_target.id = sqlc.arg(id) AND update_target.deleted_at IS NULL
    )
  RETURNING current_hero.id
)
UPDATE heroes AS target
SET title = sqlc.arg(title),
    highlight_text = NULLIF(sqlc.arg(highlight_text)::text, ''),
    description = sqlc.arg(description),
    background_image_url = sqlc.arg(background_image_url),
    is_active = sqlc.arg(is_active),
    updated_by = sqlc.arg(actor),
    updated_at = NOW()
WHERE target.id = sqlc.arg(id)
  AND target.deleted_at IS NULL
  AND (SELECT COUNT(*) FROM deactivated) >= 0
RETURNING *;
