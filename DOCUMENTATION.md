# DOCUMENTATION.md — Dokumentasi Teknis Portal PORPROV Enterprise UI/UX v4

## 1. Ringkasan

Portal PORPROV XV Jawa Barat 2026 adalah platform sports event berbasis web dan mobile yang menyediakan informasi PORPROV, cabor, jadwal, venue/maps, LiveScore realtime, standings medali, galeri, Depok Guide, backend admin, dan aplikasi koresponden.

Konteks aktif per 22 Juli 2026: Public/Admin Web v0.4, API Gateway, Master Data, Venue, Schedule, LiveScore, Medal Standing, Audit, Realtime Gateway, dan infrastruktur data/event terintegrasi dalam satu runtime Docker Compose canonical. Keycloak client/role/user development di-bootstrap otomatis, Public Web memakai DNS Gateway internal untuk Server Components, dan Media Library memakai named volume tunggal. Namespace `28xxx` hanya untuk debugging komponen terisolasi. Batas fitur lain tetap mengikuti status aktual `FEATURES.md`.

## 2. Stack Final

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


## 3. Struktur Repositori

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

## 4. Tema Tunggal dan Prinsip UI/UX

| Area | Sumber Tema Wajib | Adaptasi PORPROV |
|---|---|---|
| Public Web | Techwind 3.3.0 `theme-reference/HTML/Landing/dist/` | Navigasi, hero, event sections, editorial, gallery, CTA, auth, footer, dan penyajian informasi olahraga dipetakan ke komponen Next.js PORPROV |
| Admin Web | Techwind 3.3.0 `theme-reference/HTML/Dashboard/dist/` | Application shell, sidebar, topbar, KPI, form, table, calendar, gallery, profile, dan workflow operator dipetakan ke komponen React PORPROV |
| Web/Mobile baru | Pola terdekat dari dua folder `dist` Techwind canonical | Diadaptasi responsif dengan identitas PORPROV; sumber tema, template, dan visual language lain dilarang |

Techwind 3.3.0 adalah satu-satunya tema visual proyek, bukan runtime atau brand aplikasi. Hanya HTML/CSS pada dua folder `dist` canonical yang boleh dipakai untuk membaca struktur, ritme, responsive behavior, dan pola komponen, lalu diimplementasikan ulang sebagai React/Next.js dengan design tokens, asset, serta copywriting resmi PORPROV. Tema, template, design system visual, layout, tipografi, atau interaction language dari sumber lain dilarang. Distribusi asset harus mematuhi lisensi yang dimiliki proyek.

Tailwind CSS v4.x dan library UI hanya berfungsi sebagai mesin implementasi. Komponen library yang diperlukan untuk perilaku teknis wajib dinormalisasi sampai seluruh tampilannya mengikuti Techwind dan token PORPROV; style bawaan library tidak boleh muncul sebagai tema kedua.

Implementasi tema memakai class `.dark` pada root sebagai single source of truth untuk utility `dark:*` Tailwind CSS v4. Preferensi warna sistem hanya menentukan nilai awal; pilihan pengguna disimpan dan selalu menang. Token surface, text, border, form, feedback, dan status mempunyai pasangan terang/gelap dengan target kontras WCAG 2.2 AA. Matriks halaman dan prosedur audit tersedia di `docs/uiux/TECHWIND_DIST_LIGHT_DARK_AUDIT.md`.

Quality bar “masterpiece” mewajibkan hierarki visual kuat, grid/spacing/type yang konsisten, seluruh state loading/empty/error/success/disabled/offline/reconnect, mobile-first, WCAG 2.2 AA, reduced motion, performa, visual regression, dan tidak adanya demo content atau komponen duplikat tanpa alasan.


### 4.1 Public Web Experience

