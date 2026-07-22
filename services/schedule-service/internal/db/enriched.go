package db

import "context"

// INFO: ListAllActiveMatchParticipants menyediakan batch read untuk projection
// jadwal publik sehingga handler tidak melakukan query peserta per pertandingan.
func (q *Queries) ListAllActiveMatchParticipants(ctx context.Context) ([]MatchParticipant, error) {
	rows, err := q.db.Query(ctx, `
		SELECT id, match_id, kontingen_id, athlete_name, created_at, updated_at,
		       deleted_at, deleted_by, delete_reason, participant_type, team_name, slot
		FROM match_participants
		WHERE deleted_at IS NULL
		ORDER BY match_id ASC, slot ASC, created_at ASC, id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]MatchParticipant, 0)
	for rows.Next() {
		var item MatchParticipant
		if err := rows.Scan(
			&item.ID,
			&item.MatchID,
			&item.KontingenID,
			&item.AthleteName,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.DeletedAt,
			&item.DeletedBy,
			&item.DeleteReason,
			&item.ParticipantType,
			&item.TeamName,
			&item.Slot,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
