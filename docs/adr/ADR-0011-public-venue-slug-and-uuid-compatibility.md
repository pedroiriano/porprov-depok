# ADR-0011: Slug Publik Venue dan Kompatibilitas UUID

- Status: Accepted
- Tanggal: 13 Agustus 2026
- Tahap: 4 dan 10 - Public Web dan Deployment

## Konteks

Halaman detail Venue sebelumnya menampilkan UUID mentah pada URL publik. UUID
tetap diperlukan sebagai identitas stabil untuk relasi lintas service, tetapi
tidak komunikatif bagi pengunjung dan kurang baik untuk keterbacaan URL.

## Keputusan

1. `venues.id` tetap menjadi primary key dan referensi lintas service.
2. Venue Service memiliki `slug` unik, lowercase, dan tidak berubah saat nama
   diperbarui. Migration mengisi data lama secara deterministik dan menambahkan
   suffix UUID pendek hanya ketika terjadi benturan.
3. Endpoint detail menerima UUID lama maupun slug. Validasi identifier dilakukan
   sebelum query parameterized mencapai database.
4. Public Web membentuk tautan baru dengan slug. Permintaan detail memakai UUID
   lama menghasilkan permanent redirect HTTP 308 menuju URL slug canonical.
5. Tombstone tetap tidak dapat dibaca melalui UUID maupun slug; soft delete dan
   seluruh relasi internal tidak berubah.

## Konsekuensi

- Bookmark, Jadwal, dan LiveScore lama yang masih menyimpan UUID tetap berfungsi.
- URL Venue baru lebih mudah dibaca tanpa migrasi foreign key lintas service.
- Slug tidak otomatis berubah mengikuti nama agar permalink tetap stabil.
- Perubahan slug manual tidak dibuka pada Admin; kebijakan alias/rename dapat
  ditambahkan kemudian bila kebutuhan editorial muncul.

## Quality Gate

- Migration Venue mencapai v3 dengan status `dirty=false`.
- Semua Venue aktif mempunyai slug unik dan sesuai format.
- GET detail melalui slug dan UUID mengembalikan record yang sama.
- URL UUID Public menghasilkan 308 ke URL slug dan URL slug menghasilkan 200.
- Go test, Public Web lint/build, smoke HTTPS, header keamanan, dan health
  container production harus lulus.
