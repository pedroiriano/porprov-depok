# FEATURES.md — Feature Tracking Portal PORPROV Enterprise UI/UX v3

Dokumen ini melacak status implementasi fitur, komponen, arsitektur, dan quality gates. Agent wajib membaca dan memperbarui dokumen ini sebelum dan sesudah pekerjaan.

## Status Legend

| Status | Makna |
|---|---|
| `[ ] Planned` | Direncanakan, belum dikerjakan |
| `[~] In Progress` | Sedang dikerjakan |
| `[x] Done` | Selesai dan sudah diuji sesuai tahap |
| `[x] Final` | Terkunci, dilarang diubah tanpa izin eksplisit |
| `[!] Broken` | Pernah berjalan tetapi bermasalah |
| `[?] TBD` | Butuh keputusan/validasi |

## 1. Foundation & Repository

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Struktur monorepo enterprise | `[ ] Planned` | v0.1 | `apps/`, `services/`, `packages/`, `infra/`, `docs/` | Sesuai RULES v3 |
| README root | `[ ] Planned` | v0.1 | `README.md` | Panduan menjalankan repo |
| AI/Codex docs | `[x] Done` | v3.0 | `AI.md`, `RULES.md`, `AGENTS.md`, `DOCUMENTATION.md` | Versi pedoman |
| Reference docs | `[?] TBD` | v0.1 | `docs/reference/` | Salin BRD/PRD/SRS/SDD dan wireframe |

## 2. Design System & UI/UX

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Benchmark UI/UX Flashscore | `[x] Done` | v3.0 | `docs/uiux/benchmark.md` | Ambil pola LiveScore, filter, standings, bukan clone |
| Benchmark UI/UX ESPN | `[x] Done` | v3.0 | `docs/uiux/benchmark.md` | Ambil pola editorial, highlights, sports media |
| Benchmark UI/UX Fitness Zone | `[x] Done` | v3.0 | `docs/uiux/benchmark.md` | Ambil hero, CTA, schedule, gallery |
| Tailwind v4.x design tokens | `[ ] Planned` | v0.1 | `packages/design-tokens/` | Warna PORPROV, status badge, typography |
| Component blueprint | `[ ] Planned` | v0.1 | `packages/ui/` | Button, Card, Badge, Tabs, FilterBar |
| Match card | `[ ] Planned` | v0.1 | `packages/ui/MatchCard` | Flashscore-inspired |
| Editorial card | `[ ] Planned` | v0.1 | `packages/ui/EditorialCard` | ESPN-inspired |
| Event hero | `[ ] Planned` | v0.1 | `apps/public-web-nextjs/` | Fitness Zone-inspired |
| Skeleton loading | `[ ] Planned` | v0.1 | public/admin/mobile | LiveScore, standings, jadwal |
| Accessibility baseline | `[ ] Planned` | v0.1 | global | Focus state, ARIA, 44px tap target |

## 3. Public Web — Next.js PWA

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| App Router setup | `[ ] Planned` | v0.1 | `apps/public-web-nextjs/` | TypeScript + Tailwind |
| SEO metadata system | `[ ] Planned` | v0.1 | `app/**/metadata` | Metadata API |
| PWA installability | `[ ] Planned` | v0.1 | manifest/service worker | Pengganti Chrome App |
| Beranda | `[ ] Planned` | v0.1 | `/` | Hero, Live Now, Jadwal, Medali, Depok Guide |
| Cabor listing/detail | `[ ] Planned` | v0.1 | `/cabor` | 11 cabor dari booklet |
| Jadwal | `[ ] Planned` | v0.1 | `/jadwal` | Filter tanggal/cabor/venue |
| Venue & Maps | `[ ] Planned` | v0.1 | `/venue` | Peta, rute, fasilitas, rekomendasi |
| LiveScore | `[ ] Planned` | v0.1 | `/livescore` | Realtime tanpa refresh |
| Standings Medali | `[ ] Planned` | v0.1 | `/medali` | Official standings |
| Galeri | `[ ] Planned` | v0.1 | `/galeri` | Foto/video |
| Depok Guide | `[ ] Planned` | v0.1 | `/depok-guide` | Coffee shop, kuliner, penginapan, wisata, RS |

