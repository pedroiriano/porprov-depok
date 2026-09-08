-- CHANGE: Snapshot identitas menjaga histori audit tetap terbaca saat profil berubah.
ALTER TABLE audit_logs
    ADD COLUMN actor_username VARCHAR(100),
    ADD COLUMN actor_display_name VARCHAR(255),
    ADD COLUMN actor_kind VARCHAR(20) NOT NULL DEFAULT 'unknown';
CREATE INDEX idx_audit_logs_actor_username ON audit_logs(actor_username, created_at DESC);
