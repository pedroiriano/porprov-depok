DROP TRIGGER IF EXISTS livescore_revisions_immutable ON livescore_revisions;
DROP FUNCTION IF EXISTS prevent_livescore_revision_mutation();
DROP TABLE IF EXISTS outbox_events;
DROP TABLE IF EXISTS livescore_current;
DROP TABLE IF EXISTS livescore_revisions;
