-- SECURITY: Hak akses lokasi dipisahkan dari Data Utama agar Pengelola Lokasi tidak memperoleh mutasi lintas domain.
INSERT INTO access_permissions(code, domain, action, name) VALUES
    ('venue.view', 'venue', 'view', 'Lihat lokasi pertandingan'),
    ('venue.create', 'venue', 'create', 'Tambah lokasi pertandingan'),
    ('venue.update', 'venue', 'update', 'Ubah lokasi pertandingan'),
    ('venue.archive', 'venue', 'archive', 'Arsipkan lokasi pertandingan'),
    ('venue.restore', 'venue', 'restore', 'Pulihkan lokasi pertandingan'),
    ('venue.manage', 'venue', 'manage', 'Kelola lokasi pertandingan')
ON CONFLICT (code) DO NOTHING;

INSERT INTO access_role_permissions(role_id, permission_id)
SELECT role.id, permission.id
FROM access_roles role
JOIN access_permissions permission ON permission.domain = 'venue'
WHERE role.slug IN ('super_admin', 'admin_venue')
ON CONFLICT DO NOTHING;