## 4. Admin Web — React Dashboard

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Vite React setup | `[ ] Planned` | v0.1 | `apps/admin-web-react/` | TypeScript + Tailwind |
| Role-based sidebar | `[ ] Planned` | v0.1 | admin layout | Menu sesuai RBAC |
| Master data | `[ ] Planned` | v0.1 | cabor, venue, kontingen, atlet | CRUD + import |
| LiveScore center | `[ ] Planned` | v0.1 | admin livescore | Monitoring input skor |
| Verification workflow | `[ ] Planned` | v0.1 | admin verifikasi | Submitted → verified → official |
| Audit log | `[ ] Planned` | v0.1 | admin audit | Filter, export, immutable log |
| Export | `[ ] Planned` | v0.1 | admin report | XLSX/PDF/CSV |

## 5. Mobile Apps — React Native

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Public Mobile | `[x] Done` | v0.1 | `apps/mobile-public-react-native/` | UI Jadwal, LiveScore, medali, Cabor |
| Admin/Koresponden Mobile | `[ ] Planned` | v0.1 | `apps/mobile-admin-react-native/` | Input skor, bukti foto, offline queue |
| Secure storage | `[ ] Planned` | v0.1 | mobile auth | Token aman |
| Push notification | `[ ] Planned` | v0.1 | mobile notification | FCM/APNs |
| Offline queue | `[ ] Planned` | v0.1 | mobile sync | LiveScore lapangan |

## 6. Backend & Realtime

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| API Gateway | `[ ] Planned` | v0.1 | `services/api-gateway/` | Auth, rate limit, routing |
| Master Data Service | `[x] Done` | v0.1 | `services/master-data-service/` | Cabor, venue, kontingen |
| Schedule Service | `[ ] Planned` | v0.1 | `services/schedule-service/` | Jadwal & bracket |
| LiveScore Service | `[ ] Planned` | v0.1 | `services/livescore-service/` | Event sourcing |
| Realtime Gateway | `[ ] Planned` | v0.1 | `services/realtime-gateway/` | WebSocket/SSE |
| Medal Standing Service | `[ ] Planned` | v0.1 | `services/medal-standing-service/` | Aggregation |
| Notification Service | `[ ] Planned` | v0.1 | `services/notification-service/` | Push/in-app |
| Audit Service | `[ ] Planned` | v0.1 | `services/audit-service/` | Immutable log |

## 7. Infrastruktur, Security, Testing

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Docker Compose staging | `[~] In Progress` | v0.1 | `infra/docker/` | Compose valid; helper lokal `compose-up.ps1` ditambahkan untuk bypass Docker CLI config user yang access denied |
| Nginx SSL | `[ ] Planned` | v0.1 | `infra/nginx/` | Reverse proxy |
| Keycloak realm | `[ ] Planned` | v0.1 | `infra/keycloak/` | OIDC/RBAC |
| NATS JetStream | `[ ] Planned` | v0.1 | `infra/nats/` | Durable event |
| PostgreSQL per service | `[ ] Planned` | v0.1 | `infra/postgres/` | Database per service |
| Redis | `[ ] Planned` | v0.1 | `infra/redis/` | Cache/presence/rate limit |
| Observability | `[ ] Planned` | v0.1 | `infra/monitoring/` | Prometheus/Grafana/Loki/Otel |
| Security scan | `[ ] Planned` | v0.1 | CI/CD | Trivy/Sonar/SAST |
| Load & stress test | `[ ] Planned` | v0.1 | `tests/k6/` | Tidak boleh klaim lulus sebelum diuji |

## Checklist Pre-Commit Agent

- [ ] Tidak menyentuh fitur `[x] Final` tanpa izin eksplisit.
- [ ] Full code lengkap per file dan path.
- [ ] Mobile-first dan aksesibel.
- [ ] SEO untuk public web tetap utuh.
- [ ] Tidak ada secret di kode.
- [ ] Auth/RBAC diterapkan sesuai role.
- [ ] Event bisnis kritis memakai NATS JetStream.
- [ ] Redis tidak dipakai sebagai satu-satunya event broker kritis.
- [ ] Test relevan dijalankan atau dijelaskan.
- [ ] Dokumentasi dan fitur tracking diperbarui.
