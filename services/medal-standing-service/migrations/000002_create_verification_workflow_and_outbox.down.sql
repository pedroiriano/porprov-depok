DROP TRIGGER IF EXISTS medal_submission_history_immutable ON medal_submission_history;
DROP FUNCTION IF EXISTS prevent_medal_history_mutation();
DROP TABLE IF EXISTS outbox_events;
DROP TABLE IF EXISTS medal_submission_history;
DROP TABLE IF EXISTS medal_submissions;
