# Remediasi VA ZAP High - 15 September 2026

## Ruang Lingkup

Laporan ZAP eksternal mencatat satu alert High `Path Traversal` (`CWE-22`) pada
`POST /analytics/api/collect`, parameter JSON `payload.title`, dengan nilai uji
`/collect`. Bukti respons pada laporan kosong dan tidak menunjukkan nama file,
isi file, stack trace, maupun operasi filesystem yang berhasil.

## Analisis Akar Masalah

Endpoint sebelumnya meneruskan payload browser langsung ke kolektor internal
Umami. Pada Umami 3.2.0, `title` diperlakukan sebagai judul halaman dan disimpan
sebagai metadata analitik; field tersebut tidak dipakai sebagai path filesystem.
Karena tidak ada eksploitasi file yang terbukti, klasifikasi ZAP merupakan
false positive secara teknis. Meskipun demikian, proxy langsung membuat boundary
validasi PORPROV kurang tegas dan memungkinkan input yang tidak sesuai kontrak
mencapai dependency internal.

## Kontrol Penutupan

1. Nginx meneruskan hanya endpoint koleksi exact ke API Gateway; panel dan API
   Umami lain tetap tidak dipublikasikan.
2. API Gateway mewajibkan POST JSON, Origin/hostname/website allowlist, body
   maksimal 16 KiB, tipe event yang dikenal, serta URL halaman tanpa query,
   fragmen, credential, atau traversal.
3. Judul halaman dibatasi 300 karakter, bebas karakter kontrol, dan menolak
   nilai path/traversal termasuk `/collect`, `../`, backslash, serta encoding
   berlapis.
4. Referrer hanya menerima HTTP(S), membuang query/fragmen, dan field JSON yang
   tidak dikenal ditolak.
5. Request ke Umami dibuat ulang dari field tervalidasi dengan timeout empat
   detik, header minimal, response JSON maksimal 16 KiB, dan error upstream
   tersanitasi. Body request tidak dicatat ke log.
6. Event `event`, `identify`, dan `performance` yang sah tetap diteruskan agar
   fungsi statistik pengunjung tidak berkurang.

## Bukti Verifikasi Lokal

- Unit/regression test seluruh API Gateway: PASS.
- `go vet ./...`: PASS.
- `govulncheck ./...`: PASS, tidak ada vulnerability reachable.
- Secret scan source tracked: PASS.
- Build image API Gateway dan Nginx lokal: PASS.
- `nginx -t`: PASS.
- Payload analitik normal melalui HTTPS lokal: `200`.
- Payload laporan dengan `title=/collect`: `400` dan tidak diteruskan ke Umami.

## Status Production 21 September 2026

- PR #46 meluluskan seluruh required check, CodeQL, dependency review, dan
  secret scan lalu digabung aman pada commit
  `ecbbb270bb7dd8e604654b26f7f71bfa68095bd9`.
- Percobaan pertama otomatis rollback karena probe memakai route legacy
  `/api/v1/master-data/sports` yang memang mengembalikan `405`; source, image,
  dan runtime awal terverifikasi pulih sebelum retry. Route kanonis `/cabors`
  tetap `200`.
- Retry dengan job ber-`flock` selesai `DONE` pada 21 September 2026
  00:11:29 UTC. Hanya API Gateway yang dibangun ulang dan API Gateway/Nginx
  yang direcreate; image Nginx tetap sama. Tidak ada migrasi, perubahan skema,
  data bisnis, konten, maupun volume. Satu event analitik sintetis tercatat
  untuk membuktikan jalur koleksi tetap menerima payload sah.
- Backup production baru berisi delapan dump database, arsip Media Library,
  konfigurasi, source bundle, dan penanda image rollback di
  `/home/diskominfo/porprov-backups/zap-analytics-high-20260921T001047Z`.
  Seluruh file lulus checksum; SHA-256 manifest adalah
  `300d1364a13548701f1bf6d6a76e864675b0ac656ab442f8d0bb5c08e4cf3f88`.
- Image API Gateway aktif `sha256:5c2c9b06c8c8f5c6341c9065206f244dc66ab616e93be76157239ffebf3d434f`;
  image Nginx aktif `sha256:e92e766289b73c06ad8ef346748956b41f71d789e267a19b02ec1b09c67ca8f9`.
  Rollback image/source sebelumnya tetap tersedia di backup dan tag lokal VPS.
- Verifikasi HTTPS: event valid `200`, `title=/collect` `400`, GET kolektor
  `403`, Origin asing `403`, panel Umami `404`; Public, Admin, Cabor, Panduan
  Kota, Hero, dan tracker tetap `200`. Sebanyak 19 kontainer berjalan tanpa
  status unhealthy/restart; `nginx -t` dan regression header keamanan PASS.
- ZAP baseline pasif dengan image lokal terpin memeriksa origin PORPROV saja:
  `0 FAIL`, `62 PASS`, `5 WARN`; laporan ber-checksum di
  `/home/diskominfo/porprov-va/zap-analytics-high-confirm-20260921T001409Z`
  (SHA-256 JSON
  `7f566b8c21c20bf34a3ba0b88c9a17f1425a0a036a0b77cb5579890f0dff8c6f`).
  Tidak ada alert High. Satu alert Medium SRI menunjuk lima preload gambar
  `/uploads/...` pada origin PORPROV sendiri, bukan script/link dari server
  eksternal yang dideskripsikan aturan scanner. Ini ditriase sebagai temuan
  terpisah dan belum ditutup formal; gambar/konten sengaja tidak diubah.

Scan pasif dan replay payload spesifik tidak menggantikan pentest aktif
terotentikasi yang terjadwal. Laporan PDF sumber tetap di luar repository.
