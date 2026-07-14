# FEATURES.md — Feature Tracking Portal PORPROV Enterprise UI/UX v4

Dokumen ini melacak status implementasi fitur, komponen, arsitektur, dan quality gates. Agent wajib membaca dan memperbarui dokumen ini sebelum dan sesudah pekerjaan.

> **Baseline aktif per 14 Juli 2026:** Techwind 3.3.0 pada `theme-reference/HTML/Landing/` menjadi referensi utama Public Web dan `theme-reference/HTML/Dashboard/` menjadi referensi utama Admin Web. Semua delete data persisten wajib soft delete. Status di bawah harus mencerminkan implementasi nyata, bukan hanya target desain.

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
| Struktur monorepo enterprise | `[ ] Planned` | v0.1 | `apps/`, `services/`, `packages/`, `infra/`, `docs/` | Sesuai RULES v4 |
| README root | `[x] Done` | v4.0 | `README.md` | Orientasi aplikasi, baseline UI/UX, soft delete, dan sinkronisasi pedoman |
| AI/Codex docs | `[x] Done` | v4.0 | enam Markdown root | Identitas produk, Techwind, masterpiece quality bar, soft delete, dan aturan sinkronisasi sudah diselaraskan |
| Reference docs | `[?] TBD` | v0.1 | `docs/reference/` | Salin BRD/PRD/SRS/SDD dan wireframe |

## 2. Design System & UI/UX

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Benchmark UI/UX Flashscore | `[x] Done` | v4.0 | enam Markdown root | Ambil pola LiveScore, filter, standings, bukan clone |
| Benchmark UI/UX ESPN | `[x] Done` | v4.0 | enam Markdown root | Ambil pola editorial, highlights, sports media |
| Baseline Techwind Public | `[~] In Progress` | v4.0 | `theme-reference/HTML/Landing/`, `apps/public-web-nextjs/` | Referensi ditetapkan; audit dan adaptasi komponen Public Web belum selesai |
| Baseline Techwind Admin | `[~] In Progress` | v4.0 | `theme-reference/HTML/Dashboard/`, `apps/admin-web-react/` | Referensi ditetapkan; penyelarasan masterpiece seluruh modul belum selesai |
| Masterpiece quality gate | `[~] In Progress` | v4.0 | public/admin/design system | State lengkap, WCAG 2.2 AA, responsive, performance, visual regression, dan konsistensi token harus diverifikasi per modul |
| Tailwind v4.x design tokens | `[ ] Planned` | v0.1 | `packages/design-tokens/` | Warna PORPROV, status badge, typography |
| Component blueprint | `[ ] Planned` | v0.1 | `packages/ui/` | Button, Card, Badge, Tabs, FilterBar |
| Match card | `[ ] Planned` | v0.1 | `packages/ui/MatchCard` | Flashscore-inspired |
| Editorial card | `[ ] Planned` | v0.1 | `packages/ui/EditorialCard` | ESPN-inspired |
| Event hero | `[ ] Planned` | v0.1 | `apps/public-web-nextjs/` | Adaptasi Techwind Landing dengan identitas dan konten PORPROV |
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
| Vite React setup | `[x] Done` | v0.2 | `apps/admin-web-react/` | TypeScript + Tailwind v4; build produksi dan image Nginx teruji |
| Role-based sidebar | `[ ] Planned` | v0.1 | admin layout | Menu sesuai RBAC |
| Master data | `[x] Done` | v0.4 | cabor, nomor pertandingan, venue, kontingen, jadwal, City Guide | CRUD, pencarian, referensi, Media Selector, soft delete beralasan, dependency guard, dan restore melalui Recycle Bin teruji end-to-end; RBAC granular dilanjutkan pada tahap hardening |
| Media Library | `[x] Done` | v0.4 | `components/media/`, master-data-service | Upload/selector/URL relatif, soft delete metadata, penyembunyian delivery publik, retensi file, dan restore teruji; kebijakan purge tetap TBD |
| Recycle Bin Admin | `[x] Done` | v0.4 | `components/master-data/RecycleBin.tsx` | Menggabungkan tombstone Master Data, Media, Venue, dan Jadwal dengan pencarian, status, actor/alasan, serta restore aksesibel |
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
| API Gateway | `[~] In Progress` | v0.2 | `services/api-gateway/` | JWT dan routing upstream berbasis environment selesai; rate limit/RBAC rinci belum lengkap |
| Master Data Service | `[~] In Progress` | v0.4 | `services/master-data-service/` | CRUD serta soft delete/restore Cabor, Nomor, Kontingen, City Guide, dan Media sudah teruji; immutable audit persistence/outbox dan RBAC granular belum selesai |
| Venue Service | `[~] In Progress` | v0.4 | `services/venue-service/` | CRUD, soft delete/restore, dan fail-closed schedule dependency guard sudah teruji; hardening authorization/audit masih bertahap |
| Schedule Service | `[~] In Progress` | v0.4 | `services/schedule-service/` | CRUD, validasi referensi, soft delete/restore, dan reference endpoint sudah teruji; bracket belum tersedia |
| LiveScore Service | `[ ] Planned` | v0.1 | `services/livescore-service/` | Event sourcing |
| Realtime Gateway | `[~] In Progress` | v0.2 | `services/realtime-gateway/` | SSE fanout, cache Redis, consumer durable LiveScore/Medals, dan bootstrap stream JetStream idempotent tersedia; autentikasi stream, observability, serta scale-out fanout belum final |
| Medal Standing Service | `[ ] Planned` | v0.1 | `services/medal-standing-service/` | Aggregation |
| Notification Service | `[ ] Planned` | v0.1 | `services/notification-service/` | Push/in-app |
| Audit Service | `[ ] Planned` | v0.1 | `services/audit-service/` | Immutable log |

