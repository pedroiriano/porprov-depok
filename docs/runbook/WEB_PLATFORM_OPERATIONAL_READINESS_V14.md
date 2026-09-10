# Kesiapan Operasional Web Tahap 14

## Ruang lingkup dan batas

Audit dilakukan pada 10 September 2026 dari branch lokal `codex/web-platform-readiness-v14` yang berbasis tepat pada `origin/main` commit `7c373207042da10fad93b89da7be97b06dbb64f3`. Pemeriksaan hanya memakai runtime dan database Docker lokal. Tidak ada akses VPS, deploy, migrasi, perubahan data produksi, mutasi data UAT, commit, push, PR, atau merge.

Tiga dokumen referensi DOCX yang diwajibkan `AGENTS.md` tidak tersedia di `docs/reference/`: analisis desain, ASCII wireframe, dan perencanaan arsitektur Web & Mobile. Implementasi tidak mengarang isinya dan memakai governance Markdown serta kontrak UI yang tersedia.

## Matriks kesiapan

| Area | Status | Bukti dan batas |
|---|---|---|
| Git dan Compose root | PASS | Branch kerja berbasis `origin/main`; Compose seluruh container aktif menunjuk konfigurasi root. File lokal sensitif tetap diabaikan Git. |
| Docker dan health service | PASS | 19 service utama berjalan; service yang memiliki health check sehat. Tujuh service yang direcreate setelah hardening memiliki restart count 0 dan log kritis baru 0. Dua container migrasi one-shot tetap exited 0. |
| Public dan Admin Web | PASS | Public 11 rute dan Admin 15 rute lulus 390/768/1440 px, tema terang/gelap, tanpa overflow, gambar rusak, struktur utama ganda, atau error konsol. |
| Gateway dan kontrak API | PASS | Health serta projection Hero, Cabor, Venue, Jadwal, LiveScore, Medali, kategori dan Panduan Kota merespons 200. Kontrak OpenAPI 3.1 v14 memuat 63 path dan referensi valid. |
| Database lokal | PASS | `user=5`, `master=15`, `venue=3`, `schedule=5`, `livescore=1`, `medals=3`, `audit=3`; seluruh migration state bersih. Tahap ini tidak menjalankan migrasi. |
| Media Library | PASS | Volume canonical terpasang; 374/374 URL media aktif dapat dibaca setelah encoding URL yang benar. File asli tetap dipertahankan. |
| Pin rekomendasi Venue | PASS | Tepat satu Panduan Kota aktif terpin dan nilainya `Department Sports Lab`; projection Public tetap membacanya. |
| Realtime dan outbox | PASS | NATS sehat tanpa slow consumer; pending outbox LiveScore dan Medali 0. SSE privat tetap melalui Gateway dan SSE publik memakai projection tersanitasi. |
| RBAC dan sesi lokal | PASS | Public allowlist anonim 200, endpoint terproteksi anonim 401, matriks peran dan izin granular lulus test Gateway/User, serta UAT Admin memakai sesi OIDC lokal yang sudah terautentikasi. |
| Alur mutasi Admin ke Public | PARTIAL | Route, validasi, soft delete/restore, draf, riwayat, audit, dan outbox terbukti melalui source/test. UAT tidak membuat data sementara agar snapshot recovery lokal tidak tercemar audit/event baru. |
| Jadwal, LiveScore, dan Medali aktif | PARTIAL | Empty state faktual lulus. Database lokal tidak memiliki pertandingan aktif atau medali resmi; satu projection LiveScore historis tidak dipasangkan ke jadwal aktif. |
| Notifikasi berisi data | PARTIAL | Pop-up, klik luar, polling, scope penerima, dan API contract lulus; database lokal belum memiliki notifikasi untuk menilai daftar berisi data. |
| Dokumen referensi desain wajib | PARTIAL | Tiga DOCX wajib belum tersedia. Governance root, quality standard, ADR, dan kontrak UI tetap tersedia. |

Tidak ada area yang berstatus FAIL pada scope yang dapat diuji tanpa mutasi data.

## Hardening source

