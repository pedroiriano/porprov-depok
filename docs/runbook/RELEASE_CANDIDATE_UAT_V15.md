# UAT Release Candidate Tahap 15

## Ruang lingkup dan batas

UAT dilakukan pada 10 September 2026 dari branch `codex/release-candidate-uat-v15` yang berbasis tepat pada `origin/main` commit `28a669f42efad23a8d9774687aae8249c255f941`. Seluruh fixture hanya dibuat pada Docker dan database lokal, lalu dikembalikan melalui snapshot. UAT tidak mengakses VPS, menjalankan migrasi production, atau mengubah data production; Git delivery baru diizinkan melalui tahap terpisah setelah seluruh gate lokal lulus.

## Snapshot dan rollback

- Snapshot: `C:\Datas\Proyek\Aplikasi\porprov-depok\.tmp\uat-v15-20260910T015545Z`
- Isi: sembilan database custom dump, volume `porprov-depok_master_data_uploads`, `porprov-depok_nats_data`, dan `porprov-depok_redis_data`.
- Artefak: 13 file, 212.538.450 byte.
- SHA-256 manifest: `d7e5054f29eb859c02136824440a515c84c6977e35cacd572f5dfae6a14921ef`.
- Validasi sebelum restore: 0 checksum gagal.
- RPO fixture: 0 detik terhadap baseline snapshot; seluruh perubahan UAT memang dibuang.
- RTO restore: 80,93 detik sampai 19 kontainer kembali `running` dan seluruh health check yang tersedia sehat.
- Verifikasi pasca-restore: sembilan database dapat dibaca, marker `uat15-` berjumlah 0, empat endpoint canonical merespons 200, dan 379 checksum file Media Library cocok exact.

Snapshot tidak dihapus dan tetap menjadi rollback lokal. Restore tidak menghapus volume, image, network, backup, atau resource proyek lain.

## Hasil UAT terisolasi

Harness lokal menghasilkan 19 pemeriksaan PASS dan 0 FAIL. Bukti mesin berada di `.tmp\uat-v15-execution-final2\uat-results.json` dan `.tmp\uat-v15-execution-final2\uat-summary.json`; folder `.tmp` tidak dilacak Git.

| Area | Hasil | Bukti ringkas |
|---|---|---|
| Sesi dan RBAC | PASS | `super_admin`, Pengelola Lokasi, koresponden, verifikator, dan auditor dapat masuk; akses positif/negatif Gateway menghasilkan 200/403 sesuai domain. |
| Media dan Hero | PASS | Unggah/baca Media serta alur Hero Admin → Master Data → Public terbukti. |
| Master Data | PASS | Cabor, nomor pertandingan, dua kontingen, kategori Panduan Kota dinamis, data Panduan Kota, dan pin utama mengalir ke projection Public. |
| Venue dan Jadwal | PASS | Pengelola Lokasi membuat Venue; Jadwal menyimpan tepat dua peserta A/B dengan jenis sama dan dapat dibaca kembali. |
| LiveScore | PASS | Revisi append-only, koreksi, projection Public, dan konflik konkurensi 201/409 terbukti. |
| Medali | PASS | Koresponden mengajukan, verifikator memverifikasi, `super_admin` memublikasikan, lalu projection Public terbarui. |
| Draf dan riwayat | PASS | Draf bertahan, konflik versi menghasilkan 409, audit CREATE/UPDATE tersedia, serta riwayat dapat dibaca. |
| Notifikasi | PASS | Notifikasi berscope penerima, jumlah dua, dan aksi tandai dibaca terbukti. |
| Soft delete/restore akun | PASS | Akun diarsipkan secara lunak, tetap terlacak, lalu dipulihkan. |
| Outbox dan realtime | PASS | Semua database domain dapat dibaca, pending outbox 0, SSE siap, dan event fixture diterima. |
| Error recovery | PASS | Payload tidak valid menghasilkan 422; akses anonim ke endpoint terproteksi menghasilkan 401. |
| Beban proporsional | PASS | 100 GET dengan concurrency 10, error 0, p95 batch sekitar 2,093 detik pada mesin lokal. |
| Reconnect | PASS | Restart hanya `porprov_realtime`; health kembali siap dalam 15,04 detik. |
| Peran kustom | PASS | Create, permission, perubahan status, arsip, dan pemulihan lulus; seluruh fixture kemudian di-rollback. |

