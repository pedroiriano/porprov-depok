ALTER TABLE match_participants
    ADD COLUMN participant_type VARCHAR(20) NOT NULL DEFAULT 'contingent',
    ADD COLUMN team_name VARCHAR(150),
    ADD COLUMN slot SMALLINT NOT NULL DEFAULT 1;

UPDATE match_participants
SET participant_type = CASE
    WHEN NULLIF(BTRIM(athlete_name), '') IS NOT NULL THEN 'individual'
    ELSE 'contingent'
END;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY match_id ORDER BY created_at, id) AS participant_slot
    FROM match_participants
)
UPDATE match_participants AS participant
SET slot = ranked.participant_slot
FROM ranked
WHERE participant.id = ranked.id;

ALTER TABLE match_participants
    ADD CONSTRAINT match_participants_type_check
        CHECK (participant_type IN ('individual', 'team', 'contingent')),
    ADD CONSTRAINT match_participants_slot_check
        CHECK (slot BETWEEN 1 AND 64),
    ADD CONSTRAINT match_participants_identity_check
        CHECK (
            (participant_type = 'individual' AND NULLIF(BTRIM(athlete_name), '') IS NOT NULL AND NULLIF(BTRIM(team_name), '') IS NULL)
            OR (participant_type = 'team' AND NULLIF(BTRIM(team_name), '') IS NOT NULL AND NULLIF(BTRIM(athlete_name), '') IS NULL)
            OR (participant_type = 'contingent' AND NULLIF(BTRIM(athlete_name), '') IS NULL AND NULLIF(BTRIM(team_name), '') IS NULL)
        );

CREATE UNIQUE INDEX uq_match_participants_active_slot
    ON match_participants (match_id, slot)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_match_participants_active_kontingen
    ON match_participants (kontingen_id)
    WHERE deleted_at IS NULL;
