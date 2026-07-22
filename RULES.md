# RULES.md — Aturan Mutlak Portal PORPROV Enterprise UI/UX v4

Dokumen ini mengikat semua agent AI/Codex saat membuat, mengubah, menguji, atau mendokumentasikan aplikasi Portal PORPROV XV Jawa Barat 2026.

## 0. Konteks Produk dan Sumber Kebenaran

- Produk aktif adalah repository `porprov-depok` untuk Portal PORPROV XV Jawa Barat 2026 Kota Depok.
- Kondisi implementasi aktual wajib dibaca dari `FEATURES.md`; jangan menganggap fitur planned sebagai tersedia atau fitur yang hanya compile sebagai final.
- `RULES.md` adalah sumber normatif. `README.md`, `AI.md`, `AGENTS.md`, `FEATURES.md`, dan `DOCUMENTATION.md` wajib konsisten dengannya.
- Setiap perubahan aturan atau standar wajib memperbarui semua Markdown root yang terdampak dalam pekerjaan yang sama.
- Techwind 3.3.0 adalah satu-satunya tema UI/UX yang wajib digunakan. Public hanya merujuk `theme-reference/HTML/Landing/dist/` dan Admin hanya merujuk `theme-reference/HTML/Dashboard/dist/`; tema, template, design system visual, atau sumber gaya lain dilarang.

## 1. Keputusan Final Stack

| Area | Keputusan Final |
|---|---|
| Arsitektur | Microservices + Event-Driven Architecture |
| Public Web | Next.js + React + TypeScript + PWA |
| Admin Web | React + TypeScript + Tailwind CSS + Dashboard Layout |
| Public Mobile | React Native + TypeScript |
| Admin Mobile/Koresponden | React Native + TypeScript |
| Chrome App | Installable PWA, bukan Chrome Apps klasik |
| Backend | Golang microservices |
| Database | PostgreSQL, prinsip database per service |
| Cache | Redis untuk cache, session, rate limit, presence, dan queue non-kritis |
| Event Broker | NATS JetStream untuk durable event bisnis |
| Auth | Keycloak + OpenID Connect/OAuth2 + JWT |
| Deployment | Docker + Nginx + SSL pada VM Diskominfo Kota Depok; Kubernetes bila skala enterprise besar |
| UI System | Techwind 3.3.0 sebagai tema tunggal wajib, Tailwind CSS v4.x hanya sebagai mesin implementasi, design tokens PORPROV, mobile-first, accessible components |


## 2. Arsitektur Repositori Wajib

```text
porprov-xv/
├── README.md
├── AI.md
├── AGENTS.md
├── RULES.md
├── FEATURES.md
├── DOCUMENTATION.md
├── theme-reference/
│   └── HTML/
│       ├── Landing/
│       └── Dashboard/
├── apps/
│   ├── public-web-nextjs/
│   ├── admin-web-react/
│   ├── mobile-public-react-native/
│   └── mobile-admin-react-native/
├── services/
│   ├── api-gateway/
│   ├── auth-adapter-service/
│   ├── user-service/
│   ├── master-data-service/
│   ├── schedule-service/
│   ├── venue-service/
│   ├── livescore-service/
│   ├── medal-standing-service/
│   ├── notification-service/
│   ├── file-service/
│   ├── audit-service/
│   └── realtime-gateway/
├── packages/
│   ├── design-tokens/
│   ├── types/
│   ├── api-client/
│   ├── validators/
│   └── ui/
├── infra/
│   ├── docker/
│   ├── nginx/
│   ├── postgres/
│   ├── redis/
│   ├── nats/
│   ├── keycloak/
│   └── monitoring/
└── docs/
    ├── reference/
    ├── adr/
    ├── api/
    ├── uiux/
    ├── security/
    └── runbook/
```

## 3. Protokol Strict Full Code

- Saat membuat atau memperbarui file kode, tampilkan **full code dari baris pertama sampai terakhir**.
- Wajib menyebutkan **nama file dan path** sebelum blok kode.
- Dilarang menulis `...`, `kode sebelumnya`, `sisanya sama`, `dst`, `dll`, atau placeholder kosong.
- Bila perubahan terlalu besar, pecah menjadi tahap kecil dan **wajib meminta konfirmasi** sebelum lanjut.

