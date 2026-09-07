# ADR-0015 — Otoritas UI Terpisah: Techwind Public dan Cuba Admin

- Status: **Accepted; license purchase verified, public-repository clean-room required**
- Tanggal: **6 September 2026**
- Pemilik: Tim PORPROV Depok

## Konteks

Governance v4 menetapkan Techwind untuk Public dan Admin. Arah produk baru mempertahankan Techwind 3.3.0 untuk pengalaman publik, tetapi menetapkan Cuba Admin Dashboard sebagai otoritas visual workspace operator. Admin aktif saat ini sudah berjalan dengan baseline Techwind dan tidak boleh diputus atau ditulis ulang sekaligus.

Folder upstream lokal ditemukan di `C:\Datas\Proyek\UI\techwind-pembelajaran\source` dan `C:\Datas\Proyek\UI\cuba-pembelajaran\template`. Pada 7 September 2026 pengguna memberikan tangkapan layar halaman ThemeForest untuk item Cuba oleh PixelStrap yang menyatakan satu lisensi dimiliki. Repository `pedroiriano/porprov-depok` terverifikasi publik, sehingga source/aset premium tidak boleh didistribusikan melalui Git.

## Keputusan

1. Public Web memakai Techwind 3.3.0 sebagai otoritas visual dan interaksi.
2. Admin Web memakai Cuba Admin Dashboard sebagai target otoritas visual dan interaksi.
3. Runtime hanya boleh bergantung pada source di root PORPROV. Path upstream eksternal bersifat read-only dan tidak boleh masuk build, Docker, test, atau konfigurasi deployment.
4. Pembelian satu lisensi untuk satu end product PORPROV dinyatakan terverifikasi; jenis lisensi dan purchase code tidak disimpan di repository.
5. Source/aset premium Cuba tidak boleh diimpor atau di-commit ke repository publik. Implementasi menggunakan kontrak visual dan komponen clean-room; upstream lokal tetap read-only dan bukan dependency runtime.
6. Migrasi Admin dilakukan bertahap di balik feature flag: token → shell → primitives → route representatif → regression gate → route tersisa.
7. Admin Techwind aktif dipertahankan sebagai baseline transisi dan rollback sampai parity fungsi, RBAC, aksesibilitas, visual QA, dan browser smoke Cuba lulus.
8. Global CSS/JavaScript Techwind dan Cuba tidak boleh dicampur. Implementasi menggunakan React/TypeScript dan thin PORPROV token layer.
9. Fidelity template berlaku pada hierarchy, component anatomy, layout, spacing, density, responsive behavior, dan interaction; brand/demo content/vendor identity diganti dengan identitas dan data PORPROV.

## Konsekuensi

- Governance berubah dari “tema tunggal seluruh produk” menjadi dua otoritas visual yang tegas per produk.
- Fitur Admin baru mengikuti kontrak Cuba, tetapi migrasi runtime belum dimulai oleh ADR ini.
- Visual regression lama Techwind tetap berguna sebagai bukti baseline, bukan sebagai acceptance target Cuba.
- Perubahan besar Admin memerlukan feature flag, representative route, dan rollback; big-bang rewrite dilarang.
- Lisensi memungkinkan satu end product sesuai ketentuan yang berlaku, tetapi tidak mengizinkan redistribusi item/source melalui repository publik.

## Gate Implementasi

- dependency pada path upstream, aset vendor, source vendor, brand, dan demo content di repository/runtime harus nol;
- provenance pembelian dicatat tanpa screenshot, data akun, atau purchase code;
- mapping pada `docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md` disetujui;
- token light/dark memenuhi WCAG 2.2 AA;
- shell, auth, routes, RBAC, API, persistence, dan audit tidak mengalami regresi;
- lint/typecheck/test/build serta QA 390/1440 light/dark dan browser smoke lulus;
- rollback ke baseline Admin aktif tersedia.
