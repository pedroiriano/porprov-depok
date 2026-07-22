DROP INDEX IF EXISTS idx_match_participants_active_kontingen;
DROP INDEX IF EXISTS uq_match_participants_active_slot;

ALTER TABLE match_participants
    DROP CONSTRAINT IF EXISTS match_participants_identity_check,
    DROP CONSTRAINT IF EXISTS match_participants_slot_check,
    DROP CONSTRAINT IF EXISTS match_participants_type_check,
    DROP COLUMN IF EXISTS slot,
    DROP COLUMN IF EXISTS team_name,
    DROP COLUMN IF EXISTS participant_type;
