-- CHANGE: Status operasional akun dipisahkan dari arsip soft delete.
ALTER TABLE users
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN status_changed_at TIMESTAMPTZ,
    ADD COLUMN status_changed_by VARCHAR(255),
    ADD COLUMN status_reason TEXT;

CREATE INDEX idx_users_lifecycle ON users(deleted_at, is_active, created_at DESC);

-- SECURITY: Slug peran tetap sama dengan realm role Keycloak agar assignment konsisten.
CREATE TABLE access_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deactivated_at TIMESTAMPTZ,
    deactivated_by VARCHAR(255),
    deactivation_reason TEXT,
    deleted_at TIMESTAMPTZ,
    deleted_by VARCHAR(255),
    delete_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_access_roles_slug ON access_roles(LOWER(slug));
CREATE UNIQUE INDEX uq_access_roles_active_name ON access_roles(LOWER(name)) WHERE deleted_at IS NULL;

CREATE TABLE access_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(120) UNIQUE NOT NULL,
    domain VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    name VARCHAR(140) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE access_role_permissions (
    role_id UUID NOT NULL REFERENCES access_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES access_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

INSERT INTO access_roles(slug, name, description, is_system)
VALUES
    ('super_admin', 'Pengelola Utama', 'Mengelola seluruh fungsi Admin PORPROV.', TRUE),
    ('admin_venue', 'Pengelola Lokasi', 'Mengelola informasi lokasi pertandingan.', TRUE),
    ('koresponden', 'Koresponden', 'Memperbarui skor dan mengajukan perolehan medali.', TRUE),
    ('verifikator', 'Verifikator', 'Memeriksa pengajuan operasional.', TRUE),
    ('auditor', 'Auditor', 'Membaca catatan audit dan kesehatan integrasi.', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO access_permissions(code, domain, action, name) VALUES
    ('dashboard.view', 'dashboard', 'view', 'Lihat dasbor'),
    ('master_data.view', 'master_data', 'view', 'Lihat data utama'),
    ('master_data.create', 'master_data', 'create', 'Tambah data utama'),
    ('master_data.update', 'master_data', 'update', 'Ubah data utama'),
    ('master_data.archive', 'master_data', 'archive', 'Arsipkan data utama'),
    ('master_data.restore', 'master_data', 'restore', 'Pulihkan data utama'),
    ('master_data.manage', 'master_data', 'manage', 'Kelola data utama'),
    ('city_guide.view', 'city_guide', 'view', 'Lihat Panduan Kota'),
    ('city_guide.create', 'city_guide', 'create', 'Tambah Panduan Kota'),
    ('city_guide.update', 'city_guide', 'update', 'Ubah Panduan Kota'),
    ('city_guide.archive', 'city_guide', 'archive', 'Arsipkan Panduan Kota'),
    ('city_guide.restore', 'city_guide', 'restore', 'Pulihkan Panduan Kota'),
    ('city_guide.manage', 'city_guide', 'manage', 'Kelola Panduan Kota'),
    ('media.view', 'media', 'view', 'Lihat Pustaka Media'),
    ('media.create', 'media', 'create', 'Unggah media'),
    ('media.archive', 'media', 'archive', 'Arsipkan media'),
    ('media.restore', 'media', 'restore', 'Pulihkan media'),
    ('media.manage', 'media', 'manage', 'Kelola Pustaka Media'),
    ('livescore.view', 'livescore', 'view', 'Lihat pusat skor'),
    ('livescore.manage', 'livescore', 'manage', 'Kelola skor'),
    ('medal.view', 'medal', 'view', 'Lihat perolehan medali'),
    ('medal.create', 'medal', 'create', 'Ajukan perolehan medali'),
    ('medal.verify', 'medal', 'verify', 'Verifikasi perolehan medali'),
    ('medal.publish', 'medal', 'publish', 'Publikasikan perolehan medali'),
    ('audit.view', 'audit', 'view', 'Lihat log audit'),
    ('audit.export', 'audit', 'export', 'Ekspor log audit'),
    ('integration.view', 'integration', 'view', 'Lihat kesehatan integrasi'),
    ('user.view', 'user', 'view', 'Lihat akun'),
    ('user.create', 'user', 'create', 'Tambah akun'),
    ('user.update', 'user', 'update', 'Ubah akun'),
    ('user.status', 'user', 'status', 'Ubah status akun'),
    ('user.archive', 'user', 'archive', 'Arsipkan akun'),
    ('user.restore', 'user', 'restore', 'Pulihkan akun'),
    ('user.manage', 'user', 'manage', 'Kelola akun'),
    ('role.view', 'role', 'view', 'Lihat peran dan hak akses'),
    ('role.create', 'role', 'create', 'Tambah peran'),
    ('role.update', 'role', 'update', 'Ubah peran'),
    ('role.status', 'role', 'status', 'Ubah status peran'),
    ('role.archive', 'role', 'archive', 'Arsipkan peran'),
    ('role.restore', 'role', 'restore', 'Pulihkan peran'),
    ('role.manage', 'role', 'manage', 'Kelola peran dan hak akses'),
    ('notification.view', 'notification', 'view', 'Lihat notifikasi')
ON CONFLICT (code) DO NOTHING;

-- SECURITY: Pengelola Utama mendapat seluruh izin; peran lain hanya izin sesuai tugas.
INSERT INTO access_role_permissions(role_id, permission_id)
SELECT role.id, permission.id FROM access_roles role CROSS JOIN access_permissions permission
WHERE role.slug = 'super_admin' ON CONFLICT DO NOTHING;
INSERT INTO access_role_permissions(role_id, permission_id)
SELECT role.id, permission.id FROM access_roles role JOIN access_permissions permission ON permission.code IN ('dashboard.view','master_data.view','city_guide.view')
WHERE role.slug = 'admin_venue' ON CONFLICT DO NOTHING;
INSERT INTO access_role_permissions(role_id, permission_id)
SELECT role.id, permission.id FROM access_roles role JOIN access_permissions permission ON permission.code IN ('dashboard.view','livescore.view','livescore.manage','medal.view','medal.create','notification.view')
WHERE role.slug = 'koresponden' ON CONFLICT DO NOTHING;
INSERT INTO access_role_permissions(role_id, permission_id)
SELECT role.id, permission.id FROM access_roles role JOIN access_permissions permission ON permission.code IN ('dashboard.view','medal.view','medal.verify','notification.view')
WHERE role.slug = 'verifikator' ON CONFLICT DO NOTHING;
INSERT INTO access_role_permissions(role_id, permission_id)
SELECT role.id, permission.id FROM access_roles role JOIN access_permissions permission ON permission.code IN ('dashboard.view','audit.view','integration.view','notification.view')
WHERE role.slug = 'auditor' ON CONFLICT DO NOTHING;

CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_keycloak_id VARCHAR(255) NOT NULL,
    notification_key VARCHAR(180) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(300) NOT NULL,
    target_path VARCHAR(255),
    expires_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recipient_keycloak_id, notification_key)
);
CREATE INDEX idx_user_notifications_recipient
    ON user_notifications(recipient_keycloak_id, read_at, created_at DESC);
