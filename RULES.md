# RULES.md — Aturan Mutlak Codex Agent Portal PORPROV Enterprise UI/UX v3

Dokumen ini mengikat semua agent AI/Codex saat membuat, mengubah, menguji, atau mendokumentasikan aplikasi Portal PORPROV XV Jawa Barat 2026.

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
| UI System | Tailwind CSS v4.x, design tokens, mobile-first, accessible components |


## 2. Arsitektur Repositori Wajib

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

## 3. Protokol Strict Full Code

- Saat membuat atau memperbarui file kode, tampilkan **full code dari baris pertama sampai terakhir**.
- Wajib menyebutkan **nama file dan path** sebelum blok kode.
- Dilarang menulis `...`, `kode sebelumnya`, `sisanya sama`, `dst`, `dll`, atau placeholder kosong.
- Bila perubahan terlalu besar, pecah menjadi tahap kecil dan **wajib meminta konfirmasi** sebelum lanjut.

## 4. Protokol Konfirmasi Tahap

Agent wajib berhenti dan bertanya: **"Konfirmasi: lanjut ke Tahap X?"** setelah menyelesaikan foundation, infra, auth, backend, public web, admin web, mobile, realtime, testing, hardening, atau deployment.

## 5. Aturan UI/UX Benchmark

| Sumber Inspirasi | Prinsip yang Diambil | Adaptasi PORPROV |
|---|---|---|
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Fitness Zone | Hero energik, CTA visual, schedule section, gallery, cards promosi, atmosfer event | Landing page PORPROV, countdown, kartu venue, Depok Guide, galeri acara, promosi kota |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |


Aturan:
- Ambil pola terbaik, bukan menyalin tampilan identik.
- Flashscore-inspired: match card, filter, standings, compact dense data, realtime connection state.
- ESPN-inspired: editorial card, highlights, sports news, media center, athlete/venue story.
- Fitness Zone-inspired: hero energik, countdown, CTA, schedule, gallery, venue/event promotion.
- Tailwind v4.x digunakan untuk membangun design system, bukan styling acak.

## 6. Design System Tailwind v4.x

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
- Gunakan PWA installable untuk kebutuhan "Chrome App".
- Realtime publik dapat memakai WebSocket atau SSE sesuai kebutuhan.

## 8. Aturan Admin Web — React Dashboard

- Gunakan React + TypeScript + Tailwind + TanStack Query.
- Admin tidak wajib SEO, tetapi wajib cepat, aman, dan realtime.
- Wajib memiliki role-based sidebar, global search, data table, filter kompleks, approval workflow, notification center, audit log, export Excel/PDF, dan dashboard KPI.
- Data besar harus memakai pagination server-side atau virtualization.

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

## 12. Auth dan Security

- Auth wajib melalui Keycloak + OIDC/OAuth2 + JWT.
- Web dan mobile gunakan Authorization Code + PKCE.
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