## 4. Protokol Konfirmasi Tahap

Agent wajib berhenti dan bertanya: **"Konfirmasi: lanjut ke Tahap X?"** setelah menyelesaikan foundation, infra, auth, backend, public web, admin web, mobile, realtime, testing, hardening, atau deployment.

## 5. Tema Tunggal Wajib UI/UX Techwind

| Area | Sumber Tema Wajib | Adaptasi PORPROV |
|---|---|---|
| Public Web | Techwind 3.3.0 `theme-reference/HTML/Landing/dist/` | Navigation, hero, event/feature sections, editorial, gallery, CTA, footer, LiveScore, venue, medali, berita, dan Depok Guide diimplementasikan ulang sebagai komponen Next.js PORPROV |
| Admin Web | Techwind 3.3.0 `theme-reference/HTML/Dashboard/dist/` | Application shell, sidebar, topbar, KPI, form, table, calendar, profile, gallery, dan workflow operator diimplementasikan ulang sebagai komponen React PORPROV |
| Web/Mobile baru | Pola terdekat dari salah satu `dist` Techwind canonical | Adaptasi responsif menggunakan identitas PORPROV; dilarang mengambil tema, template, atau visual language lain |


Aturan:
- Techwind adalah tema tunggal dan wajib untuk seluruh UI/UX Public, Admin, mobile, PWA, halaman autentikasi, serta layar baru.
- Hanya folder `dist/` masing-masing Techwind yang menjadi referensi visual canonical. Source Gulp, demo JavaScript, identitas, dan copy Techwind tidak boleh masuk runtime aplikasi.
- Dilarang menggunakan atau menyebut tema/template/design system visual pihak lain sebagai inspirasi, fallback, alternatif, atau campuran. Kebutuhan kepadatan data, editorial, realtime, dan workflow harus diwujudkan memakai pola Techwind.
- Tailwind CSS v4.x adalah alat implementasi utility dan token, bukan tema alternatif. Library komponen hanya boleh dipakai untuk perilaku teknis tanpa membawa style bawaan yang menyimpang dari Techwind.
- Tailwind CSS v4 wajib mendefinisikan variant `dark:*` berbasis class `.dark`; `prefers-color-scheme` hanya boleh menentukan nilai awal dan tidak boleh menimpa pilihan eksplisit pengguna.
- Telaah halaman referensi yang relevan sebelum mengubah UI; dokumentasikan mapping komponen dan keputusan besar pada docs UI/UX atau ADR.
- Adaptasikan pola Techwind, bukan menyalin tampilan identik atau membangun visual language baru di luar Techwind.
- Gunakan identitas visual PORPROV/Kota Depok, asset resmi, copywriting Indonesia, dan token aplikasi. Jangan mengekspos logo, nama, demo content, atau identitas Techwind.
- Pastikan penggunaan dan distribusi asset tema sesuai lisensi proyek.

### 5.1 Quality Bar “Masterpiece”

Sebuah UI hanya boleh disebut masterpiece bila memenuhi seluruh quality bar berikut:

- Hierarki visual, grid, density, spacing, typography, warna, dan motion konsisten melalui design tokens.
- Semua state tersedia: loading/skeleton, empty, error/retry, success, disabled, permission denied, offline, dan realtime reconnect bila relevan.
- Responsif mobile-first tanpa overflow atau informasi kritis tersembunyi.
- WCAG 2.2 AA: semantic HTML, keyboard navigation, visible focus, label/ARIA benar, kontras minimal 4,5:1 untuk teks normal dan 3:1 untuk teks besar/komponen grafis esensial, target sentuh minimal 44px, dan `prefers-reduced-motion`.
- Perubahan token, komponen shared, route, atau tema wajib menjalankan audit terang/gelap dan desktop/mobile; matriks baseline disimpan di `docs/uiux/TECHWIND_DIST_LIGHT_DARK_AUDIT.md`.
- Public Web memenuhi SEO teknis dan target Core Web Vitals; Admin memprioritaskan task completion, scanability, bulk-safe actions, filter, pagination, dan feedback yang jelas.
- Tidak ada placeholder generik, demo copy, asset pecah, inkonsistensi icon, atau duplikasi komponen tanpa alasan.
- Visual regression, accessibility check, lint, type check, dan build menjadi quality gate sesuai risiko perubahan.

