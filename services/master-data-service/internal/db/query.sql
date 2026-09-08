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
  title, category, category_id, description, address, image_url, latitude, longitude, map_route_url,
  contact_phone, whatsapp, email, website_url, instagram_url, facebook_url, tiktok_url,
  service_types, service_area, operating_hours, price_range, fleet_types, fleet_count
)
VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9,
  $10, $11, $12, $13, $14, $15, $16,
  $17, $18, $19, $20, $21, $22
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
ORDER BY is_pinned_venue_recommendation DESC, title ASC;

-- name: ListPublicCityGuides :many
SELECT guide.* FROM city_guides guide
JOIN city_guide_categories category_ref ON category_ref.id = guide.category_id
WHERE guide.deleted_at IS NULL
  AND category_ref.deleted_at IS NULL
  AND category_ref.is_active
  AND guide.category = COALESCE(NULLIF(sqlc.arg(category)::text, ''), guide.category)
  AND (
    NULLIF(sqlc.arg(search)::text, '') IS NULL
    OR guide.title ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.description, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.address, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR guide.category ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
  )
ORDER BY guide.is_pinned_venue_recommendation DESC, guide.title ASC;

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
ORDER BY is_pinned_venue_recommendation DESC, title ASC, id ASC
LIMIT sqlc.arg(page_limit)::integer
OFFSET sqlc.arg(page_offset)::integer;

-- name: ListPublicCityGuidesPaginated :many
SELECT guide.* FROM city_guides guide
JOIN city_guide_categories category_ref ON category_ref.id = guide.category_id
WHERE guide.deleted_at IS NULL
  AND category_ref.deleted_at IS NULL
  AND category_ref.is_active
  AND guide.category = COALESCE(NULLIF(sqlc.arg(category)::text, ''), guide.category)
  AND (
    NULLIF(sqlc.arg(search)::text, '') IS NULL
    OR guide.title ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.description, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.address, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR guide.category ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.contact_phone, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.whatsapp, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.email, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
  )
ORDER BY guide.is_pinned_venue_recommendation DESC, guide.title ASC, guide.id ASC
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

-- name: CountPublicCityGuides :one
SELECT COUNT(*) FROM city_guides guide
JOIN city_guide_categories category_ref ON category_ref.id = guide.category_id
WHERE guide.deleted_at IS NULL
  AND category_ref.deleted_at IS NULL
  AND category_ref.is_active
  AND guide.category = COALESCE(NULLIF(sqlc.arg(category)::text, ''), guide.category)
  AND (
    NULLIF(sqlc.arg(search)::text, '') IS NULL
    OR guide.title ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.description, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.address, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR guide.category ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.contact_phone, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.whatsapp, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
    OR COALESCE(guide.email, '') ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\'
  );

-- name: GetCityGuideByID :one
SELECT * FROM city_guides WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: GetPublicCityGuideByID :one
SELECT guide.* FROM city_guides guide
JOIN city_guide_categories category_ref ON category_ref.id = guide.category_id
WHERE guide.id = $1
  AND guide.deleted_at IS NULL
  AND category_ref.deleted_at IS NULL
  AND category_ref.is_active
LIMIT 1;

-- name: GetPinnedCityGuideForVenues :one
SELECT * FROM city_guides
WHERE is_pinned_venue_recommendation = TRUE
  AND deleted_at IS NULL
LIMIT 1;

-- name: ClearPinnedCityGuideForVenues :exec
UPDATE city_guides
SET is_pinned_venue_recommendation = FALSE,
    updated_at = NOW()
WHERE is_pinned_venue_recommendation = TRUE
  AND deleted_at IS NULL;

-- name: PinCityGuideForVenues :one
UPDATE city_guides
SET is_pinned_venue_recommendation = TRUE,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING *;

-- name: UpdateCityGuide :one
UPDATE city_guides
SET
  title = $2,
  category = $3,
  category_id = $4,
  description = NULLIF($5::text, ''),
  address = NULLIF($6::text, ''),
  image_url = NULLIF($7::text, ''),
  latitude = $8,
  longitude = $9,
  map_route_url = NULLIF($10::text, ''),
  contact_phone = NULLIF($11::text, ''),
  whatsapp = NULLIF($12::text, ''),
  email = NULLIF($13::text, ''),
  website_url = NULLIF($14::text, ''),
  instagram_url = NULLIF($15::text, ''),
  facebook_url = NULLIF($16::text, ''),
  tiktok_url = NULLIF($17::text, ''),
  service_types = $18,
  service_area = NULLIF($19::text, ''),
  operating_hours = NULLIF($20::text, ''),
  price_range = NULLIF($21::text, ''),
  fleet_types = $22,
  fleet_count = $23,
  updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: GetCityGuideCategoryByID :one
SELECT * FROM city_guide_categories WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: GetCityGuideCategoryByName :one
SELECT * FROM city_guide_categories WHERE LOWER(name) = LOWER($1) AND deleted_at IS NULL LIMIT 1;

-- name: CreateCityGuideCategory :one
INSERT INTO city_guide_categories(name, slug, description, created_by, updated_by)
VALUES ($1, $2, NULLIF($3::text, ''), NULLIF($4::text, ''), NULLIF($4::text, ''))
RETURNING *;

