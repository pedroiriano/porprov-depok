-- name: CreateVenue :one
INSERT INTO venues (
    name, image_url, address, latitude, longitude, map_route_url, 
    city_guide_ids, cabor_ids, capacity, facilities, readiness_status, contact_person
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING *;

-- name: ListVenues :many
SELECT * FROM venues
ORDER BY name ASC;

-- name: GetVenueByID :one
SELECT * FROM venues WHERE id = $1 LIMIT 1;

-- name: UpdateVenue :one
UPDATE venues
SET 
    name = COALESCE(NULLIF($2::text, ''), name),
    image_url = COALESCE(NULLIF($3::text, ''), image_url),
    address = COALESCE(NULLIF($4::text, ''), address),
    latitude = COALESCE($5::decimal, latitude),
    longitude = COALESCE($6::decimal, longitude),
    map_route_url = COALESCE(NULLIF($7::text, ''), map_route_url),
    city_guide_ids = COALESCE($8::uuid[], city_guide_ids),
    cabor_ids = COALESCE($9::uuid[], cabor_ids),
    capacity = COALESCE($10::integer, capacity),
    facilities = COALESCE(NULLIF($11::text, ''), facilities),
    readiness_status = COALESCE(NULLIF($12::text, ''), readiness_status),
    contact_person = COALESCE(NULLIF($13::text, ''), contact_person),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteVenue :exec
DELETE FROM venues WHERE id = $1;