## 6. Implementasi Teknis Tema Techwind dengan Tailwind v4.x

- Gunakan token terpusat untuk warna, radius, spacing, shadow, z-index, typography, status badge, dan motion.
- Mobile-first: gunakan breakpoint `sm`, `md`, `lg`, `xl`, `2xl` secara naik.
- Gunakan komponen reusable: `Button`, `Card`, `Badge`, `Tabs`, `FilterBar`, `MatchCard`, `VenueCard`, `StandingTable`, `Skeleton`, `Toast`, `Modal`, `Drawer`.
- Semua interaksi harus keyboard accessible, memiliki focus state, dan target sentuh minimal 44px.
- Gunakan skeleton loading untuk LiveScore, standings, jadwal, venue, dan media.
- Gunakan status visual konsisten: `LIVE`, `UPCOMING`, `FINAL`, `OFFICIAL`, `PENDING`, `CORRECTED`, `REJECTED`, `OFFLINE`.

## 7. Aturan Frontend Public Web — Next.js

- Gunakan App Router, TypeScript, Server Components untuk halaman publik jika memungkinkan.
- Gunakan Metadata API untuk SEO, Open Graph, Twitter Card, canonical, dan dynamic metadata.
- Gunakan SSR/SSG/ISR sesuai karakter data.
- Halaman wajib: Beranda, Informasi PORPROV, Cabor, Detail Cabor, Jadwal, Venue, Detail Venue, LiveScore, Standings Medali, Galeri, Depok Guide, Berita, Press Kit.
- Data lintas domain untuk layar publik wajib dipublikasikan sebagai read-model backend melalui API Gateway. Browser tidak boleh mengorkestrasi request langsung ke beberapa port service atau menampilkan UUID referensi sebagai informasi pengguna.
- Gunakan PWA installable untuk kebutuhan "Chrome App".
- Realtime publik dapat memakai WebSocket atau SSE sesuai kebutuhan.

## 8. Aturan Admin Web — React Dashboard

- Gunakan React + TypeScript + Tailwind + TanStack Query.
- Admin tidak wajib SEO, tetapi wajib cepat, aman, dan realtime.
- Wajib memiliki role-based sidebar, global search, data table, filter kompleks, approval workflow, notification center, audit log, export Excel/PDF, dan dashboard KPI.
- Data besar harus memakai pagination server-side atau virtualization.
- Aksi destruktif harus menampilkan konsekuensi dan konfirmasi yang aksesibel; aksi “Hapus” selalu menjalankan soft delete dan menawarkan restore sesuai role.

## 9. Aturan Mobile — React Native

- Public Mobile: bottom tabs, notifikasi, offline cache terbatas, detail venue, jadwal, LiveScore, standings, galeri.
- Admin/Koresponden Mobile: login SSO, tugas hari ini, input skor cepat, scan QR, upload bukti, offline queue, sinkronisasi, riwayat aktivitas.
- Simpan token di secure storage/keychain, bukan AsyncStorage biasa.
- Gunakan large tap target dan form singkat.

## 10. Backend Golang Microservices

- Gunakan Go dengan struktur bersih: `cmd/`, `internal/`, `pkg/`, `migrations/`, `api/`.
- Framework: Gin/Fiber/Chi sesuai service; pilih konsisten dan dokumentasikan ADR.
- Database access: utamakan `pgx` + `sqlc`; ORM hanya bila disetujui.
- Gunakan validator, logging Zap/Zerolog, OpenTelemetry, Prometheus.
- Semua entity persisten mengikuti kontrak soft delete pada Bagian 17.
- API response wajib mengikuti format:
```json
{"success":true,"message":"Data berhasil diproses","data":{},"meta":{"request_id":"uuid","timestamp":"2026-07-06T13:00:00+07:00"}}
```

## 11. Event-Driven dan Realtime

