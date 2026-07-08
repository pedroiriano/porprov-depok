-- name: CreateVenue :one
INSERT INTO venues (name, address, capacity, city)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListVenues :many
SELECT * FROM venues
WHERE city = COALESCE(NULLIF($1::text, ''), city)
ORDER BY name ASC;

-- name: CreateMatch :one
INSERT INTO matches (nomor_tanding_id, venue_id, match_date, status, round)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListMatches :many
SELECT * FROM matches
ORDER BY match_date ASC;

-- name: AddMatchParticipant :one
INSERT INTO match_participants (match_id, kontingen_id, athlete_name)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListMatchParticipants :many
SELECT * FROM match_participants
WHERE match_id = $1;

-- name: GetVenueByID :one
SELECT * FROM venues WHERE id = $1 LIMIT 1;

-- name: UpdateVenue :one
UPDATE venues
SET 
  name = COALESCE(NULLIF($2::text, ''), name),
  address = COALESCE(NULLIF($3::text, ''), address),
  capacity = COALESCE(NULLIF($4::int, 0), capacity),
  city = COALESCE(NULLIF($5::text, ''), city),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteVenue :exec
DELETE FROM venues WHERE id = $1;

-- name: GetMatchByID :one
SELECT * FROM matches WHERE id = $1 LIMIT 1;

-- name: UpdateMatch :one
UPDATE matches
SET 
  nomor_tanding_id = COALESCE(NULLIF($2::uuid, '00000000-0000-0000-0000-000000000000'::uuid), nomor_tanding_id),
  venue_id = COALESCE(NULLIF($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid), venue_id),
  match_date = COALESCE(NULLIF($4::timestamptz, '0001-01-01 00:00:00Z'::timestamptz), match_date),
  status = COALESCE(NULLIF($5::text, ''), status),
  round = COALESCE(NULLIF($6::text, ''), round),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteMatch :exec
DELETE FROM matches WHERE id = $1;
