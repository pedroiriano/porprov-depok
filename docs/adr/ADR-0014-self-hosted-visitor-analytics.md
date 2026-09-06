# ADR-0014: Analytics Pengunjung Self-Hosted dengan Umami

- Status: Accepted
- Tanggal: 14 Agustus 2026
- Tahap: 2, 3, 4, 5, 9, dan 10

## Konteks

Prometheus/Grafana aktif hanya untuk kesehatan teknis dan belum memiliki grafik
pengunjung. Access log Nginx juga memuat bot, scanner, serta health check sehingga
tidak boleh dianggap sebagai visitor analytics.

## Keputusan

1. Umami `3.2.0` dijalankan self-hosted pada jaringan internal Compose dan
   memakai `umami_db` dengan role database terpisah.
2. Hanya `/analytics/porprov-insight.js` dan `/analytics/api/collect` yang
   diekspos same-origin melalui Nginx. Login, dashboard, dan API Umami tidak
   dibuka ke internet.
3. Tracker hanya berjalan untuk `porprov.depok.go.id`, menghormati Do Not Track,
   serta tidak mengirim query string, hash, distinct ID, atau data akun Admin.
4. API Gateway mengagregasi statistik Umami secara read-only. Endpoint
   `/api/v1/analytics/overview` wajib JWT dan role `super_admin` atau `auditor`.
5. Credential Umami hanya berada di environment server. Browser Admin menerima
   hasil statistik tersanitasi, bukan token atau credential Umami.
6. Public Web tetap berfungsi ketika Umami gagal; analytics bukan dependency
   rendering konten publik.

## Keamanan dan Privasi

- CSP nonce tetap dipakai tanpa menambahkan `script-src unsafe-inline`.
- Endpoint koleksi memakai rate limit, hanya menerima POST, dan tidak dicache.
- Telemetry/update check Umami dinonaktifkan agar data tetap lokal.
- Session replay, heatmap, dan identifikasi pengguna tidak diaktifkan.
- Retensi awal diusulkan 13 bulan dan wajib diselaraskan dengan kebijakan
  Diskominfo sebelum purge terjadwal diberlakukan.

## Konsekuensi

- Statistik baru tersedia sejak tracker diaktifkan; histori lama tidak dapat
  direkonstruksi secara akurat.
- Backup production bertambah satu database, `umami_db`.
- Bootstrap mengganti credential default dan membuat website ID tetap secara
  idempoten sebelum API Gateway mulai melayani analytics.
