# ADR-0015 — Otoritas UI Terpisah: Techwind Public dan Cuba Admin

- Status: **Accepted with implementation gate**
- Tanggal: **6 September 2026**
- Pemilik: Tim PORPROV Depok

## Konteks

Governance v4 menetapkan Techwind untuk Public dan Admin. Arah produk baru mempertahankan Techwind 3.3.0 untuk pengalaman publik, tetapi menetapkan Cuba Admin Dashboard sebagai otoritas visual workspace operator. Admin aktif saat ini sudah berjalan dengan baseline Techwind dan tidak boleh diputus atau ditulis ulang sekaligus.

Folder upstream lokal ditemukan di `C:\Datas\Proyek\UI\techwind-pembelajaran\source` dan `C:\Datas\Proyek\UI\cuba-pembelajaran\template`. Bukti lisensi template yang dapat diverifikasi belum ditemukan pada audit 6 September 2026; hanya lisensi dependency Remix Icon ditemukan pada source Techwind.

## Keputusan

1. Public Web memakai Techwind 3.3.0 sebagai otoritas visual dan interaksi.
2. Admin Web memakai Cuba Admin Dashboard sebagai target otoritas visual dan interaksi.
3. Runtime hanya boleh bergantung pada source di root PORPROV. Path upstream eksternal bersifat read-only dan tidak boleh masuk build, Docker, test, atau konfigurasi deployment.
4. Penyalinan/redistribusi vendor dan implementasi Cuba berstatus `BLOCKED_LICENSE_EVIDENCE` sampai bukti lisensi kedua template diverifikasi dan dicatat.
5. Setelah gate lisensi lulus, snapshot minimal Cuba diimpor ke target `theme-reference/Cuba/template/` dengan versi dan checksum; folder ini tetap referensi read-only, bukan runtime HTML/Gulp.
6. Migrasi Admin dilakukan bertahap di balik feature flag: token → shell → primitives → route representatif → regression gate → route tersisa.
7. Admin Techwind aktif dipertahankan sebagai baseline transisi dan rollback sampai parity fungsi, RBAC, aksesibilitas, visual QA, dan browser smoke Cuba lulus.
8. Global CSS/JavaScript Techwind dan Cuba tidak boleh dicampur. Implementasi menggunakan React/TypeScript dan thin PORPROV token layer.
9. Fidelity template berlaku pada hierarchy, component anatomy, layout, spacing, density, responsive behavior, dan interaction; brand/demo content/vendor identity diganti dengan identitas dan data PORPROV.

## Konsekuensi

- Governance berubah dari “tema tunggal seluruh produk” menjadi dua otoritas visual yang tegas per produk.
- Fitur Admin baru mengikuti kontrak Cuba, tetapi migrasi runtime belum dimulai oleh ADR ini.
- Visual regression lama Techwind tetap berguna sebagai bukti baseline, bukan sebagai acceptance target Cuba.
- Perubahan besar Admin memerlukan feature flag, representative route, dan rollback; big-bang rewrite dilarang.
- Lisensi adalah blocker formal, bukan catatan opsional.

## Gate Implementasi

- bukti lisensi sah dan hak penggunaan/redistribusi internal terdokumentasi;
- snapshot vendor lokal di root memiliki checksum dan tidak diubah;
- mapping pada `docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md` disetujui;
- token light/dark memenuhi WCAG 2.2 AA;
- shell, auth, routes, RBAC, API, persistence, dan audit tidak mengalami regresi;
- lint/typecheck/test/build serta QA 390/1440 light/dark dan browser smoke lulus;
- rollback ke baseline Admin aktif tersedia.
