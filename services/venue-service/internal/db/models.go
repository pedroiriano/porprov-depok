package db

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type Venue struct {
	ID              pgtype.UUID        `json:"id"`
	Name            string             `json:"name"`
	ImageUrl        pgtype.Text        `json:"image_url"`
	Address         pgtype.Text        `json:"address"`
	Latitude        pgtype.Numeric     `json:"latitude"`
	Longitude       pgtype.Numeric     `json:"longitude"`
	MapRouteUrl     pgtype.Text        `json:"map_route_url"`
	CityGuideIds    []pgtype.UUID      `json:"city_guide_ids"`
	CaborIds        []pgtype.UUID      `json:"cabor_ids"`
	Capacity        pgtype.Int4        `json:"capacity"`
	Facilities      pgtype.Text        `json:"facilities"`
	ReadinessStatus pgtype.Text        `json:"readiness_status"`
	ContactPerson   pgtype.Text        `json:"contact_person"`
	CreatedAt       pgtype.Timestamptz `json:"created_at"`
	UpdatedAt       pgtype.Timestamptz `json:"updated_at"`
}