- Gaya informasi: cepat, padat, SEO-friendly, sports-event storytelling.
- Halaman utama: hero, countdown, CTA, Live Now, Jadwal Hari Ini, standings medali, cabor, venue, galeri, Depok Guide.
- Navigasi mobile: bottom nav untuk Home, Jadwal, Live, Venue, Medali.
- Navigasi desktop: top nav + sticky score ticker.
- Gunakan match card padat untuk LiveScore.
- Gunakan editorial card untuk berita, highlight atlet, dan galeri.
- Gunakan venue cards untuk peta, rute, fasilitas, rekomendasi sekitar.
- Referensi wajib pada Techwind Landing antara lain pola event, gym, blog/editorial, gallery, auth, dan landing; pilih per komponen hanya dari `Landing/dist`, bukan menyalin satu halaman secara utuh.
- Ubah seluruh pola menjadi design language PORPROV: energi kompetisi, identitas Kota Depok, status realtime, CTA yang jelas, dan kepadatan informasi yang tetap terbaca.
- Mapping implementasi Beranda terbaru tersedia di `docs/uiux/PUBLIC_HOME_TECHWIND_MAPPING.md`: hero 100 viewport dengan parallax 50%, tautan Tuan Rumah, pusat informasi, Venue live melalui API Gateway, dan CTA panduan penonton.
- Public Web membaca `NEXT_PUBLIC_API_URL` dengan default canonical `http://localhost:8000/api/v1`. Server Components dalam Compose membaca `API_INTERNAL_URL=http://api-gateway:8000/api/v1`; browser dan server tetap hanya melewati API Gateway. Port `8080` khusus Keycloak.
- Canonical/metadata origin Public Web membaca `NEXT_PUBLIC_SITE_URL` dengan default lokal `http://localhost:3000`; deployment wajib mengisinya dengan origin HTTPS resmi.
- API Gateway membuka operasi baca publik untuk `/master-data/*`, `/schedule/*`, `/venues*`, `/medals/*`, `/livescore/public`, dan `/stream/events`; operasi mutasi, history operasional, Audit, dan private stream tetap wajib JWT/role.
- Jadwal, LiveScore, dan Klasemen tidak menggunakan data contoh produksi: jika belum ada record, UI menampilkan empty state; jika service gagal, UI menampilkan error yang dapat ditindaklanjuti.
- URL Media Library lama yang menunjuk port diagnostik `localhost:18xxx/uploads/*` dinormalisasi ke route `/uploads/*` API Gateway agar asset tetap dapat dibaca Public Web tanpa melanggar single-edge policy.
- Detail Cabor berada di `/cabor/[id]` dan menggabungkan nomor tanding, venue, serta Jadwal aktif. Detail Venue berada di `/venue/[id]` dan menggabungkan fasilitas, cabor, City Guide sekitar, rute/koordinat, serta Jadwal aktif; field kontak internal Venue tidak ditayangkan.
- `GET /api/v1/schedule/matches/enriched` adalah kontrak read-model publik yang mengembalikan nama/ikon Cabor, Nomor Tanding, peserta/Kontingen, Venue, waktu, ronde, dan status. Schedule Service melakukan batch query peserta lalu mengambil referensi aktif dari Master Data/Venue; kegagalan dependency menghasilkan `503`, dan tombstone tidak pernah masuk projection.
- Event internal LiveScore/Medali memakai envelope v1 berisi `eventVersion`, `eventId`, `eventType`, sequence database/monotonik, timestamp, actor, dan request correlation. Public SSE hanya meneruskan `LIVESCORE_UPDATED`, `LIVESCORE_CORRECTED`, dan `MEDAL_STANDING_UPDATED` setelah actor/request/alasan koreksi dibuang. Klasemen tetap polling 30 detik sebagai fallback.

### 4.2 Admin Web Experience

- Dashboard berbasis sidebar.
- KPI cards, realtime notification, queue panel, approval panel.
- Data table besar dengan server-side pagination, filter, sort, search, export.
- Role-based menu untuk SUPER_ADMIN, ADMIN_ORGANISASI, OPERATOR, VERIFIKATOR, PETUGAS_LAPANGAN, AUDITOR.
- Gunakan hanya Techwind `Dashboard/dist` untuk shell, sidebar/topbar, table, form, calendar, profile, gallery, dan feedback state; jangan memasukkan Gulp/theme JavaScript atau style dari tema lain ke bundle React.
- Aksi delete harus diberi konfirmasi aksesibel, menjelaskan bahwa data masuk Recycle Bin/arsip, dan menyediakan restore sesuai permission.
- LiveScore Center memakai private SSE bearer-token, menampilkan current/history, dan mengirim `expectedRevision` agar update operator yang stale menghasilkan `409`.
- Workspace Medali memisahkan submitter (`koresponden`), verifier (`verifikator`), dan publisher (`super_admin`). Audit Log hanya tampak bagi `auditor`/`super_admin` dan menyediakan export CSV tanpa mengubah record audit.