- Redis untuk cache, session, rate limit, presence, lock ringan, queue non-kritis.
- NATS JetStream untuk event bisnis penting, event replay, durable consumer, dan microservices integration.
- Jangan memakai Redis Pub/Sub sebagai satu-satunya mekanisme event bisnis kritis.
- Gunakan outbox pattern, idempotency key, retry with backoff, timeout, circuit breaker, dan graceful shutdown.
- LiveScore harus memiliki event versioning, sequence, timestamp, actor, status, dan audit trail.
- Event internal LiveScore dan Medali wajib memiliki `eventVersion`, `eventId`, `eventType`, `sequence`, `timestamp`, `actor`, dan request correlation. Projection SSE publik wajib menghapus actor, request ID, alasan koreksi, serta metadata operasional lain; consumer harus mengabaikan event type yang tidak dimilikinya dan menyediakan fallback pembaruan saat SSE terputus.
- LiveScore persisten wajib memakai revision log append-only, sequence database, projection current, dan optimistic revision check. Koreksi membuat revisi baru dengan alasan; revisi lama dilarang diubah/dihapus.
- Master Data adalah pemilik referensi Kontingen, Schedule adalah pemilik susunan peserta pertandingan, dan LiveScore adalah pemilik revisi skor/status. Pertandingan yang masuk kontrak skor A/B wajib mempunyai tepat dua peserta terurut dengan jenis yang sama; jenis yang sah adalah `individual`, `team`, atau `contingent` dengan afiliasi Kontingen aktif.
- Master Data adalah pemilik lokasi City Guide. Create/update City Guide wajib menerima `latitude` dan `longitude` desimal secara berpasangan; latitude harus `-90..90` dan longitude `-180..180`. URL atau embed vendor peta bukan sumber kebenaran dan harus dibentuk consumer dari koordinat.
- Migrasi City Guide boleh mempertahankan kedua koordinat sebagai null untuk record legacy, tetapi tidak boleh menyimpan hanya satu sisi, mengarang titik fallback, atau menerima pembaruan tanpa melengkapi pasangan koordinat.
- Form peserta wajib berada pada workflow Jadwal Pertandingan. LiveScore dilarang membuat atau menyimpan identitas peserta paralel; jika susunan belum lengkap, input skor harus dikunci. Penggantian susunan peserta wajib transaksional dan melakukan soft delete pada record lama beserta actor/alasan.
- Workflow Medali wajib memisahkan pengaju, verifikator, rejector, dan publisher. Hanya transisi `VERIFIED → OFFICIAL` yang boleh mengubah klasemen publik; publish ulang submission OFFICIAL dilarang agar perolehan tidak terhitung ganda.
- State domain kritis dan outbox harus ditulis dalam transaksi database yang sama. Delivery JetStream bersifat at-least-once, sehingga event ID wajib stabil dan consumer wajib idempotent/deduplicated.
- Audit kritis wajib append-only, menyimpan actor/request/IP bila tersedia, event ID, version/type, payload hash, dan menolak UPDATE/DELETE. Poison message tidak boleh diproses ulang tanpa batas.

## 12. Auth dan Security

- Auth wajib melalui Keycloak + OIDC/OAuth2 + JWT.
- Web dan mobile gunakan Authorization Code + PKCE.
- API Gateway wajib memvalidasi signature, issuer, expiry, subject, serta authorized client/audience; verifikasi signature saja tidak cukup. Route sensitif wajib memakai realm role eksplisit.
- Public SSE anonim hanya berlaku untuk data tayang yang tersanitasi. Private SSE wajib JWT/role di edge dan credential service-to-service pada hop internal; credential development/default wajib ditolak pada staging/production.
- CORS production wajib berupa daftar origin HTTPS eksplisit tanpa wildcard. Header actor, IP audit, dan credential internal dari klien harus dibuang lalu diturunkan ulang dari context tepercaya.
- Admin wajib MFA, RBAC ketat, dan audit login.
- Service-to-service gunakan OAuth2 client credentials, mTLS/internal network policy bila tersedia.
- Terapkan OWASP Top 10, OWASP ASVS, HTTPS, HSTS, secure cookie, CSRF untuk web session, CORS strict, input validation, output encoding, SQL injection prevention, rate limiting, secret management, token expiry pendek, refresh token rotation, dependency scan, container image scan, dan upload scanning.

## 13. SEO Public Web

- Wajib semantic HTML, satu H1 per halaman, heading runut, alt image, canonical URL, sitemap.xml, robots.txt, structured data, Open Graph, Twitter Card.
- Halaman cabor, venue, jadwal, berita, galeri, dan rekomendasi tempat harus indexable.
- Target Core Web Vitals: LCP ≤ 2,5 detik, INP ≤ 200 ms, CLS ≤ 0,1.