## 7. Infrastruktur, Security, Testing

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Docker Compose staging | `[~] In Progress` | v0.2 | `infra/docker/` | Admin, gateway, master, venue, schedule, migrasi, health check, dan volume media berjalan; service domain lain masih bertahap |
| Registry port portable | `[x] Done` | v0.3 | Compose, config service, `.env.example`, enam Markdown root | Public, diagnostic, local debug `28xxx`, dan infra host dipisahkan; seluruh host mapping configurable |
| Gateway CORS ownership | `[x] Done` | v0.3 | API Gateway router + Admin development env | Header CORS downstream dibuang sebelum kebijakan Gateway diterapkan; regression test menjamin satu origin dan Admin `npm run dev` otomatis memakai Gateway lokal `28000` |
| Nginx SSL | `[ ] Planned` | v0.1 | `infra/nginx/` | Reverse proxy |
| Keycloak realm dan Admin OIDC | `[~] In Progress` | v0.2 | `infra/docker/create_clients.sh`, Admin Web | Realm/client bootstrap idempotent, callback lokal 5173/5174, origin eksplisit, dan Authorization Code + PKCE S256 aktif; role granular, theme PORPROV, rotasi secret, serta konfigurasi production belum final |
| NATS JetStream | `[ ] Planned` | v0.1 | `infra/nats/` | Durable event |
| PostgreSQL per service | `[ ] Planned` | v0.1 | `infra/postgres/` | Database per service |
| Redis | `[ ] Planned` | v0.1 | `infra/redis/` | Cache/presence/rate limit |
| Observability | `[ ] Planned` | v0.1 | `infra/monitoring/` | Prometheus/Grafana/Loki/Otel |
| Security scan | `[ ] Planned` | v0.1 | CI/CD | Trivy/Sonar/SAST |
| Load & stress test | `[ ] Planned` | v0.1 | `tests/k6/` | Tidak boleh klaim lulus sebelum diuji |
| Master Data soft-delete integration test | `[x] Done` | v0.4 | admin + gateway + master/venue/schedule | Runtime Docker teruji untuk actor auth, delete idempotent, active get `404`, dependency guard `409`, restore berurutan, dan media delivery `404/200`; record QA akhir tetap menjadi tombstone beralasan karena purge produksi tidak dibuka |

## 8. Kepatuhan Soft Delete

| Area | Status | Target | Catatan |
|---|---|---|---|
| Skema standar `deleted_at/deleted_by/delete_reason` | `[x] Done` | Master Data, Media, Venue, Schedule | Migration backward-safe aktif: master v5, venue v2, schedule v4; partial unique index dipakai untuk nama aktif yang relevan |
| Default query scope | `[x] Done` | Master Data, Media, Venue, Schedule | List/get/update/relation aktif mengecualikan tombstone; media yang diarsipkan tidak dilayani publik |
| Restore API dan Recycle Bin | `[x] Done` | Admin + gateway + service inti | Endpoint dilindungi JWT, actor diturunkan Gateway, restore idempotent, dan konflik referensi menghasilkan `409`; role granular masuk tahap RBAC |
| Audit dan event delete/restore | `[~] In Progress` | API/service/NATS | Actor, reason, request ID, dan snapshot tombstone dikirim sebagai event NATS; durable outbox, event version, dan penyimpanan audit immutable belum selesai |
| Retensi dan purge Media Library | `[?] TBD` | master-data/file storage | Masa retensi memerlukan keputusan produk/legal; file tidak dihapus saat soft delete |
| Test kepatuhan soft delete | `[x] Done` | service inti + gateway + Admin | Unit/contract/runtime mencakup auth actor, anti-spoofing, delete, hidden query/media, restore, dependency conflict, idempotency, build, dan migration; purge tetap dikecualikan sampai kebijakan disetujui |

## Checklist Pre-Commit Agent

- [ ] Tidak menyentuh fitur `[x] Final` tanpa izin eksplisit.
- [ ] Full code lengkap per file dan path.
- [ ] Mobile-first dan aksesibel.
- [ ] SEO untuk public web tetap utuh.
- [ ] Tidak ada secret di kode.
- [ ] Auth/RBAC diterapkan sesuai role.
- [ ] Event bisnis kritis memakai NATS JetStream.
- [ ] Redis tidak dipakai sebagai satu-satunya event broker kritis.
- [ ] Semua delete data persisten menggunakan soft delete dan memiliki alur restore/audit.
- [ ] Hard delete hanya tersedia sebagai purge terkontrol sesuai retensi dan role khusus.
- [ ] UI Public/Admin mengikuti baseline Techwind yang relevan dan quality bar masterpiece.
- [ ] Test relevan dijalankan atau dijelaskan.
- [ ] Enam Markdown root yang terdampak aturan/standar telah sinkron.
- [ ] Dokumentasi, ADR, dan feature tracking diperbarui sesuai perubahan.