### 4.3 Mobile Koresponden Experience

- Fokus pada tugas hari ini.
- Tombol input skor besar.
- Offline queue terlihat jelas.
- Status sinkronisasi selalu tampil.
- Upload bukti foto/dokumen.
- Scan QR match/venue jika tersedia.
- Jangan menampilkan dashboard berat di mobile.

## 5. Cara Menjalankan Development

Runbook utama dan langkah troubleshooting tersedia di [`docs/runbook/LOCAL_DEVELOPMENT.md`](docs/runbook/LOCAL_DEVELOPMENT.md). Bagian berikut adalah ringkasan; gunakan runbook tersebut untuk urutan lengkap, migrasi service tambahan, health check, dan penghentian proses.

### 5.1 Prasyarat

- Node.js LTS
- Go versi stabil
- Docker + Docker Compose
- PostgreSQL client
- NATS CLI opsional
- Keycloak admin access
- npm; aplikasi web saat ini dikunci dengan `package-lock.json`

### 5.2 Full Stack Development Canonical

```powershell
Set-Location .\infra\docker
Copy-Item .\.env.example .\.env -ErrorAction SilentlyContinue
.\compose-up.ps1
```

Perintah tersebut membangun dan menjalankan Public Web, Admin Web, Gateway, seluruh core service, migration jobs, Keycloak beserta bootstrap, PostgreSQL, Redis, NATS, Nginx, Prometheus, dan Grafana. File `.env` bersifat lokal/ignored; `.env.example` adalah template tunggal.

Jika Docker CLI di Windows menampilkan `Access is denied` saat membaca `C:\Users\<user>\.docker\config.json`, gunakan helper lokal berikut agar konfigurasi Docker CLI disimpan di folder proyek:

Helper `compose-up.ps1` menyimpan konfigurasi CLI Docker di `.docker-cli` dalam workspace agar tidak bergantung pada `C:\Users\<user>\.docker\config.json`.

Jika muncul `permission denied while trying to connect to the docker API at npipe:////./pipe/docker_engine`, Docker Engine belum berjalan atau user Windows belum memiliki akses ke Docker Desktop. Buka Docker Desktop sampai engine aktif. Bila masih gagal, jalankan PowerShell sebagai Administrator:

```powershell
net localgroup docker-users $env:USERNAME /add
```

Logout atau restart Windows setelah menambahkan user ke grup `docker-users`.

### 5.3 Public Web

Public Web canonical tersedia di `http://localhost:3000` dari service `public-web`. Docker image memakai Next.js standalone output dan tidak bergantung pada unduhan Google Fonts saat build.

### 5.4 Admin Web

Admin Web canonical tersedia di `http://localhost:5173` dari service `admin-web`. Jangan menjalankan Vite kedua pada port alternatif ketika full stack aktif.

Admin Web menggunakan variabel berikut:

| Variabel | Default lokal | Fungsi |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Satu-satunya entry point API browser |
| `VITE_OIDC_AUTHORITY` | `http://localhost:8080/realms/porprov` | Authority Keycloak |
| `VITE_OIDC_CLIENT_ID` | `porprov-admin-web` | Client OIDC Admin Web |

API Gateway/Realtime menggunakan variabel keamanan berikut:

| Variabel | Default development | Aturan staging/production |
|---|---|---|
| `KEYCLOAK_ISSUER` | `http://localhost:8080/realms/porprov` | Origin issuer HTTPS persis seperti claim token |
| `JWT_ALLOWED_CLIENTS` | `porprov-admin-web,porprov-mobile-admin` | Daftar `azp`/audience yang memang diizinkan |
| `CORS_ALLOWED_ORIGINS` | Public/Admin local origins | Origin HTTPS eksplisit, tanpa wildcard |
| `INTERNAL_STREAM_TOKEN` | Token development lokal | Random secret minimal 32 karakter dari secret manager |

Admin Web membentuk `redirect_uri` dan `post_logout_redirect_uri` dari `window.location.origin`. Client publik `porprov-admin-web` menerima origin development eksplisit `localhost`/`127.0.0.1` pada port canonical `5173`, dengan Authorization Code Flow + PKCE `S256`; wildcard origin global tidak digunakan.

