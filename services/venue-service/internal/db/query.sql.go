package db

import (
	"context"
	"github.com/jackc/pgx/v5/pgtype"
)

const createVenue = `-- name: CreateVenue :one
INSERT INTO venues (
    name, image_url, address, latitude, longitude, map_route_url, 
    city_guide_ids, cabor_ids, capacity, facilities, readiness_status, contact_person
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING id, name, image_url, address, latitude, longitude, map_route_url, city_guide_ids, cabor_ids, capacity, facilities, readiness_status, contact_person, created_at, updated_at
`

type CreateVenueParams struct {
	Name            string         `json:"name"`
	ImageUrl        pgtype.Text    `json:"image_url"`
	Address         pgtype.Text    `json:"address"`
	Latitude        pgtype.Numeric `json:"latitude"`
	Longitude       pgtype.Numeric `json:"longitude"`
	MapRouteUrl     pgtype.Text    `json:"map_route_url"`
	CityGuideIds    []pgtype.UUID  `json:"city_guide_ids"`
	CaborIds        []pgtype.UUID  `json:"cabor_ids"`
	Capacity        pgtype.Int4    `json:"capacity"`
	Facilities      pgtype.Text    `json:"facilities"`
	ReadinessStatus pgtype.Text    `json:"readiness_status"`
	ContactPerson   pgtype.Text    `json:"contact_person"`
}

func (q *Queries) CreateVenue(ctx context.Context, arg CreateVenueParams) (Venue, error) {
	row := q.db.QueryRow(ctx, createVenue,
		arg.Name,
		arg.ImageUrl,
		arg.Address,
		arg.Latitude,
		arg.Longitude,
		arg.MapRouteUrl,
		arg.CityGuideIds,
		arg.CaborIds,
		arg.Capacity,
		arg.Facilities,
		arg.ReadinessStatus,
		arg.ContactPerson,
	)
	var i Venue
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.ImageUrl,
		&i.Address,
		&i.Latitude,
		&i.Longitude,
		&i.MapRouteUrl,
		&i.CityGuideIds,
		&i.CaborIds,
		&i.Capacity,
		&i.Facilities,
		&i.ReadinessStatus,
		&i.ContactPerson,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const listVenues = `-- name: ListVenues :many
SELECT id, name, image_url, address, latitude, longitude, map_route_url, city_guide_ids, cabor_ids, capacity, facilities, readiness_status, contact_person, created_at, updated_at FROM venues
ORDER BY name ASC
`

func (q *Queries) ListVenues(ctx context.Context) ([]Venue, error) {
	rows, err := q.db.Query(ctx, listVenues)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []Venue
	for rows.Next() {
		var i Venue
		if err := rows.Scan(
			&i.ID,
			&i.Name,
			&i.ImageUrl,
			&i.Address,
			&i.Latitude,
			&i.Longitude,
			&i.MapRouteUrl,
			&i.CityGuideIds,
			&i.CaborIds,
			&i.Capacity,
			&i.Facilities,
			&i.ReadinessStatus,
			&i.ContactPerson,
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

const getVenueByID = `-- name: GetVenueByID :one
SELECT id, name, image_url, address, latitude, longitude, map_route_url, city_guide_ids, cabor_ids, capacity, facilities, readiness_status, contact_person, created_at, updated_at FROM venues WHERE id = $1 LIMIT 1
`

func (q *Queries) GetVenueByID(ctx context.Context, id pgtype.UUID) (Venue, error) {
	row := q.db.QueryRow(ctx, getVenueByID, id)
	var i Venue
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.ImageUrl,
		&i.Address,
		&i.Latitude,
		&i.Longitude,
		&i.MapRouteUrl,
		&i.CityGuideIds,
		&i.CaborIds,
		&i.Capacity,
		&i.Facilities,
		&i.ReadinessStatus,
		&i.ContactPerson,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const updateVenue = `-- name: UpdateVenue :one
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
RETURNING id, name, image_url, address, latitude, longitude, map_route_url, city_guide_ids, cabor_ids, capacity, facilities, readiness_status, contact_person, created_at, updated_at
`

type UpdateVenueParams struct {
	ID              pgtype.UUID    `json:"id"`
	Column2         string         `json:"column_2"`
	Column3         string         `json:"column_3"`
	Column4         string         `json:"column_4"`
	Column5         pgtype.Numeric `json:"column_5"`
	Column6         pgtype.Numeric `json:"column_6"`
	Column7         string         `json:"column_7"`
	Column8         []pgtype.UUID  `json:"column_8"`
	Column9         []pgtype.UUID  `json:"column_9"`
	Column10        pgtype.Int4    `json:"column_10"`
	Column11        string         `json:"column_11"`
	Column12        string         `json:"column_12"`
	Column13        string         `json:"column_13"`
}

func (q *Queries) UpdateVenue(ctx context.Context, arg UpdateVenueParams) (Venue, error) {
	row := q.db.QueryRow(ctx, updateVenue,
		arg.ID,
		arg.Column2,
		arg.Column3,
		arg.Column4,
		arg.Column5,
		arg.Column6,
		arg.Column7,
		arg.Column8,
		arg.Column9,
		arg.Column10,
		arg.Column11,
		arg.Column12,
		arg.Column13,
	)
	var i Venue
	err := row.Scan(
		&i.ID,
		&i.Name,
		&i.ImageUrl,
		&i.Address,
		&i.Latitude,
		&i.Longitude,
		&i.MapRouteUrl,
		&i.CityGuideIds,
		&i.CaborIds,
		&i.Capacity,
		&i.Facilities,
		&i.ReadinessStatus,
		&i.ContactPerson,
		&i.CreatedAt,
		&i.UpdatedAt,
	)
	return i, err
}

const deleteVenue = `-- name: DeleteVenue :exec
DELETE FROM venues WHERE id = $1
`

func (q *Queries) DeleteVenue(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteVenue, id)
	return err
}
