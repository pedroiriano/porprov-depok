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

func (q *Queries) SoftDeleteMatch(ctx context.Context, id pgtype.UUID, actor, reason string) (record DeletedRecord, changed bool, err error) {
	const statement = `
WITH changed AS (
    UPDATE matches
    SET deleted_at = NOW(), deleted_by = $2, delete_reason = $3, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, CONCAT(round, ' — ', TO_CHAR(match_date, 'DD Mon YYYY HH24:MI')) AS display_name, deleted_at, deleted_by, delete_reason
)
SELECT id, display_name, deleted_at, deleted_by, delete_reason, TRUE FROM changed
UNION ALL
SELECT id, CONCAT(round, ' — ', TO_CHAR(match_date, 'DD Mon YYYY HH24:MI')), deleted_at, deleted_by, delete_reason, FALSE
FROM matches
WHERE id = $1 AND deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM changed)
LIMIT 1`
	record.EntityType = "match"
	err = q.db.QueryRow(ctx, statement, id, actor, reason).Scan(&record.ID, &record.DisplayName, &record.DeletedAt, &record.DeletedBy, &record.DeleteReason, &changed)
	return record, changed, err
}

func (q *Queries) RestoreMatch(ctx context.Context, id pgtype.UUID) (record DeletedRecord, changed bool, err error) {
	const statement = `
WITH previous AS (
    SELECT id, CONCAT(round, ' — ', TO_CHAR(match_date, 'DD Mon YYYY HH24:MI')) AS display_name, deleted_at, deleted_by, delete_reason
    FROM matches WHERE id = $1
), restored AS (
    UPDATE matches SET deleted_at = NULL, deleted_by = NULL, delete_reason = NULL, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id
)
SELECT previous.id, previous.display_name, previous.deleted_at, previous.deleted_by,
       previous.delete_reason, EXISTS(SELECT 1 FROM restored)
FROM previous`
	record.EntityType = "match"
	err = q.db.QueryRow(ctx, statement, id).Scan(&record.ID, &record.DisplayName, &record.DeletedAt, &record.DeletedBy, &record.DeleteReason, &changed)
	return record, changed, err
}

func (q *Queries) ListDeletedMatches(ctx context.Context) ([]DeletedRecord, error) {
	const statement = `SELECT id, CONCAT(round, ' — ', TO_CHAR(match_date, 'DD Mon YYYY HH24:MI')), deleted_at, deleted_by, delete_reason FROM matches WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
	rows, err := q.db.Query(ctx, statement)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	records := make([]DeletedRecord, 0)
	for rows.Next() {
		record := DeletedRecord{EntityType: "match"}
		if err := rows.Scan(&record.ID, &record.DisplayName, &record.DeletedAt, &record.DeletedBy, &record.DeleteReason); err != nil {
			return nil, err
		}
		records = append(records, record)
	}
	return records, rows.Err()
}

func (q *Queries) HasActiveMatchForVenue(ctx context.Context, id pgtype.UUID) (bool, error) {
	var exists bool
	err := q.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM matches WHERE venue_id = $1 AND deleted_at IS NULL)`, id).Scan(&exists)
	return exists, err
}

func (q *Queries) HasActiveMatchForNomorTanding(ctx context.Context, id pgtype.UUID) (bool, error) {
	var exists bool
	err := q.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM matches WHERE nomor_tanding_id = $1 AND deleted_at IS NULL)`, id).Scan(&exists)
	return exists, err
}

func (q *Queries) GetMatchReferencesIncludingDeleted(ctx context.Context, id pgtype.UUID) (nomorTandingID, venueID pgtype.UUID, err error) {
	err = q.db.QueryRow(ctx, `SELECT nomor_tanding_id, venue_id FROM matches WHERE id = $1`, id).Scan(&nomorTandingID, &venueID)
	return nomorTandingID, venueID, err
}