File `apps/admin-web-react/.env.development` telah dihapus agar tidak ada perpindahan Gateway diam-diam. Menu Admin membaca realm role dari ID token dan access token; API Gateway tetap melakukan otorisasi final.

Service one-shot `keycloak-bootstrap` menjalankan `create_clients.sh` dan `create_users.sh` secara idempotent sebelum API Gateway dimulai. Login ulang diperlukan setelah perubahan role agar browser memperoleh token baru.

Untuk deployment, override `ADMIN_REDIRECT_URIS` dan `ADMIN_WEB_ORIGINS` ketika menjalankan script dengan origin HTTPS resmi. Jangan menambahkan `webOrigins=["+"]` atau wildcard port pada client browser.

Media Library dan seluruh form Master Data menggunakan API Gateway. Nilai media disimpan sebagai URL relatif `/uploads/<nama-acak>.<ext>` agar tetap valid saat domain atau port deployment berubah.

### 5.5 Backend Service

```bash
cd services/livescore-service
go mod tidy
go test ./...
NATS_URL=nats://localhost:14222 go run main.go
```

Perintah di atas menggunakan sintaks shell Bash. Pada PowerShell, set `$env:NATS_URL = "nats://localhost:14222"` lalu jalankan `go run main.go`. Daftar lengkap entrypoint, migrasi, urutan startup, dan health check seluruh service tersedia di [`docs/runbook/LOCAL_DEVELOPMENT.md`](docs/runbook/LOCAL_DEVELOPMENT.md).

### 5.6 Mobile

```bash
cd apps/mobile-admin-react-native
pnpm install
pnpm start
```

### 5.7 Stack Terintegrasi dalam Docker

Jalankan seluruh stack canonical:

```powershell
Set-Location .\infra\docker
.\compose-up.ps1
```

Port Docker development:

| Komponen | URL |
|---|---|
| Public Web | `http://localhost:3000` |
| Admin Web | `http://localhost:5173` |
| API Gateway | `http://localhost:8000` |
| Keycloak | `http://localhost:8080` |
| Master Data Service (diagnostik) | `http://localhost:18081` |
| Schedule Service (diagnostik) | `http://localhost:18082` |
| Venue Service (diagnostik) | `http://localhost:18087` |

Service browser tidak boleh menggunakan port diagnostik. Port tersebut hanya untuk pemeriksaan lokal; operasi Admin Web selalu melalui API Gateway.

Migration SQL dikemas ke image migration agar berfungsi pada workspace Windows di drive yang tidak dibagikan sebagai bind mount. Aset Media Library disimpan pada named volume canonical `master_data_uploads`; soft delete media hanya menonaktifkan metadata dan delivery publik, tidak menghapus file dari volume. Upload lokal legacy 15 Juli 2026 telah dimigrasikan non-destruktif dan 16 URL aktif diverifikasi HTTP `200`.

Migration domain olahraga aktif adalah LiveScore v1, Medal v3, dan Audit v2. Fresh volume membuat `livescore_db`; volume PostgreSQL lama perlu dibuatkan database tersebut sekali sebelum menjalankan `migrate-livescore`, sebagaimana dijelaskan pada runbook lokal.

Volume Audit legacy yang dahulu dimigrasikan memakai SQL manual dapat belum mempunyai baseline `schema_migrations`. Setelah kolom/trigger v2 diverifikasi lengkap dan data dibackup, runbook menyediakan langkah `force 2` yang hanya memperbaiki metadata migration tanpa menghapus row Audit.

Pemeriksaan status:

```powershell
docker compose ps
curl.exe http://localhost:8000/health
curl.exe http://localhost:8000/api/v1/master-data/media
curl.exe http://localhost:8000/api/v1/venues
```

### 5.8 Registry Port dan Mode Debug

Host port Compose dibaca dari `infra/docker/.env` dengan fallback pada `.env.example`:

