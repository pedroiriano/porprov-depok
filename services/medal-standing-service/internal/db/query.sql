-- name: AddMedal :one
INSERT INTO medals (kontingen_id, gold, silver, bronze)
VALUES ($1, $2, $3, $4)
ON CONFLICT (kontingen_id) DO UPDATE
SET 
  gold = medals.gold + EXCLUDED.gold,
  silver = medals.silver + EXCLUDED.silver,
  bronze = medals.bronze + EXCLUDED.bronze,
  updated_at = NOW()
RETURNING *;

-- name: GetMedalStandings :many
SELECT * FROM medals
ORDER BY gold DESC, silver DESC, bronze DESC;
