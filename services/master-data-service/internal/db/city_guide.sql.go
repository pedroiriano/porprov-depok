package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const createCityGuide = `-- name: CreateCityGuide :one
INSERT INTO city_guides (title, category, description, address, image_url)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, title, category, description, address, image_url, created_at, updated_at
`

type CreateCityGuideParams struct {
	Title       string      `json:"title"`
	Category    string      `json:"category"`
	Description pgtype.Text `json:"description"`
	Address     pgtype.Text `json:"address"`
	ImageUrl    pgtype.Text `json:"image_url"`
}

func (q *Queries) CreateCityGuide(ctx context.Context, arg CreateCityGuideParams) (CityGuide, error) {
	row := q.db.QueryRow(ctx, createCityGuide,
		arg.Title,
		arg.Category,
		arg.Description,
		arg.Address,
		arg.ImageUrl,
	)
	var i CityGuide
	err := row.Scan(
		&i.ID,
		&i.Title,
		&i.Category,
		&i.Description,
		&i.Address,
		&i.ImageUrl,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const deleteCityGuide = `-- name: DeleteCityGuide :exec
DELETE FROM city_guides WHERE id = $1
`

func (q *Queries) DeleteCityGuide(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteCityGuide, id)
	return err
}

const getCityGuideByID = `-- name: GetCityGuideByID :one
SELECT id, title, category, description, address, image_url, created_at, updated_at FROM city_guides WHERE id = $1 LIMIT 1
`

func (q *Queries) GetCityGuideByID(ctx context.Context, id pgtype.UUID) (CityGuide, error) {
	row := q.db.QueryRow(ctx, getCityGuideByID, id)
	var i CityGuide
	err := row.Scan(
		&i.ID,
		&i.Title,
		&i.Category,
		&i.Description,
		&i.Address,
		&i.ImageUrl,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const listCityGuides = `-- name: ListCityGuides :many
SELECT id, title, category, description, address, image_url, created_at, updated_at FROM city_guides
WHERE category = COALESCE(NULLIF($1::text, ''), category)
ORDER BY title ASC
`

func (q *Queries) ListCityGuides(ctx context.Context, category string) ([]CityGuide, error) {
	rows, err := q.db.Query(ctx, listCityGuides, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []CityGuide
	for rows.Next() {
		var i CityGuide
		if err := rows.Scan(
			&i.ID,
			&i.Title,
			&i.Category,
			&i.Description,
			&i.Address,
			&i.ImageUrl,
			&i.CreatedAt,
			&i.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, i)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

const updateCityGuide = `-- name: UpdateCityGuide :one
UPDATE city_guides
SET 
  title = COALESCE(NULLIF($2::text, ''), title),
  category = COALESCE(NULLIF($3::text, ''), category),
  description = COALESCE(NULLIF($4::text, ''), description),
  address = COALESCE(NULLIF($5::text, ''), address),
  image_url = COALESCE(NULLIF($6::text, ''), image_url),
  updated_at = NOW()
WHERE id = $1
RETURNING id, title, category, description, address, image_url, created_at, updated_at
`

type UpdateCityGuideParams struct {
	ID      pgtype.UUID `json:"id"`
	Column2 string      `json:"column_2"`
	Column3 string      `json:"column_3"`
	Column4 string      `json:"column_4"`
	Column5 string      `json:"column_5"`
	Column6 string      `json:"column_6"`
}

func (q *Queries) UpdateCityGuide(ctx context.Context, arg UpdateCityGuideParams) (CityGuide, error) {
	row := q.db.QueryRow(ctx, updateCityGuide,
		arg.ID,
		arg.Column2,
		arg.Column3,
		arg.Column4,
		arg.Column5,
		arg.Column6,
	)
	var i CityGuide
	err := row.Scan(
		&i.ID,
		&i.Title,
		&i.Category,
		&i.Description,
		&i.Address,
		&i.ImageUrl,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}