| Kategori | Variabel | Default |
|---|---|---|
| Public dev | `PUBLIC_WEB_HOST_PORT`, `ADMIN_WEB_HOST_PORT`, `API_GATEWAY_HOST_PORT`, `KEYCLOAK_HOST_PORT` | `3000`, `5173`, `8000`, `8080` |
| Diagnostic | `MASTER_DATA_HOST_PORT`, `SCHEDULE_HOST_PORT`, `VENUE_HOST_PORT` | `18081`, `18082`, `18087` |
| Data/event | `POSTGRES_HOST_PORT`, `REDIS_HOST_PORT`, `NATS_CLIENT_HOST_PORT`, `NATS_MONITOR_HOST_PORT` | `15432`, `16379`, `14222`, `18222` |
| Observability | `PROMETHEUS_HOST_PORT`, `GRAFANA_HOST_PORT` | `19090`, `13000` |
| Edge | `HTTP_HOST_PORT`, `HTTPS_HOST_PORT` | `80`, `443` |

Default `go run` sengaja berada pada namespace terpisah:

| Service | Local debug |
|---|---|
| API Gateway | `28000` |
| User | `28001` |
| Master Data | `28081` |
| Schedule | `28082` |
| LiveScore | `28083` |
| Audit | `28084` |
| Realtime Gateway | `28085` |
| Medal Standing | `28086` |
| Venue | `28087` |

Namespace `28xxx` dipertahankan untuk debugging satu komponen, bukan full-stack kedua. Sebelum `go run`, hentikan container domain yang sama dan berikan environment secara eksplisit. Jangan menjalankan Master Data lokal terhadap database Docker karena local folder upload dan named volume mempunyai lifecycle berbeda.

Venue lokal hanya boleh dijalankan sebagai debug terisolasi dengan `go run ./cmd/api` setelah container Venue dihentikan. Gunakan `.env.example` sebagai referensi dan set environment pada terminal; file `.env` service aktual tidak dipertahankan sebagai konfigurasi kedua.

API Gateway merupakan satu-satunya pemilik header CORS untuk request browser. Reverse proxy membuang seluruh header `Access-Control-*` dari response service internal sebelum middleware Gateway menambahkan kebijakan edge. Ini mencegah `Access-Control-Allow-Origin` ganda yang dianggap invalid oleh browser walaupun upstream mengembalikan HTTP `200`.

`realtime-gateway` membuat/menyelaraskan stream JetStream `LIVESCORE` dan `MEDALS` secara idempotent sebelum durable consumer dibuat. Public endpoint `/api/v1/stream/events` anonim tetapi tersanitasi; `/api/v1/stream/admin/events` memerlukan actor tepercaya dan `INTERNAL_STREAM_TOKEN` yang hanya disuntikkan Gateway. Redis password dibaca dari environment, replay memakai SCAN, dan connection limit melindungi fanout lokal. NATS yang tidak tersedia membuat startup gagal eksplisit.

Pada hosting, gunakan Nginx `80/443` sebagai satu-satunya entry point, hilangkan publish port diagnostik melalui Compose override/firewall, dan gunakan DNS service internal. Mengganti host port tidak memerlukan perubahan source atau image.

## 6. Domain Service

| Service | Tanggung Jawab |
|---|---|
| API Gateway | Routing, auth, rate limit, request id |
| Auth Adapter | Integrasi Keycloak, user claims, RBAC |
| User Service | User, role mapping, profile dasar |
| Master Data Service | Cabor, nomor pertandingan, kontingen, Media Library |
| Schedule Service | Jadwal, bracket, rundown |
| LiveScore Service | Score event, validation, correction, projection |
| Realtime Gateway | WebSocket/SSE fanout |
| Medal Standing Service | Agregasi medali dan ranking |
| Notification Service | Push/in-app/email |
| File Service | Upload, media, signed URL, scan |
| Audit Service | Audit log immutable |
| Reporting Service | Export dan laporan |

## 7. Realtime Architecture

```text
Admin/Koresponden
        ↓ JWT issuer/client/role + trusted actor
API Gateway
        ↓ POST update/correction
LiveScore Service → PostgreSQL revision/current + outbox (satu transaksi)
        ↓ retry + JetStream acknowledgement
NATS JetStream → Realtime Gateway → Public SSE tersanitasi
        ↓                         ↘ Private SSE Admin
Audit Service → PostgreSQL append-only + dedup + SHA-256
```

## 8. Database

Gunakan database per service. Integrasi data antar service dilakukan melalui event NATS JetStream, bukan join lintas database.

