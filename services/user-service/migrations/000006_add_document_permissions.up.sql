-- SECURITY: Separate document permissions; only the existing Super Admin receives them by default.
INSERT INTO access_permissions(code,domain,action,name) VALUES
 ('document.view','document','view','Lihat dan unduh dokumen'),
 ('document.create','document','create','Unggah dokumen'),
 ('document.update','document','update','Ubah dokumen dan pulihkan riwayat'),
 ('document.archive','document','archive','Arsipkan dokumen'),
 ('document.restore','document','restore','Pulihkan arsip dokumen'),
 ('document.policy','document','policy','Atur jenis dan ukuran dokumen')
ON CONFLICT(code) DO NOTHING;
INSERT INTO access_role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM access_roles r JOIN access_permissions p ON p.domain='document'
WHERE r.slug='super_admin' ON CONFLICT DO NOTHING;
