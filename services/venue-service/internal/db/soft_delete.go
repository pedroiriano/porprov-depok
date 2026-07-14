package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

type DeletedRecord struct {
	EntityType   string             `json:"entity_type"`
	ID           pgtype.UUID        `json:"id"`
	DisplayName  string             `json:"display_name"`
	DeletedAt    pgtype.Timestamptz `json:"deleted_at"`
	DeletedBy    pgtype.Text        `json:"deleted_by"`
	DeleteReason pgtype.Text        `json:"delete_reason"`
}

func (q *Queries) SoftDeleteVenue(ctx context.Context, id pgtype.UUID, actor, reason string) (record DeletedRecord, changed bool, err error) {
	const statement = `
WITH changed AS (
    UPDATE venues
    SET deleted_at = NOW(), deleted_by = $2, delete_reason = $3, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, name::text AS display_name, deleted_at, deleted_by, delete_reason
)
SELECT id, display_name, deleted_at, deleted_by, delete_reason, TRUE FROM changed
UNION ALL
SELECT id, name::text, deleted_at, deleted_by, delete_reason, FALSE
FROM venues
WHERE id = $1 AND deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM changed)
LIMIT 1`
	record.EntityType = "venue"
	err = q.db.QueryRow(ctx, statement, id, actor, reason).Scan(&record.ID, &record.DisplayName, &record.DeletedAt, &record.DeletedBy, &record.DeleteReason, &changed)
	return record, changed, err
}

func (q *Queries) RestoreVenue(ctx context.Context, id pgtype.UUID) (record DeletedRecord, changed bool, err error) {
	const statement = `
WITH previous AS (
    SELECT id, name::text AS display_name, deleted_at, deleted_by, delete_reason FROM venues WHERE id = $1
), restored AS (
    UPDATE venues SET deleted_at = NULL, deleted_by = NULL, delete_reason = NULL, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id
)
SELECT previous.id, previous.display_name, previous.deleted_at, previous.deleted_by,
       previous.delete_reason, EXISTS(SELECT 1 FROM restored)
FROM previous`
	record.EntityType = "venue"
	err = q.db.QueryRow(ctx, statement, id).Scan(&record.ID, &record.DisplayName, &record.DeletedAt, &record.DeletedBy, &record.DeleteReason, &changed)
	return record, changed, err
}

func (q *Queries) ListDeletedVenues(ctx context.Context) ([]DeletedRecord, error) {
	rows, err := q.db.Query(ctx, `SELECT id, name::text, deleted_at, deleted_by, delete_reason FROM venues WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	records := make([]DeletedRecord, 0)
	for rows.Next() {
		record := DeletedRecord{EntityType: "venue"}
		if err := rows.Scan(&record.ID, &record.DisplayName, &record.DeletedAt, &record.DeletedBy, &record.DeleteReason); err != nil {
			return nil, err
		}
		records = append(records, record)
	}
	return records, rows.Err()
}