`venue-service` adalah pemilik data venue. `schedule-service` menyimpan UUID venue eksternal tanpa foreign key lintas database dan memvalidasi keberadaan venue melalui kontrak internal. LiveScore memvalidasi match aktif ke Schedule sebelum menulis revisi; Medal Standing memvalidasi Kontingen aktif ke Master Data sebelum membuat submission. Dependency failure bersifat fail-closed.

Keputusan integrasi ini dicatat pada `docs/adr/ADR-0001-master-data-media-integration.md`.

## 9. API Standard

### Success

```json
{
  "success": true,
  "message": "Data berhasil diproses",
  "data": {},
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-07-06T13:00:00+07:00"
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": {
    "field": ["Pesan kesalahan"]
  },
  "meta": {
    "request_id": "uuid"
  }
}
```

## 10. SEO Public Web

- Metadata API untuk setiap halaman.
- Schema.org untuk Event, SportsEvent, Organization, WebSite, BreadcrumbList, Article, ImageObject.
- Sitemap.xml dan robots.txt otomatis.
- OG image per halaman penting.
- Canonical URL.
- Server rendering untuk halaman publik.
- Static generation untuk halaman informatif yang jarang berubah.
- Core Web Vitals hijau.

## 11. Security Baseline

- Keycloak OIDC/OAuth2.
- Authorization Code + PKCE untuk web/mobile.
- MFA admin.
- RBAC/ABAC.
- JWT validation di API Gateway dan service.
- HTTPS, HSTS, secure cookie, CSRF untuk web session, CORS strict.
- Input validation, output encoding, SQL injection prevention.
- Secret management.
- File upload scanning.
- Dependency dan container scanning.
- Audit log untuk data kritis.
- JWT Gateway wajib mempunyai issuer, expiry, subject, serta `azp`/audience client yang valid; role sensitif berasal dari `realm_access.roles` token tervalidasi.
- `CORS_ALLOWED_ORIGINS` production harus origin HTTPS eksplisit. `INTERNAL_STREAM_TOKEN` production minimal 32 karakter, bukan nilai template/development.
- Gateway menghapus header actor/IP/credential internal dari klien dan membentuk ulang actor/IP dari context serta socket tepercaya. Public SSE tidak mengekspos metadata operator.

## 12. Observability

Wajib: Prometheus, Grafana, Loki, OpenTelemetry, Sentry, Uptime Kuma, Alertmanager.

Metrik: API latency p95/p99, error rate, DB query time, Redis hit ratio, NATS consumer lag, WebSocket connection count, failed login rate, LiveScore event latency, CPU/memory/disk, queue lag.

## 13. Testing

Backend: unit, integration, contract, migration, load, stress, security.  
Frontend: component, E2E, accessibility, visual regression, performance, PWA installability.  
Mobile: device compatibility, offline queue, push notification, deep link, secure storage, crash reporting.

## 14. Deployment VM Diskominfo

Minimum: Docker, Docker Compose staging, Nginx reverse proxy, SSL/TLS, PostgreSQL, Redis, NATS JetStream, Keycloak, monitoring, backup otomatis, log aggregation.

Pastikan tidak ada secret di repository, backup restore drill dilakukan, domain dan sertifikat valid, health check tiap service aktif, serta runbook insiden tersedia.

## 15. Dokumen Referensi

Simpan di `docs/reference/` dan `design/`:
- BRD/PRD/SRS/SDD Portal PORPROV.
- ASCII Wireframe Portal PORPROV.
- Dokumen Perencanaan Arsitektur Enterprise Web & Mobile.
- PORPROV_ENTERPRISE_BLUEPRINT.md (Master Specification Document).
- Custom GPT Instructions/Knowledge.
- Keputusan arsitektur/ADR.

## 16. Standar Teknis Soft Delete

### 16.1 Skema dan Query

Semua entity persisten yang dapat dihapus wajib memakai kolom berikut sesuai kebutuhan domain:

```sql
deleted_at TIMESTAMPTZ NULL,
deleted_by UUID NULL,
delete_reason TEXT NULL
```

Jika identitas actor belum berbentuk UUID pada service tertentu, tipe `deleted_by` boleh mengikuti subject/actor ID yang digunakan service dan harus didokumentasikan. Query aktif memakai `WHERE deleted_at IS NULL`; query recycle bin menggunakan scope terpisah dan authorization khusus. Unique key yang dapat dipakai kembali setelah delete menggunakan partial unique index untuk record aktif.

