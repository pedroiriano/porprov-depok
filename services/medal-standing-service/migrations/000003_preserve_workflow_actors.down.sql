ALTER TABLE medals DROP CONSTRAINT IF EXISTS medals_non_negative;
ALTER TABLE medal_submissions
    DROP COLUMN IF EXISTS rejected_at,
    DROP COLUMN IF EXISTS published_by,
    DROP COLUMN IF EXISTS rejected_by;
