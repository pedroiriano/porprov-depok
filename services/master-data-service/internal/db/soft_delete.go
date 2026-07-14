package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

// INFO: DeletedRecord adalah representasi lintas entity untuk Recycle Bin Admin.
type DeletedRecord struct {
	EntityType   string             `json:"entity_type"`
	ID           pgtype.UUID        `json:"id"`
	DisplayName  string             `json:"display_name"`
	DeletedAt    pgtype.Timestamptz `json:"deleted_at"`
	DeletedBy    pgtype.Text        `json:"deleted_by"`
	DeleteReason pgtype.Text        `json:"delete_reason"`
}

type softDeleteEntityConfig struct {
	table         string
	displayColumn string
}

var softDeleteEntities = map[string]softDeleteEntityConfig{
	"cabor":         {table: "cabors", displayColumn: "name"},
	"nomor_tanding": {table: "nomor_tandings", displayColumn: "name"},
	"kontingen":     {table: "kontingens", displayColumn: "name"},
	"city_guide":    {table: "city_guides", displayColumn: "title"},
	"media":         {table: "media_assets", displayColumn: "file_name"},
}

func softDeleteEntity(entityType string) (softDeleteEntityConfig, error) {
	config, ok := softDeleteEntities[entityType]
	if !ok {
		return softDeleteEntityConfig{}, fmt.Errorf("unsupported soft-delete entity %q", entityType)
	}
	return config, nil
}

// INFO: SoftDeleteEntity bersifat idempotent. changed=false berarti record sudah berada di Recycle Bin.
func (q *Queries) SoftDeleteEntity(ctx context.Context, entityType string, id pgtype.UUID, actor, reason string) (record DeletedRecord, changed bool, err error) {
	config, err := softDeleteEntity(entityType)
	if err != nil {
		return record, false, err
	}
	statement := fmt.Sprintf(`
WITH changed AS (
    UPDATE %s
    SET deleted_at = NOW(), deleted_by = $2, delete_reason = $3, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, %s::text AS display_name, deleted_at, deleted_by, delete_reason
)
SELECT id, display_name, deleted_at, deleted_by, delete_reason, TRUE FROM changed
UNION ALL
SELECT id, %s::text, deleted_at, deleted_by, delete_reason, FALSE
FROM %s
WHERE id = $1 AND deleted_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM changed)
LIMIT 1`, config.table, config.displayColumn, config.displayColumn, config.table)

	record.EntityType = entityType
	err = q.db.QueryRow(ctx, statement, id, actor, reason).Scan(
		&record.ID,
		&record.DisplayName,
		&record.DeletedAt,
		&record.DeletedBy,
		&record.DeleteReason,
		&changed,
	)
	return record, changed, err
}

// INFO: RestoreEntity bersifat idempotent. Metadata tombstone sebelum restore dikembalikan untuk audit.
func (q *Queries) RestoreEntity(ctx context.Context, entityType string, id pgtype.UUID) (record DeletedRecord, changed bool, err error) {
	config, err := softDeleteEntity(entityType)
	if err != nil {
		return record, false, err
	}
	statement := fmt.Sprintf(`
WITH previous AS (
    SELECT id, %s::text AS display_name, deleted_at, deleted_by, delete_reason
    FROM %s
    WHERE id = $1
), restored AS (
    UPDATE %s
    SET deleted_at = NULL, deleted_by = NULL, delete_reason = NULL, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NOT NULL
    RETURNING id
)
SELECT previous.id, previous.display_name, previous.deleted_at, previous.deleted_by,
       previous.delete_reason, EXISTS(SELECT 1 FROM restored)
FROM previous`, config.displayColumn, config.table, config.table)

	record.EntityType = entityType
	err = q.db.QueryRow(ctx, statement, id).Scan(
		&record.ID,
		&record.DisplayName,
		&record.DeletedAt,
		&record.DeletedBy,
		&record.DeleteReason,
		&changed,
	)
	return record, changed, err
}

func (q *Queries) ListDeletedEntities(ctx context.Context) ([]DeletedRecord, error) {
	const statement = `
SELECT entity_type, id, display_name, deleted_at, deleted_by, delete_reason
FROM (
    SELECT 'cabor'::text AS entity_type, id, name::text AS display_name, deleted_at, deleted_by, delete_reason FROM cabors WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'nomor_tanding', id, name::text, deleted_at, deleted_by, delete_reason FROM nomor_tandings WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'kontingen', id, name::text, deleted_at, deleted_by, delete_reason FROM kontingens WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'city_guide', id, title::text, deleted_at, deleted_by, delete_reason FROM city_guides WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'media', id, file_name::text, deleted_at, deleted_by, delete_reason FROM media_assets WHERE deleted_at IS NOT NULL
) deleted
ORDER BY deleted_at DESC`
	rows, err := q.db.Query(ctx, statement)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := make([]DeletedRecord, 0)
	for rows.Next() {
		var record DeletedRecord
		if err := rows.Scan(&record.EntityType, &record.ID, &record.DisplayName, &record.DeletedAt, &record.DeletedBy, &record.DeleteReason); err != nil {
			return nil, err
		}
		records = append(records, record)
	}
	return records, rows.Err()
}

func (q *Queries) IsActiveMediaURL(ctx context.Context, fileURL string) (bool, error) {
	var exists bool
	err := q.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM media_assets WHERE file_url = $1 AND deleted_at IS NULL)`, fileURL).Scan(&exists)
	return exists, err
}

func (q *Queries) HasActiveNomorTandings(ctx context.Context, caborID pgtype.UUID) (bool, error) {
	var exists bool
	err := q.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM nomor_tandings WHERE cabor_id = $1 AND deleted_at IS NULL)`, caborID).Scan(&exists)
	return exists, err
}