## 14. Testing dan Quality Gates

- Backend: unit, integration, contract, migration, load, stress, security, API regression.
- Frontend: component, E2E, accessibility, visual regression, performance, PWA installability.
- Mobile: device compatibility, offline, push notification, deep link, biometric, crash reporting.
- Tools: Playwright, k6, Trivy, SonarQube, Sentry, Prometheus/Grafana/Loki/OpenTelemetry.
- Jangan klaim lulus load/stress/security test bila belum ada hasil uji.

## 15. Komentar Kode Wajib

Gunakan komentar bersih:
- `// INFO:` untuk konteks.
- `// CHANGE:` untuk perubahan penting.
- `// SECURITY:` untuk kontrol keamanan.
- `// PERFORMANCE:` untuk optimasi.
- `// SEO:` untuk metadata/rendering.
- `// ACCESSIBILITY:` untuk ARIA/fokus/keyboard.
- `// TEST:` untuk strategi uji.

## 16. Deployment VM Diskominfo Kota Depok

- Minimum production: Docker, Docker Compose staging, Nginx reverse proxy, SSL/TLS, PostgreSQL, Redis, NATS JetStream, Keycloak, CI/CD, backup, monitoring, log aggregation.
- Enterprise upgrade: Kubernetes, Nginx Ingress, Cert Manager, HPA, PostgreSQL HA, Redis Sentinel/Cluster, NATS Cluster, object storage, blue-green/canary deployment.
- Semua konfigurasi rahasia wajib memakai `.env` atau secret manager, tidak masuk git.

## 17. Soft Delete Wajib untuk Semua Data Persisten

> Status penerapan 14 Juli 2026: kontrak ini sudah diterapkan dan diuji pada Cabor, Nomor Pertandingan, Kontingen, City Guide, Media Library, Venue, dan Jadwal. Implementasi service/domain baru wajib memakai kontrak yang sama; keputusan teknis aktif dicatat pada `docs/adr/ADR-0002-soft-delete-and-port-namespaces.md`.

### 17.1 Kontrak Data

- Setiap tabel/entity domain yang dapat dihapus wajib memiliki `deleted_at TIMESTAMPTZ NULL`, `deleted_by` sesuai tipe identitas actor, dan `delete_reason` bila penghapusan perlu alasan bisnis.
- Query list/get/relasi standar wajib menyertakan `deleted_at IS NULL`. Akses data terhapus hanya melalui scope khusus untuk recycle bin, audit, restore, atau purge.
- Unique constraint data aktif wajib menggunakan partial unique index `WHERE deleted_at IS NULL` bila record dengan nilai sama boleh dibuat kembali setelah dihapus.
- Dilarang memakai `ON DELETE CASCADE` sebagai alur penghapusan bisnis lintas entity/service. Relasi ditangani dengan policy domain, validasi, dan event.

### 17.2 Kontrak API dan Audit

- Endpoint `DELETE` tetap boleh digunakan, tetapi hanya melakukan update penanda soft delete, bersifat idempotent, dan tidak menghapus row/file secara fisik.
- Actor, waktu, alasan, request ID, serta nilai penting sebelum perubahan wajib dicatat pada audit trail.
- Restore wajib memakai endpoint eksplisit, misalnya `POST /resources/{id}/restore`, dengan authorization, validasi konflik, audit, dan event restore.
- Service harus memublikasikan event versioned seperti `resource.deleted` dan `resource.restored` melalui outbox/NATS bila consumer lain perlu menyelaraskan projection.
- Response tidak boleh membocorkan record soft-deleted kepada pengguna tanpa permission yang sesuai.

### 17.3 Media, Retensi, dan Purge

- Soft delete Media Library hanya menandai metadata; object/file tetap tersedia bagi proses restore namun tidak muncul pada selector/list aktif dan tidak boleh dilayani melalui URL publik tanpa scope restore yang sah.
- Purge fisik hanya boleh dilakukan worker/job terkontrol setelah masa retensi `[TBD — perlu keputusan produk dan legal]`, memastikan tidak ada referensi aktif, serta menghasilkan audit log.
- Hard delete manual melalui UI/API umum dilarang. Pengecualian seperti data uji, kewajiban hukum, atau insiden keamanan membutuhkan role khusus, persetujuan eksplisit, dan audit.

