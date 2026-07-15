ALTER TABLE medal_submissions
    ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS published_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

UPDATE medals SET gold = 0 WHERE gold IS NULL;
UPDATE medals SET silver = 0 WHERE silver IS NULL;
UPDATE medals SET bronze = 0 WHERE bronze IS NULL;

ALTER TABLE medals
    ALTER COLUMN gold SET NOT NULL,
    ALTER COLUMN silver SET NOT NULL,
    ALTER COLUMN bronze SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medals_non_negative') THEN
        ALTER TABLE medals ADD CONSTRAINT medals_non_negative CHECK (gold >= 0 AND silver >= 0 AND bronze >= 0);
    END IF;
END $$;
