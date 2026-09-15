# Penutupan Insiden Production Media dan Gambar Berita — 15 September 2026

## Status

**CLOSED — TECHNICAL AND USER VISUAL ACCEPTANCE PASS**

Hotfix telah aktif dan stabil di Production. Pengguna mengonfirmasi
`ACCEPTANCE PASS` setelah memeriksa tampilan dengan sesi SSO miliknya. Agent
tidak mengotomatisasi autentikasi pengguna melalui browser.

## Dampak

- Web Admin menampilkan recovery UI saat membuka Kontingen, Hero, dan Pustaka
  Media.
- Gambar pada Berita Pilihan Depok tidak tampil melalui edge Production.
- API, database, file Media Library, RBAC, dan data domain tidak rusak.

## Akar Masalah

1. Build Admin Production memakai `VITE_API_URL=/api/v1`. Resolver media lama
   memanggil `new URL()` tanpa origin dasar sehingga melempar
   `TypeError: Invalid URL` ketika halaman merender URL media relatif.
2. Nginx menangkap `/api/berita/image` melalui lokasi umum `^~ /api/` dan
   meneruskannya ke API Gateway. Endpoint tersebut sebenarnya dimiliki oleh
   Public Web sehingga edge menghasilkan `404` walaupun handler proxy gambar
   Public sehat.

## Resolusi

- Resolver media Admin kini menerima origin browser untuk base URL API
  same-origin dan tetap mempertahankan URL absolut, `data:`, serta `blob:`.
- Regression test mencakup konfigurasi Production `/api/v1` dan konfigurasi
  development absolut.
- Nginx lokal dan VPS memiliki exact location `/api/berita/image` yang hanya
  menerima GET dan meneruskan request ke Public Web. Validasi allowlist host,
  MIME, ukuran, dan timeout tetap berada pada handler Next.js.

## Git dan Delivery

| Item | Nilai |
|---|---|
| Commit hotfix | `1186cbfca38011fd743dcf61cbbc70a9345229fc` |
| Pull request | [#44](https://github.com/pedroiriano/porprov-depok/pull/44) |
| Merge/release commit | `5cc155ccc72df7b2c606afbd74cbaa025855dae2` |
| CI | Seluruh Web, Mobile, Go, secret check, dependency review, dan CodeQL PASS |
| Migrasi database | Tidak dijalankan |
| Perubahan data | Tidak ada |

## Deployment dan Rollback

Deployment dijalankan sebagai job server-side ber-`flock`, PID, status, dan log
tersanitasi. Hanya image Admin dan Nginx yang dibangun dan direcreate; Nginx
direcreate setelah Admin siap agar DNS upstream tidak stale.

| Item | Nilai |
|---|---|
| Waktu selesai | `2026-09-15T02:29:42Z` |
| Backup | `/home/diskominfo/porprov-backups/hotfix-media-20260915T022838Z` |
| Validasi backup | `SHA256SUMS` PASS |
| Ukuran backup | `212227203` byte |
| Source rollback | `8757bc8b6953e677b353e09894b26d74ea2b48c0` |
| Image Admin aktif | `sha256:dc6132d6b7193d3f13dc0fc3d2c3c8b22a7d9bca2c7b29063cf7242fac59ac0e` |
| Image Nginx aktif | `sha256:e92e766289b73c06ad8ef346748956b41f71d789e267a19b02ec1b09c67ca8f9` |
| Image rollback | `docker-admin-web:rollback-20260915T022838Z`, `docker-nginx:rollback-20260915T022838Z` |

Backup, image rollback, source lama, volume, dan database tidak dihapus.

## Bukti Pascadeploy

| Pemeriksaan | Hasil |
|---|---|
| Source Production | Exact release commit, working tree bersih |
| Runtime PORPROV | 19 running, 0 unhealthy, 0 restarting |
| Restart Admin/Nginx | 0 / 0 |
| Log kritis service terkait | 0 |
| HTTP 5xx Nginx 30 menit | 0 |
| Public/Admin loopback | `200` sekitar 54 ms / `200` sekitar 29 ms |
| API Kontingen/Hero/Media dengan smoke account | `200`, response shape valid |
| Proxy gambar Berita | 6/6 `200`, MIME `image/webp` atau `image/jpeg` |
| Smoke workstation | Public `200`, Admin `200`, gambar Berita `200`, security header PASS |
| Browser Public | Berita yang masuk viewport termuat, 0 gambar rusak, 0 console error |
| Browser Admin pra-login | Halaman SSO tampil, 0 console error |

## Langkah Acceptance Pengguna

Acceptance pengguna dinyatakan **PASS** pada 15 September 2026 untuk Data
Utama/Kontingen, Tampilan Utama/Hero, Pustaka Media, dan gambar Berita Public.
Recovery UI tidak lagi muncul pada scope insiden.

Jangan menghapus backup atau image rollback sebelum acceptance pengguna PASS
dan masa retensi operasional ditetapkan.
