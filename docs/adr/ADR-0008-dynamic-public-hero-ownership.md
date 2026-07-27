# ADR-0008 — Kepemilikan Konten Hero Dinamis

- Status: Accepted
- Tanggal: 27 Juli 2026

## Konteks

Hero Landing Page sebelumnya menyimpan judul, isi, dan gambar latar langsung di komponen Public Web. Pola tersebut memerlukan deployment frontend untuk setiap perubahan editorial dan tidak memakai Media Library canonical.

## Keputusan

1. Master Data Service menjadi pemilik data Hero karena domain ini sudah memiliki Media Library dan lifecycle konten umum.
2. Hero menyimpan `title`, `highlight_text` opsional, `description`, `background_image_url`, `is_active`, metadata actor/waktu, serta tombstone soft delete.
3. Hanya satu Hero aktif yang boleh ada. Aktivasi create/update menonaktifkan Hero aktif sebelumnya dalam statement database yang sama dan dijaga partial unique index.
4. Gambar baru dipilih dari Media Library dan referensi `/uploads/*` harus menunjuk metadata media aktif. Seed lama `/assets/images/*` hanya dipertahankan sebagai kompatibilitas awal.
5. Public Web hanya membaca `GET /api/v1/master-data/heroes/active` melalui API Gateway. Mutasi, daftar editorial, delete, tombstone, dan restore tetap membutuhkan JWT.
6. Public Web menyediakan fallback canonical saat Gateway belum siap agar Landing Page tidak gagal saat startup, tetapi data aktif database selalu diprioritaskan.
7. Delete Hero adalah soft delete. Restore memakai Recycle Bin dan dapat ditolak jika akan melanggar aturan satu Hero aktif.

## Konsekuensi

- Operator dapat mengubah Hero tanpa build ulang Public Web.
- Konten dan gambar mempunyai lifecycle, audit, serta restore yang konsisten dengan Master Data lain.
- Beranda menjadi dynamic server-rendered karena mengambil Hero aktif tanpa cache.
- Penghapusan Hero aktif dapat membuat sistem memakai fallback sampai Hero lain diaktifkan; Admin menampilkan status aktif/draft secara eksplisit.

## Quality Gate

- `go test ./...` untuk Master Data dan API Gateway.
- lint/build Admin Web.
- lint/build Public Web.
- migrasi Master Data v8 bersih dan endpoint aktif diuji melalui API Gateway.