- Master Data, Venue, Schedule, LiveScore, Medali, Realtime, dan User Service memakai batas waktu koneksi HTTP serta graceful shutdown 10 detik. Realtime mempertahankan `WriteTimeout=0` agar SSE panjang tidak terputus.
- CORS langsung pada Master Data, Venue, Schedule, dan User Service tidak lagi menerima wildcard; hanya origin pengembangan kanonis yang diterima. Akses production tetap same-origin melalui Gateway.
- OpenAPI v14 mendokumentasikan endpoint Public/Admin utama, keamanan bearer sebagai default, endpoint publik eksplisit, pagination maksimal 100, concurrency conflict, soft delete/restore, Media, LiveScore append-only, serta workflow Medali.
- Image Public dibangun ulang agar memakai Next 16.3.4 dan sharp 0.35.4. Runtime Admin berpindah dari base Nginx 1.27 yang usang ke `nginx:alpine` aktif dengan patch OS terbaru.
- Redirect HTTP dan `/admin` mendeklarasikan header keamanan secara eksplisit agar tidak bergantung pada aturan inheritance `add_header` antarversi Nginx.
- Skrip tracker Umami tetap tersedia same-origin, tetapi wildcard CORS bawaan upstream disembunyikan pada konfigurasi Nginx lokal dan VPS source.

## Baseline data tanpa mutasi

- Hero aktif: 1; Cabor aktif: 12; Venue aktif: 10; Panduan Kota aktif: 326; kategori aktif: 10.
- Media aktif: 374; file volume: 379; ukuran volume sekitar 202,9 MB.
- Jadwal aktif: 0; LiveScore current/revision: 1/14; medali resmi/pengajuan: 0/0.
- User aktif dan tidak terarsip: 2; role: 5; permission: 48; notifikasi: 0; audit log: 1.182.

Angka tersebut hanya agregat verifikasi dan tidak memuat data pribadi atau credential.

## Gate final dan residual

| Gate final | Hasil |
|---|---|
| Regression Go | PASS — `go test ./...` pada 10 modul. |
| Admin Web | PASS — lint, pemeriksaan bahasa, OpenAPI, TypeScript, dan production build. |
| Public Web | PASS — lint, TypeScript melalui Next build, dan production build. |
| Dependency Web | PASS — npm audit Public/Admin, 0 vulnerability. |
| Go vulnerability | PASS — `govulncheck` pada 10 modul, 0 jalur kode rentan. Satu advisory modul transitif tidak dipanggil oleh source. |
| Secret dan file lokal | PASS — scan source tracked; koleksi Postman dan `infra/docker/.env` tetap ignored/untracked. |
| Container | PASS — Trivy terhadap 11 root filesystem image final, 0 HIGH/CRITICAL fixable. Scan awal menemukan image Public/Admin lama; keduanya telah dibangun ulang dan lulus scan ulang. |
| Nginx dan header | PASS — `nginx -t` serta 15 target HTTP/HTTPS mencakup CSP tunggal/lengkap, HSTS HTTPS tunggal, tanpa HSTS HTTP, `no-store`, COOP/COEP/CORP, dan penghilangan versi. |
| Visual/browser | PASS — 66 kombinasi Public dan 90 kombinasi Admin pada 390/768/1440 px, light/dark; interaksi sidebar/notifikasi dan console error/warning juga lulus. |
| CodeQL | `BLOCKED_TOOL_UNAVAILABLE` — CLI CodeQL tidak tersedia lokal dan dilarang membuat commit/PR pada tahap ini. |
| Dependency review | `BLOCKED_GIT_CONTEXT` — action membutuhkan diff pull request, sedangkan Git delivery belum diizinkan. |
| ZAP pasif | PASS — baseline HTTPS lokal memeriksa 529 URL dengan `0 FAIL`, `61 PASS`, dan enam kategori peringatan tertriase. Wildcard CORS tracker ditemukan pada putaran pertama, dihapus, lalu aturan Cross-Domain Misconfiguration lulus pada putaran final. Peringatan tersisa adalah kebijakan cache eksplisit, komentar HTML non-sensitif, parameter pagination/kategori tervalidasi dan di-escape React, aset dinamis same-origin tanpa SRI, serta deteksi aplikasi modern. |

UAT mutasi, data LiveScore/Medali aktif, dan notifikasi berisi data tetap residual yang memerlukan fixture terisolasi atau persetujuan perubahan data lokal beserta rollback. Rollback source dapat membangun ulang dari commit `7c373207`; rollback runtime tidak memerlukan penghapusan volume. Tahap 14 siap memasuki Git delivery, tetapi belum final sampai CodeQL dan dependency review lulus pada pull request.
