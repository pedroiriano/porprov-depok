# Web Admin Enterprise — Penerimaan Tahap 12

## Ruang Lingkup

Tahap 12 mencakup kategori Panduan Kota dinamis, status akun terpisah dari
arsip, Peran dan Hak Akses, identitas aktor audit, grafik ApexCharts, unggah
seret-dan-lepas, notifikasi nyata, sidebar responsif, dan pelindung kegagalan
render agar layar putih berubah menjadi pesan pemulihan yang dapat ditindaklanjuti.

## Kontrak Penerimaan

| Area | Bukti yang diwajibkan |
|---|---|
| Kategori | Nama unik tanpa membedakan kapital, slug stabil, urutan/status, soft delete/restore/history, kategori tidak aktif tersembunyi dari publik |
| Akun | Filter aktif/tidak aktif/arsip, perubahan status bukan delete, proteksi akun sendiri dan Pengelola Utama terakhir, sinkronisasi Keycloak dengan rollback |
| Peran | Katalog granular, peran sistem terlindungi, peran khusus dapat dikelola, permission diperiksa di UI dan API |
| Audit | Nama pengguna/nama tampilan menjadi identitas utama; ID teknis hanya rincian; snapshot kejadian tidak berubah |
| Notifikasi | Hanya milik penerima, jumlah belum dibaca akurat, baca satu/semua idempoten, kunci duplikat ditolak |
| Grafik | Pembungkus ApexCharts resmi, lazy-load, tema terang/gelap, resize, reduced motion, empty/error state |
| Unggah | Drag-and-drop dan keyboard, preview, progres, batal/coba lagi, batas satu gambar, validasi server maksimal 3 MiB |
| Sidebar | Desktop diciutkan, mobile overlay, klik luar/Escape menutup, fokus dan status aktif dapat dibaca alat bantu |
| Ketahanan | Error boundary menampilkan pesan Bahasa Indonesia dan tindakan muat ulang; tidak ada layar putih diam-diam |

## Migrasi Lokal dan Backup

Backup awal berada di
`C:\Datas\Proyek\Aplikasi\porprov-depok\.tmp\tahap12-runtime-backup-20260908T152404`.
Dump `audit_service_db`, `master_data_db`, dan `user_service_db` telah divalidasi
dengan `pg_restore --list`; checksum kanonis tersimpan pada
`checksums.sha256`. SHA-256 dump masing-masing:

- Audit: `1429dc4837c692cb2118371b1621b73242f213eba29b4abc86a3e2fbfc1a5324`
- Master Data: `a1777cfa23de60878b832711f01777b61553ba1cbdd769714c156f6dd147a2bc`
- User: `629d9133c7036baa83cda83920605724f888a699f348e9cadf7f21efc0b0a04e`

Migrasi naik/turun/naik telah dibuktikan pada database sementara. Migrasi lokal
kanonis berakhir pada Master Data v15, User v5, dan Audit v3 dengan `dirty=false`.
Production tidak termasuk ruang lingkup.

## Bukti Lokal Final

- Test seluruh modul Go pada workspace lulus dengan cache build terisolasi.
- Lint, pemeriksaan bahasa, kontrak OpenAPI, serta build Admin lulus; lint dan
  build Public juga lulus.
- Audit npm Admin/Public menemukan nol kerentanan dan `govulncheck` tidak
  menemukan jalur kode rentan pada enam layanan yang berubah.
- Secret scan tracked source, `git diff --check`, Compose config, `nginx -t`,
  HTTP Admin/Gateway, serta HTTPS edge Admin lulus.
- Admin dan Nginx berjalan dari Compose root dengan restart count nol setelah
  refresh; layanan data sehat. Gateway stabil dan tidak menunjukkan error baru
  walaupun restart count historisnya tetap tercatat.
- Verifikasi visual terautentikasi mobile/tablet membuktikan Dashboard,
  ApexCharts, tema terang/gelap, sidebar, dan popover notifikasi. Sesi autentikasi
  berakhir sebelum pengulangan viewport desktop; build dan smoke runtime terbaru
  tetap lulus tanpa layar putih.

## Ancaman dan Mitigasi

- Eskalasi hak akses: default-deny, permission granular, status akun diperiksa
  pada setiap permintaan terproteksi, dan route mutation dipetakan eksplisit.
- IDOR/notifikasi silang: penerima selalu berasal dari token; `id` notifikasi
  tetap dipasangkan dengan penerima pada pembaruan.
- Kehilangan administrator: perubahan diri sendiri dan Pengelola Utama aktif
  terakhir ditolak.
- Ketidakkonsistenan Keycloak/DB: mutasi lokal hanya diselesaikan setelah
  penyedia identitas berhasil; kegagalan DB memicu kompensasi Keycloak.
- Unggah berbahaya: signature, MIME, dimensi, ukuran, checksum, dan turunan
  tetap divalidasi server; zona jatuhkan hanya meningkatkan interaksi.
- Kebocoran audit: UI mengutamakan username, payload sensitif tetap disaring,
  dan lookup direktori dibatasi layanan/permission audit.

## Gate Penutupan

Format/diff check, test Go terdampak, lint, penjaga bahasa, kontrak OpenAPI,
build Admin/Public, Compose config, migrasi, kesehatan runtime, Nginx, smoke
HTTP, secret scan, dan protected CI wajib PASS pada SHA final. Status runtime
dan Git delivery dicatat setelah bukti tersedia; dokumen ini tidak memberi izin
deploy atau migrasi production.
