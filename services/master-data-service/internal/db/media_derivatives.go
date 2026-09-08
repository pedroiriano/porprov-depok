package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type MediaDerivative struct {
	Variant        string `json:"variant"`
	FileURL        string `json:"file_url"`
	Width          int32  `json:"width"`
	Height         int32  `json:"height"`
	FileSize       int32  `json:"file_size"`
	ChecksumSHA256 string `json:"checksum_sha256"`
}

func (q *Queries) FindActiveMediaByChecksum(ctx context.Context, checksum string) (MediaAsset, error) {
	row := q.db.QueryRow(ctx, `SELECT id, file_name, file_url, mime_type, file_size, created_at, updated_at, deleted_at, deleted_by, delete_reason, checksum_sha256, width, height, uploaded_by FROM media_assets WHERE checksum_sha256 = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`, checksum)
	var item MediaAsset
	err := row.Scan(&item.ID, &item.FileName, &item.FileUrl, &item.MimeType, &item.FileSize, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt, &item.DeletedBy, &item.DeleteReason, &item.ChecksumSha256, &item.Width, &item.Height, &item.UploadedBy)
	return item, err
}

func (q *Queries) CreateMediaDerivative(ctx context.Context, mediaID pgtype.UUID, item MediaDerivative) error {
	_, err := q.db.Exec(ctx, `INSERT INTO media_derivatives (media_id, variant, file_url, width, height, file_size, checksum_sha256) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (media_id, variant) DO NOTHING`, mediaID, item.Variant, item.FileURL, item.Width, item.Height, item.FileSize, item.ChecksumSHA256)
	return err
}

func (q *Queries) ListMediaDerivatives(ctx context.Context, mediaID pgtype.UUID) ([]MediaDerivative, error) {
	rows, err := q.db.Query(ctx, `SELECT variant, file_url, width, height, file_size, checksum_sha256 FROM media_derivatives WHERE media_id = $1 ORDER BY variant`, mediaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]MediaDerivative, 0, 3)
	for rows.Next() {
		var item MediaDerivative
		if err := rows.Scan(&item.Variant, &item.FileURL, &item.Width, &item.Height, &item.FileSize, &item.ChecksumSHA256); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// DeleteNewMedia compensates a failed upload before the record is exposed to consumers.
func (q *Queries) DeleteNewMedia(ctx context.Context, mediaID pgtype.UUID) error {
	if _, err := q.db.Exec(ctx, `DELETE FROM media_derivatives WHERE media_id = $1`, mediaID); err != nil {
		return err
	}
	_, err := q.db.Exec(ctx, `DELETE FROM media_assets WHERE id = $1 AND created_at >= NOW() - INTERVAL '5 minutes'`, mediaID)
	return err
}
