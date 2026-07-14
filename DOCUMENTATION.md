# DOCUMENTATION.md — Dokumentasi Teknis Portal PORPROV Enterprise UI/UX v4

## 1. Ringkasan

Portal PORPROV XV Jawa Barat 2026 adalah platform sports event berbasis web dan mobile yang menyediakan informasi PORPROV, cabor, jadwal, venue/maps, LiveScore realtime, standings medali, galeri, Depok Guide, backend admin, dan aplikasi koresponden.

Konteks aktif per 14 Juli 2026: Admin Web, API Gateway, Master Data Service, Venue Service, Schedule Service, serta Media Library telah terintegrasi dalam runtime Docker. Soft delete end-to-end pada Cabor, Nomor Pertandingan, Kontingen, City Guide, Media, Venue, dan Jadwal sudah diterapkan beserta Recycle Bin dan restore. Hardening RBAC granular, durable outbox/audit immutable, serta kebijakan retensi dan purge tetap menjadi pekerjaan lanjutan sesuai `FEATURES.md`.

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
| UI System | Techwind 3.3.0 sebagai baseline visual, Tailwind CSS v4.x, design tokens PORPROV, mobile-first, accessible components |


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

## 4. Prinsip UI/UX

| Sumber Inspirasi | Prinsip yang Diambil | Adaptasi PORPROV |
|---|---|---|
| `theme-reference/HTML/Landing/` | Baseline Techwind Public Web | Navigasi, hero, event sections, editorial, gallery, CTA, auth, dan footer dipetakan ke komponen Next.js PORPROV |
| `theme-reference/HTML/Dashboard/` | Baseline Techwind Admin Web | Application shell, sidebar, topbar, KPI, form, table, calendar, gallery, dan profile dipetakan ke komponen React PORPROV |
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |

Techwind 3.3.0 adalah baseline visual lokal, bukan runtime atau brand aplikasi. HTML/Gulp pada `theme-reference/` dipakai untuk membaca struktur, ritme, responsive behavior, dan pola komponen, lalu diimplementasikan ulang sebagai React/Next.js dengan design tokens, asset, serta copywriting resmi PORPROV. Distribusi asset harus mematuhi lisensi yang dimiliki proyek.

Quality bar “masterpiece” mewajibkan hierarki visual kuat, grid/spacing/type yang konsisten, seluruh state loading/empty/error/success/disabled/offline/reconnect, mobile-first, WCAG 2.2 AA, reduced motion, performa, visual regression, dan tidak adanya demo content atau komponen duplikat tanpa alasan.


### 4.1 Public Web Experience

- Gaya informasi: cepat, padat, SEO-friendly, sports-event storytelling.
- Halaman utama: hero, countdown, CTA, Live Now, Jadwal Hari Ini, standings medali, cabor, venue, galeri, Depok Guide.
- Navigasi mobile: bottom nav untuk Home, Jadwal, Live, Venue, Medali.
- Navigasi desktop: top nav + sticky score ticker.
- Gunakan match card padat untuk LiveScore.
- Gunakan editorial card untuk berita, highlight atlet, dan galeri.
- Gunakan venue cards untuk peta, rute, fasilitas, rekomendasi sekitar.
- Referensi awal yang relevan pada Techwind Landing antara lain pola event, gym, blog/editorial, gallery, auth, dan landing; pilih per komponen, bukan menyalin satu halaman secara utuh.
- Ubah seluruh pola menjadi design language PORPROV: energi kompetisi, identitas Kota Depok, status realtime, CTA yang jelas, dan kepadatan informasi yang tetap terbaca.

### 4.2 Admin Web Experience

- Dashboard berbasis sidebar.
- KPI cards, realtime notification, queue panel, approval panel.
- Data table besar dengan server-side pagination, filter, sort, search, export.
- Role-based menu untuk SUPER_ADMIN, ADMIN_ORGANISASI, OPERATOR, VERIFIKATOR, PETUGAS_LAPANGAN, AUDITOR.
- Gunakan Techwind Dashboard sebagai baseline shell, sidebar/topbar, table, form, calendar, profile, gallery, dan feedback state; jangan memasukkan Gulp/theme JavaScript ke bundle React.
- Aksi delete harus diberi konfirmasi aksesibel, menjelaskan bahwa data masuk Recycle Bin/arsip, dan menyediakan restore sesuai permission.

### 4.3 Mobile Koresponden Experience

- Fokus pada tugas hari ini.
- Tombol input skor besar.
- Offline queue terlihat jelas.
- Status sinkronisasi selalu tampil.
- Upload bukti foto/dokumen.
- Scan QR match/venue jika tersedia.
- Jangan menampilkan dashboard berat di mobile.

## 5. Cara Menjalankan Development

### 5.1 Prasyarat

- Node.js LTS
- Go versi stabil
- Docker + Docker Compose
- PostgreSQL client
- NATS CLI opsional
- Keycloak admin access
- pnpm atau npm sesuai keputusan repo

### 5.2 Infrastruktur Lokal/Staging

```bash
cd infra/docker
docker compose up -d postgres redis nats keycloak nginx
```

Jika Docker CLI di Windows menampilkan `Access is denied` saat membaca `C:\Users\<user>\.docker\config.json`, gunakan helper lokal berikut agar konfigurasi Docker CLI disimpan di folder proyek:

