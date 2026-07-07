# DOCUMENTATION.md — Dokumentasi Teknis Portal PORPROV Enterprise UI/UX v3

## 1. Ringkasan

Portal PORPROV XV Jawa Barat 2026 adalah platform sports event berbasis web dan mobile yang menyediakan informasi PORPROV, cabor, jadwal, venue/maps, LiveScore realtime, standings medali, galeri, Depok Guide, backend admin, dan aplikasi koresponden.

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
| UI System | Tailwind CSS v4.x, design tokens, mobile-first, accessible components |


## 3. Struktur Repositori

```text
porprov-xv/
├── README.md
├── AI.md
├── AGENTS.md
├── RULES.md
├── FEATURES.md
├── DOCUMENTATION.md
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
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Fitness Zone | Hero energik, CTA visual, schedule section, gallery, cards promosi, atmosfer event | Landing page PORPROV, countdown, kartu venue, Depok Guide, galeri acara, promosi kota |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |


### 4.1 Public Web Experience

- Gaya informasi: cepat, padat, SEO-friendly, sports-event storytelling.
- Halaman utama: hero, countdown, CTA, Live Now, Jadwal Hari Ini, standings medali, cabor, venue, galeri, Depok Guide.
- Navigasi mobile: bottom nav untuk Home, Jadwal, Live, Venue, Medali.
- Navigasi desktop: top nav + sticky score ticker.
- Gunakan match card padat untuk LiveScore.
- Gunakan editorial card untuk berita, highlight atlet, dan galeri.
- Gunakan venue cards untuk peta, rute, fasilitas, rekomendasi sekitar.

### 4.2 Admin Web Experience

- Dashboard berbasis sidebar.
- KPI cards, realtime notification, queue panel, approval panel.
- Data table besar dengan server-side pagination, filter, sort, search, export.
- Role-based menu untuk SUPER_ADMIN, ADMIN_ORGANISASI, OPERATOR, VERIFIKATOR, PETUGAS_LAPANGAN, AUDITOR.

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

## 6. Domain Service

| Service | Tanggung Jawab |
|---|---|
| API Gateway | Routing, auth, rate limit, request id |
| Auth Adapter | Integrasi Keycloak, user claims, RBAC |
| User Service | User, role mapping, profile dasar |
| Master Data Service | Cabor, venue, kontingen, atlet |
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
