package db

import (
	"context"
	"github.com/jackc/pgx/v5/pgtype"
)

type MediaAsset struct {
	ID        pgtype.UUID        `json:"id"`
	FileName  string             `json:"file_name"`
	FileUrl   string             `json:"file_url"`
	MimeType  pgtype.Text        `json:"mime_type"`
	FileSize  pgtype.Int4        `json:"file_size"`
	CreatedAt pgtype.Timestamptz `json:"created_at"`
}

type CreateMediaParams struct {
	FileName string      `json:"file_name"`
	FileUrl  string      `json:"file_url"`
	MimeType pgtype.Text `json:"mime_type"`
	FileSize pgtype.Int4 `json:"file_size"`
}

const createMedia = `-- name: CreateMedia :one
INSERT INTO media_assets (
  file_name, file_url, mime_type, file_size
) VALUES (
  $1, $2, $3, $4
)
RETURNING id, file_name, file_url, mime_type, file_size, created_at
`

func (q *Queries) CreateMedia(ctx context.Context, arg CreateMediaParams) (MediaAsset, error) {
	row := q.db.QueryRow(ctx, createMedia,
		arg.FileName,
		arg.FileUrl,
		arg.MimeType,
		arg.FileSize,
	)
	var i MediaAsset
	err := row.Scan(
		&i.ID,
		&i.FileName,
		&i.FileUrl,
		&i.MimeType,
		&i.FileSize,
		&i.CreatedAt,
	)
	return i, err
}

const getMedia = `-- name: GetMedia :many
SELECT id, file_name, file_url, mime_type, file_size, created_at FROM media_assets
ORDER BY created_at DESC
`

func (q *Queries) GetMedia(ctx context.Context) ([]MediaAsset, error) {
	rows, err := q.db.Query(ctx, getMedia)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []MediaAsset
	for rows.Next() {
		var i MediaAsset
		if err := rows.Scan(
			&i.ID,
			&i.FileName,
			&i.FileUrl,
			&i.MimeType,
			&i.FileSize,
			&i.CreatedAt,
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

const deleteMedia = `-- name: DeleteMedia :exec
DELETE FROM media_assets
WHERE id = $1
`

func (q *Queries) DeleteMedia(ctx context.Context, id pgtype.UUID) error {
	_, err := q.db.Exec(ctx, deleteMedia, id)
	return err
}