## Temuan dan perbaikan source

1. User Service sebelumnya mengisi seluruh nama ke `firstName`, sehingga profil Keycloak lokal dapat menolak login akun fixture. Nama kini dipisah deterministik menjadi nama depan/belakang; nama tunggal diduplikasi hanya pada profil Keycloak tanpa mengubah `full_name` domain. Unit test dan alur login lintas peran lulus.
2. Transisi workflow Medali sebelumnya ambigu terhadap tipe parameter PostgreSQL pada ekspresi `CASE`, dan error commit tidak dibedakan. Parameter sekarang memakai cast eksplisit, error pra-commit/commit dicatat secara internal tanpa bocor ke client, dan alur PENDING → VERIFIED → OFFICIAL lulus end-to-end.

## UAT Peran kustom setelah otorisasi

Pengguna memberi otorisasi eksplisit pada 10 September 2026 untuk menambahkan `manage-realm` hanya kepada `service-account-porprov-backend-service` pada realm lokal `porprov`. Bootstrap client diperbarui secara idempotent dan mapping backend diverifikasi tetap tepat `manage-users`, `view-users`, serta `manage-realm`; klien Admin/mobile tidak menerima hak tersebut.

Harness terfokus membuktikan create Peran kustom 201, dua permission tersimpan, nonaktif/aktif 204, arsip/pemulihan 204, dan arsip akhir 204. Bukti berada di `.tmp\keycloak-manage-realm-20260910T050044Z\role-uat-result.json`. Snapshot pra-UAT berisi tiga dump database serta arsip NATS/Redis dengan manifest SHA-256 `7f417c948bf8513f647053e75b356a39c124bd2d86247c1c1ae8ec9c129f610d`. Setelah UAT, seluruh database/volume tersebut dipulihkan: role, binding admin sementara, audit fixture, dan realm role fixture masing-masing tersisa 0; mapping `manage-realm` backend tetap 1 sesuai baseline baru.

Penerimaan visual Public lulus secara representatif pada 390 px terang dan 1440 px gelap; tujuh rute utama juga lulus pada 768 px tanpa recovery/error page. Admin terautentikasi lulus secara representatif pada 390 px gelap dan 1440 px terang tanpa recovery/error page. Matriks visual lengkap tidak diulang karena frontend tidak berubah sejak gate Tahap 14; pengujian API per peran tetap lulus.

## Gate source final

| Gate | Hasil |
|---|---|
| Go regression | PASS — `go test ./...` pada 10 modul. |
| Admin Web | PASS — lint, pemeriksaan bahasa, pemeriksaan OpenAPI, TypeScript, dan production build. |
| Public Web | PASS — lint, TypeScript melalui Next build, dan production build. |
| Compose | PASS — gabungan `docker-compose.yml` dan `docker-compose.local.yml` valid menggunakan `.env` lokal yang tidak dilacak. |
| Bootstrap Keycloak | PASS — sintaks tiga script valid, bootstrap ulang idempotent, dan pemegang `manage-realm` hanya service account backend. |
| Secret/diff | PASS — scan file tracked dan `git diff --check`; koleksi Postman serta `infra/docker/.env` tetap ignored/untracked. |
| Runtime pasca-restore | PASS — 19 kontainer siap dan empat endpoint canonical 200. |

Audit dependency, CodeQL, dependency review, scan container, header, dan ZAP penuh tidak diulang karena dependency/frontend/edge tidak berubah sejak gate Tahap 14/PR #31; protected CI tetap menjadi otoritas saat Git delivery diizinkan.

## Kondisi berhenti

Tahap 15 lokal selesai dan persetujuan Git delivery terpisah menghasilkan commit implementasi `b832bd0`. Push, PR, protected CI, dan merge harus mengikuti gate Tahap 15.1; deploy, akses VPS, migrasi production, dan perubahan data production tetap dilarang.