Migration harus backward-safe. Jangan memakai cascade hard delete sebagai workflow bisnis atau membuat foreign key lintas database service.

### 16.2 API, Restore, Audit, dan Event

- `DELETE /resources/{id}` melakukan update soft delete yang idempotent, bukan SQL `DELETE`.
- Simpan actor, timestamp, reason, request ID, dan before-state pada audit trail.
- `POST /resources/{id}/restore` mengaktifkan kembali record setelah authorization dan pemeriksaan konflik.
- List/get publik maupun operasional tidak menampilkan record terhapus tanpa scope khusus.
- Event `resource.deleted` dan `resource.restored` dipublikasikan melalui outbox/NATS JetStream jika dibutuhkan consumer lintas service.
- UI Admin menampilkan Recycle Bin atau filter archived sesuai role; Public Web tidak boleh mengekspos data terhapus.

### 16.3 Media Library dan Purge

Soft delete media menyembunyikan metadata dari daftar aktif dan selector serta membuat delivery publik menolak file tersebut. File/object tetap disimpan di storage privat/terkontrol untuk restore. Purge fisik dijalankan oleh job terkontrol setelah masa retensi `[TBD — perlu keputusan produk dan legal]`, setelah memastikan tidak ada referensi aktif, dengan role khusus dan audit. Endpoint delete umum tidak boleh menghapus file fisik.

### 16.4 Implementasi Aktif Master Data, Media, Venue, dan Jadwal

Implementasi aktif memakai `deleted_by TEXT` karena identitas actor berasal dari claim JWT `sub` Keycloak. API Gateway selalu menghapus `X-Actor-ID` dari request klien lalu mengisinya kembali dari JWT yang sudah tervalidasi, serta meneruskan `X-Request-ID`. Endpoint Recycle Bin dan restore memerlukan autentikasi; pemetaan role granular merupakan tahap hardening RBAC berikutnya.

| Database/service | Migration | Entity aktif |
|---|---:|---|
| `master_data_db` / Master Data | v5 | Cabor, Nomor Pertandingan, Kontingen, City Guide, Media |
| `venue_db` / Venue | v2 | Venue |
| `schedule_db` / Schedule | v4 | Jadwal/Match serta tabel legacy terkait |
| `livescore_db` / LiveScore | v1 | Revision append-only, current projection, transactional outbox |
| `porprov_db` / Medal Standing | v3 | Official standings, submissions/history, separated workflow actors, outbox |
| `audit_db` / Audit | v2 | Immutable/deduplicated audit event dengan payload hash |

Endpoint Admin melalui API Gateway:

| Method dan path | Fungsi |
|---|---|
| `DELETE /api/v1/master-data/{resource}/{id}` | Mengarsipkan Cabor, Nomor, Kontingen, City Guide, atau Media dengan body opsional `{"reason":"..."}` |
| `GET /api/v1/master-data/deleted` | Tombstone gabungan Master Data dan Media |
| `POST /api/v1/master-data/deleted/{entity}/{id}/restore` | Restore entity `cabor`, `nomor_tanding`, `kontingen`, `city_guide`, atau `media` |
| `DELETE /api/v1/venues/{id}` / `POST /api/v1/venues/{id}/restore` | Arsip/restore Venue |
| `GET /api/v1/venues/deleted` | Tombstone Venue |
| `DELETE /api/v1/schedule/matches/{id}` / `POST /api/v1/schedule/matches/{id}/restore` | Arsip/restore Jadwal |
| `GET /api/v1/schedule/matches/deleted` | Tombstone Jadwal |

Aturan integritas yang aktif:

- Cabor tidak dapat diarsipkan bila masih memiliki Nomor Pertandingan aktif.
- Nomor Pertandingan dan Venue tidak dapat diarsipkan bila masih dirujuk Jadwal aktif; pemeriksaan lintas service bersifat fail-closed melalui `SCHEDULE_SERVICE_URL`.
- Jadwal hanya dapat dipulihkan bila Nomor Pertandingan dan Venue referensinya sudah aktif kembali.
- Media yang diarsipkan hilang dari list/selector dan `/uploads/{file}` mengembalikan `404`; setelah restore delivery kembali `200` tanpa mengunggah ulang file.
- Delete dan restore bersifat idempotent. Operasi yang benar-benar mengubah state menerbitkan event audit NATS berisi actor, reason/request ID, serta snapshot record/tombstone. Audit Service kini menyimpan event yang diterima secara immutable, tetapi publisher Master/Media/Venue/Jadwal masih best-effort dan belum memakai transactional outbox.