```powershell
cd infra/docker
.\compose-up.ps1 postgres redis nats keycloak nginx
```

Jika muncul `permission denied while trying to connect to the docker API at npipe:////./pipe/docker_engine`, Docker Engine belum berjalan atau user Windows belum memiliki akses ke Docker Desktop. Buka Docker Desktop sampai engine aktif. Bila masih gagal, jalankan PowerShell sebagai Administrator:

```powershell
net localgroup docker-users $env:USERNAME /add
```

Logout atau restart Windows setelah menambahkan user ke grup `docker-users`.

### 5.3 Public Web

```bash
cd apps/public-web-nextjs
pnpm install
pnpm dev
```

### 5.4 Admin Web

```bash
cd apps/admin-web-react
pnpm install
pnpm dev
```

Admin Web menggunakan variabel berikut:

| Variabel | Default lokal | Fungsi |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Satu-satunya entry point API browser |
| `VITE_OIDC_AUTHORITY` | `http://localhost:8080/realms/porprov` | Authority Keycloak |
| `VITE_OIDC_CLIENT_ID` | `porprov-admin-web` | Client OIDC Admin Web |

Media Library dan seluruh form Master Data menggunakan API Gateway. Nilai media disimpan sebagai URL relatif `/uploads/<nama-acak>.<ext>` agar tetap valid saat domain atau port deployment berubah.

### 5.5 Backend Service

```bash
cd services/livescore-service
go mod tidy
go test ./...
go run ./cmd/server
```

### 5.6 Mobile

```bash
cd apps/mobile-admin-react-native
pnpm install
pnpm start
```

### 5.7 Stack Master Data dalam Docker

Jalankan stack Admin Web, API Gateway, Master Data, Venue, dan Schedule beserta migrasinya:

```powershell
cd infra/docker
docker compose up -d master-data-service venue-service schedule-service api-gateway admin-web prometheus
```

Port Docker development:

| Komponen | URL |
|---|---|
| Admin Web | `http://localhost:5173` |
| API Gateway | `http://localhost:8000` |
| Keycloak | `http://localhost:8080` |
| Master Data Service (diagnostik) | `http://localhost:18081` |
| Schedule Service (diagnostik) | `http://localhost:18082` |
| Venue Service (diagnostik) | `http://localhost:18087` |

Service browser tidak boleh menggunakan port diagnostik. Port tersebut hanya untuk pemeriksaan lokal; operasi Admin Web selalu melalui API Gateway.

Migration SQL dikemas ke image migration agar berfungsi pada workspace Windows di drive yang tidak dibagikan sebagai bind mount. Aset Media Library disimpan pada named volume `master_data_uploads`; soft delete media hanya menonaktifkan metadata dan delivery publik, tidak menghapus file dari volume.

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
| Public dev | `ADMIN_WEB_HOST_PORT`, `API_GATEWAY_HOST_PORT`, `KEYCLOAK_HOST_PORT` | `5173`, `8000`, `8080` |
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

Dengan demikian `go run .` tidak berebut port dengan container Docker. Service lokal mengakses PostgreSQL `15432`, NATS `14222`, dan Redis `16379`. Untuk menguji Admin terhadap Gateway lokal, set `VITE_API_URL=http://localhost:28000/api/v1`; default Admin Docker tetap memakai Gateway `8000`.

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
Mobile Koresponden/Admin
        ↓ POST score event
API Gateway + Auth
        ↓
LiveScore Service
        ↓ append event
NATS JetStream
        ↓ consume durable event
Projection Worker → PostgreSQL
        ↓
Realtime Gateway → WebSocket/SSE → Public Web/Admin/Mobile
        ↓
Audit Service
```

## 8. Database

Gunakan database per service. Integrasi data antar service dilakukan melalui event NATS JetStream, bukan join lintas database.

`venue-service` adalah pemilik data venue. `schedule-service` menyimpan UUID venue eksternal tanpa foreign key lintas database dan memvalidasi keberadaan venue melalui kontrak internal sebelum membuat atau memperbarui jadwal. Nomor pertandingan dimiliki `master-data-service` dan divalidasi dengan pola yang sama.

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

Simpan di `docs/reference/`:
- BRD/PRD/SRS/SDD Portal PORPROV.
- ASCII Wireframe Portal PORPROV.
- Dokumen Perencanaan Arsitektur Enterprise Web & Mobile.
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
- Delete dan restore bersifat idempotent. Operasi yang benar-benar mengubah state menerbitkan event audit NATS berisi actor, reason/request ID, serta snapshot record/tombstone. Durable outbox, event versioning, dan penyimpanan audit immutable belum diklaim selesai.

Verifikasi 14 Juli 2026 mencakup `go test ./...` pada Master Data, Venue, Schedule, dan API Gateway; lint dan production build Admin; Compose config/build; runtime test delete–invisibility–restore–dependency guard–media retention; serta migration state `master=5`, `venue=2`, `schedule=4`, seluruhnya `dirty=false`. Keputusan implementasi dicatat pada `docs/adr/ADR-0002-soft-delete-and-port-namespaces.md`.

### 16.5 Strategi Migrasi Implementasi Lama dan Domain Baru

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