### 17.4 Quality Gate Soft Delete

- Migration harus backward-safe dan memiliki strategi backfill/rollback.
- Unit/integration test minimal mencakup delete, invisibility pada query aktif, get by ID, restore, konflik uniqueness, authorization, audit, idempotency, dan purge terkontrol.
- Fitur yang masih melakukan hard delete tidak boleh berstatus `[x] Final`; catat sebagai `[~] In Progress` atau technical debt pada `FEATURES.md`.

## 18. Sinkronisasi Dokumentasi Root

Gunakan pembagian tanggung jawab berikut setiap kali aturan/standar berubah:

| File | Wajib Memuat |
|---|---|
| `README.md` | Orientasi aplikasi, quick start, baseline penting, dan tautan dokumen |
| `AI.md` | Konteks kerja dan perilaku ringkas agent |
| `AGENTS.md` | Protokol operasional, tahapan, quality gate, dan format handoff |
| `RULES.md` | Aturan normatif dan larangan mutlak |
| `FEATURES.md` | Status implementasi nyata, gap kepatuhan, dan technical debt |
| `DOCUMENTATION.md` | Detail teknis, arsitektur, kontrak data/API, operasi, dan runbook |

Perubahan arsitektur tetap membutuhkan ADR. Perubahan fitur tetap memperbarui `FEATURES.md`. Jangan membuat keenam file menjadi salinan identik; sinkronkan keputusan yang sama sesuai fungsi masing-masing.

## 19. Registry dan Portabilitas Port

| Lapisan | Port Standar | Aturan |
|---|---|---|
| Production edge | `80`, `443` | Hanya Nginx/reverse proxy yang diekspos publik |
| Public development | Public `3000`, Admin `5173`, Gateway `8000`, Keycloak `8080` | Entry point browser dan SSO lokal melalui Compose |
| Docker diagnostic | Master `18081`, Schedule `18082`, Venue `18087` | Hanya health check/troubleshooting lokal |
| Local Go debug | Gateway `28000`, User `28001`, Master `28081`, Schedule `28082`, LiveScore `28083`, Audit `28084`, Realtime `28085`, Medal `28086`, Venue `28087` | Tidak bentrok dengan port host Docker |
| Infrastruktur host | PostgreSQL `15432`, Redis `16379`, NATS `14222/18222`, Prometheus `19090`, Grafana `13000` | Dapat diubah melalui `infra/docker/.env` |

Aturan mutlak:

- Port internal Docker tetap mengikuti kontrak image/service dan komunikasi antarkontainer memakai DNS nama service, bukan `localhost` atau host port.
- Seluruh mapping host pada Compose wajib memakai environment variable dengan default terdokumentasi.
- Frontend hanya menggunakan API Gateway atau same-origin reverse proxy; dilarang mengakses Master/Schedule/Venue melalui port diagnostik.
- Data tayang publik (Master Data aktif, Jadwal aktif, Venue aktif, Klasemen, dan stream realtime) boleh dibaca tanpa JWT hanya melalui route GET/stream API Gateway; seluruh mutasi, tombstone, restore, dan data audit tetap wajib autentikasi serta otorisasi.
- Full stack wajib dijalankan dari satu baseline `infra/docker/docker-compose.yml` melalui `infra/docker/compose-up.ps1`; script campuran Docker/`go run` dan port Admin alternatif dilarang.
- Local `go run` menggunakan namespace `28xxx` hanya untuk debugging satu komponen. Container domain yang sama wajib dihentikan; concurrent writer terhadap database/storage yang sama dilarang.
- File `.env` aktual tidak boleh dilacak Git. Template tunggal berada di `infra/docker/.env.example` dan secret staging/production berasal dari secret manager.
- Named volume `master_data_uploads` adalah sumber storage runtime Media Library. Migrasi file wajib non-destruktif dan file tidak boleh dipurge tanpa kebijakan retensi.
- Bootstrap realm, client, role, dan user development Keycloak harus idempotent serta selesai sebelum Gateway/Admin menerima traffic.
- Deployment hosting harus dapat mengganti host port tanpa rebuild source. Pada production, tutup port diagnostik melalui Compose override/firewall.
- Penambahan service/port wajib memperbarui registry ini, `.env.example`, `DOCUMENTATION.md`, dan dokumen root terkait.