-- name: CountCityGuideCategories :one
SELECT COUNT(*) FROM city_guide_categories
WHERE deleted_at IS NULL
  AND (sqlc.arg(status)::text = '' OR (sqlc.arg(status)::text = 'active' AND is_active) OR (sqlc.arg(status)::text = 'inactive' AND NOT is_active))
  AND (sqlc.arg(search)::text = '' OR name ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\\' OR slug ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\\');

-- name: ListCityGuideCategories :many
SELECT category.*,
       (SELECT COUNT(*) FROM city_guides guide WHERE guide.category_id = category.id AND guide.deleted_at IS NULL)::bigint AS usage_count
FROM city_guide_categories category
WHERE category.deleted_at IS NULL
  AND (sqlc.arg(status)::text = '' OR (sqlc.arg(status)::text = 'active' AND category.is_active) OR (sqlc.arg(status)::text = 'inactive' AND NOT category.is_active))
  AND (sqlc.arg(search)::text = '' OR category.name ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\\' OR category.slug ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\\')
ORDER BY
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND sqlc.arg(sort_order)::text = 'desc' THEN LOWER(category.name) END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND sqlc.arg(sort_order)::text = 'asc' THEN category.created_at END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND sqlc.arg(sort_order)::text = 'desc' THEN category.created_at END DESC,
  LOWER(category.name) ASC, category.id ASC
LIMIT sqlc.arg(page_limit)::integer OFFSET sqlc.arg(page_offset)::integer;

-- name: ListPublicCityGuideCategories :many
SELECT category.*,
       (SELECT COUNT(*) FROM city_guides guide WHERE guide.category_id = category.id AND guide.deleted_at IS NULL)::bigint AS usage_count
FROM city_guide_categories category
WHERE category.deleted_at IS NULL AND category.is_active
  AND EXISTS (SELECT 1 FROM city_guides guide WHERE guide.category_id = category.id AND guide.deleted_at IS NULL)
ORDER BY LOWER(category.name), category.id;

-- name: UpdateCityGuideCategory :one
UPDATE city_guide_categories
SET name = $2, description = NULLIF($3::text, ''), updated_by = NULLIF($4::text, ''), updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL RETURNING *;

-- name: SetCityGuideCategoryStatus :one
UPDATE city_guide_categories
SET is_active = $2,
    deactivated_at = CASE WHEN $2 THEN NULL ELSE NOW() END,
    deactivated_by = CASE WHEN $2 THEN NULL ELSE NULLIF($3::text, '') END,
    deactivation_reason = CASE WHEN $2 THEN NULL ELSE NULLIF($4::text, '') END,
    updated_by = NULLIF($3::text, ''), updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL RETURNING *;

-- name: ArchiveCityGuideCategory :one
UPDATE city_guide_categories AS category
SET deleted_at = NOW(), deleted_by = NULLIF($2::text, ''), delete_reason = NULLIF($3::text, ''), updated_by = NULLIF($2::text, ''), updated_at = NOW()
WHERE category.id = $1 AND category.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM city_guides guide WHERE guide.category_id = category.id AND guide.deleted_at IS NULL)
RETURNING category.*;

-- name: RestoreCityGuideCategory :one
UPDATE city_guide_categories
SET deleted_at = NULL, deleted_by = NULL, delete_reason = NULL, updated_by = NULLIF($2::text, ''), updated_at = NOW()
WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *;

-- name: ListDeletedCityGuideCategories :many
SELECT category.*,
       (SELECT COUNT(*) FROM city_guides guide WHERE guide.category_id = category.id AND guide.deleted_at IS NULL)::bigint AS usage_count
FROM city_guide_categories category WHERE category.deleted_at IS NOT NULL ORDER BY category.deleted_at DESC;

-- name: CreateMedia :one
INSERT INTO media_assets (
  file_name, file_url, mime_type, file_size, checksum_sha256, width, height, uploaded_by
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING *;

-- name: GetMedia :many
SELECT * FROM media_assets
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- name: ListMediaPaginated :many
SELECT * FROM media_assets
WHERE deleted_at IS NULL
  AND (sqlc.arg(search)::text = '' OR file_name ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\')
ORDER BY
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND sqlc.arg(sort_order)::text = 'asc' THEN LOWER(file_name) END ASC,
  CASE WHEN sqlc.arg(sort_key)::text = 'name' AND sqlc.arg(sort_order)::text = 'desc' THEN LOWER(file_name) END DESC,
  CASE WHEN sqlc.arg(sort_key)::text = 'created_at' AND sqlc.arg(sort_order)::text = 'asc' THEN created_at END ASC,
  created_at DESC, id DESC
LIMIT sqlc.arg(page_limit) OFFSET sqlc.arg(page_offset);

-- name: CountMedia :one
SELECT COUNT(*) FROM media_assets
WHERE deleted_at IS NULL
  AND (sqlc.arg(search)::text = '' OR file_name ILIKE '%' || sqlc.arg(search)::text || '%' ESCAPE '\');

-- name: GetMediaStats :one
SELECT COUNT(*) AS total_items,
       COALESCE(SUM(file_size), 0)::bigint AS total_bytes,
       COUNT(DISTINCT mime_type) AS total_formats
FROM media_assets
WHERE deleted_at IS NULL;

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