Verifikasi 14 Juli 2026 mencakup `go test ./...` pada Master Data, Venue, Schedule, dan API Gateway; lint dan production build Admin; Compose config/build; runtime test delete–invisibility–restore–dependency guard–media retention; serta migration state `master=5`, `venue=2`, `schedule=4`, seluruhnya `dirty=false`. Keputusan implementasi dicatat pada `docs/adr/ADR-0002-soft-delete-and-port-namespaces.md`.

### 16.5 LiveScore, Medali, Transactional Outbox, dan Audit Immutable

- LiveScore menyimpan `livescore_revisions` yang ditolak trigger bila di-UPDATE/DELETE, serta `livescore_current` untuk projection baca. Sequence berasal dari revision database. `expectedRevision` mencegah operator menimpa state yang sudah berubah; update stale menghasilkan `409`.
- Update/koreksi LiveScore hanya diterima untuk match Schedule aktif. Submission Medali hanya diterima untuk Kontingen Master Data aktif. Dependency yang gagal menghasilkan `503`; referensi tombstone/tidak ada menghasilkan `422`.
- Medali menyimpan `medal_submissions` dan history append-only. Hanya `PENDING → VERIFIED → OFFICIAL` yang menambah standings; reject dapat berasal dari PENDING/VERIFIED. Actor submit/verify/reject/publish tidak saling menimpa.
- LiveScore dan Medali menulis state serta `outbox_events` pada transaksi yang sama. Worker melakukan atomic claim, JetStream publish, acknowledgement, dan retry/backoff. Delivery at-least-once didedup melalui event ID pada Audit Service.
- Audit migration v2 menambahkan event metadata, actor/request/IP, unique event ID, SHA-256 payload, dan trigger immutable. Legacy event tanpa UUID diberi deterministic ID. Invalid poison message dihentikan; kegagalan database tetap di-NAK untuk retry.
- Public stream hanya membawa projection aman; private stream melewati JWT/role Gateway dan internal token. Detail keputusan terdapat pada `docs/adr/ADR-0004-secure-realtime-transactional-outbox-and-verification.md`.

### 16.6 Strategi Migrasi Implementasi Lama dan Domain Baru

1. Tambahkan kolom soft delete dan partial indexes melalui migration per service.
2. Ubah query generated/sqlc agar seluruh read aktif mengecualikan record terhapus.
3. Ubah handler delete menjadi update idempotent dan tambahkan restore.
4. Tambahkan audit/outbox event serta permission recycle bin/purge; jangan menganggap event best-effort setara dengan audit immutable.
5. Ubah UI agar mengomunikasikan arsip/restore, bukan penghapusan permanen.
6. Uji delete, invisibility, restore, uniqueness conflict, authorization, audit, idempotency, referential behavior, dan purge bila kebijakannya sudah disetujui.
7. Baru setelah seluruh quality gate lulus, ubah status fitur terkait menjadi Done/Final pada `FEATURES.md`.

## 17. Sinkronisasi Enam Markdown Root

Setiap perubahan aturan atau standar harus disebarkan sesuai fungsi dokumen pada pekerjaan yang sama:

| Dokumen | Peran |
|---|---|
| `README.md` | Orientasi aplikasi dan baseline penting |
| `AI.md` | Pintu masuk dan konteks ringkas agent |
| `AGENTS.md` | Protokol kerja dan handoff |
| `RULES.md` | Sumber aturan normatif |
| `FEATURES.md` | Status aktual, gap, dan technical debt |
| `DOCUMENTATION.md` | Detail implementasi, operasi, dan runbook |

Perubahan arsitektur tetap dicatat dalam ADR dan perubahan fitur tetap memperbarui `FEATURES.md`. Tanggal/status harus faktual; jangan menandai kepatuhan selesai sebelum migration, code, dan test tersedia.
