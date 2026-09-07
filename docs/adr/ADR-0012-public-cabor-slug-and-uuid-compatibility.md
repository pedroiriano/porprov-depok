# ADR-0012: Slug Publik Cabor dan Kompatibilitas UUID

- Status: Accepted
- Tanggal: 13 Agustus 2026
- Tahap: 4 dan 10 - Public Web dan Deployment

## Konteks

Halaman detail Cabang Olahraga memakai UUID mentah pada URL publik. UUID tetap
diperlukan untuk relasi Master Data, Venue, Schedule, dan LiveScore, tetapi tidak
komunikatif bagi pengunjung.

## Keputusan

1. `cabors.id` tetap menjadi primary key dan referensi lintas service.
2. Master Data memiliki `slug` unik, lowercase, dan stabil ketika nama berubah.
3. Endpoint detail Cabor menerima UUID lama maupun slug melalui query
   parameterized setelah validasi identifier.
4. Tautan Public Web yang memiliki data Cabor menggunakan slug. Permintaan UUID
   lama menghasilkan permanent redirect HTTP 308 ke URL slug canonical.
5. Schedule/LiveScore boleh tetap membawa UUID; redirect menjaga kompatibilitas
   sampai read-model lintas domain menyediakan slug.

## Konsekuensi

- Bookmark lama tetap berfungsi dan URL baru lebih mudah dibaca.
- Tidak ada migrasi foreign key lintas service.
- Slug tidak otomatis mengikuti perubahan nama agar permalink stabil.
- Perubahan nama editorial, termasuk `Basketball` menjadi `Bola Basket`, berada
  di luar keputusan teknis ini dan memerlukan persetujuan pemilik data.

## Quality Gate

- Migration Master Data mencapai v10 dengan `dirty=false`.
- Semua Cabor aktif memiliki slug unik dan valid.
- Detail slug menghasilkan 200; URL UUID menghasilkan 308 ke slug yang benar.
- Identifier malformed menghasilkan 404 pada Public Web.
- Go test, lint/build Public Web, smoke HTTPS, health container, dan security
  header production harus lulus.
