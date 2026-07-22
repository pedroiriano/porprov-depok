# FEATURES.md — Feature Tracking Portal PORPROV Enterprise UI/UX v4

Dokumen ini melacak status implementasi fitur, komponen, arsitektur, dan quality gates. Agent wajib membaca dan memperbarui dokumen ini sebelum dan sesudah pekerjaan.

> **Aturan aktif per 22 Juli 2026:** Techwind 3.3.0 pada `theme-reference/HTML/Landing/dist/` adalah satu-satunya tema Public Web dan `theme-reference/HTML/Dashboard/dist/` adalah satu-satunya tema Admin Web. Tema/template/design system visual lain dilarang. Semua delete data persisten wajib soft delete. Status di bawah harus mencerminkan implementasi nyata, bukan hanya target desain.

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
| Reference docs | `[x] Done` | v0.1 | `docs/reference/`, `design/PORPROV_ENTERPRISE_BLUEPRINT.md` | Unified Enterprise Blueprint Document telah dibuat berdasarkan BRD/PRD/SRS/SDD dan arsitektur aktif |

## 2. Design System & UI/UX

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Kebijakan tema tunggal Techwind | `[x] Done` | v4.0 | seluruh dokumentasi UI/UX | Sumber visual non-Techwind dihapus; Tailwind/library hanya alat teknis dan style bawaan tidak boleh menjadi tema kedua |
| Tema wajib Techwind Public | `[x] Done` | v4.0 | `theme-reference/HTML/Landing/dist/`, `apps/public-web-nextjs/` | Seluruh rute aktif dipetakan dan diaudit; rute baru wajib mengikuti pola `Landing/dist` |
| Tema wajib Techwind Admin | `[x] Done` | v4.0 | `theme-reference/HTML/Dashboard/dist/`, `apps/admin-web-react/` | Shell, navigasi, dashboard, workspace, form, tabel, status, dan profile aktif mengikuti `Dashboard/dist` |
| Strategi tema terang/gelap | `[x] Done` | v4.0 | Public/Admin CSS + Theme Provider | Class `.dark` menjadi single source of truth; preferensi sistem hanya tema awal; token semantik dan fallback contrast-safe tersedia |
| Masterpiece quality gate | `[~] In Progress` | v4.0 | public/admin/design system | Audit rute aktif desktop/mobile, lint, dan build selesai; visual regression otomatis serta audit WCAG otomatis penuh masih perlu diintegrasikan ke CI |
| Tailwind v4.x design tokens | `[ ] Planned` | v0.1 | `packages/design-tokens/` | Warna PORPROV, status badge, typography |
| Component blueprint | `[ ] Planned` | v0.1 | `packages/ui/` | Button, Card, Badge, Tabs, FilterBar |
| Match card | `[ ] Planned` | v0.1 | `packages/ui/MatchCard` | Wajib memakai pola event/card Techwind `Landing/dist` |
| Editorial card | `[ ] Planned` | v0.1 | `packages/ui/EditorialCard` | Wajib memakai pola blog/editorial Techwind `Landing/dist` |
| Event hero | `[x] Done` | v0.2 | `apps/public-web-nextjs/src/components/HeroSection.tsx` | Hero 100 viewport, parallax 50%, countdown/CTA PORPROV, dan reduced-motion fallback; adaptasi pola `index-event.html` |
| Skeleton loading | `[~] In Progress` | v0.2 | Public Venue/Jadwal/LiveScore | Venue, Jadwal, dan LiveScore memiliki loading serta empty/error yang faktual; modul publik lain belum seluruhnya diselaraskan |
| Accessibility baseline | `[~] In Progress` | v0.2 | Public Beranda + route utama | Fokus keyboard, target 44px, heading/ARIA, live region, reduced motion, zoom viewport, menu mobile, footer tanpa tautan mati, dan overflow mobile telah diaudit; audit otomatis WCAG seluruh portal belum selesai |

## 3. Public Web — Next.js PWA

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| App Router setup | `[ ] Planned` | v0.1 | `apps/public-web-nextjs/` | TypeScript + Tailwind |
| SEO metadata system | `[ ] Planned` | v0.1 | `app/**/metadata` | Metadata API |
| PWA installability | `[ ] Planned` | v0.1 | manifest/service worker | Pengganti Chrome App |
| Beranda | `[~] In Progress` | v0.2 | `/` | Hero Techwind masterpiece, Tuan Rumah, pusat informasi, Venue live, dan CTA penonton tersedia; data Live Now/Medali/editorial penuh masih bertahap |
| Cabor listing/detail | `[x] Done` | v0.3 | `/cabor`, `/cabor/[id]` | Listing, dynamic metadata, detail, nomor tanding, venue terkait, dan jadwal aktif melalui API Gateway; lint/build/E2E desktop teruji |
| Jadwal | `[x] Done` | v0.3 | `/jadwal`, `ScheduleMatchCard` | Read-model enriched, filter tanggal/cabor/venue/status/pencarian, grouping, loading/empty/error, serta E2E mobile teruji |
| Venue & Maps | `[~] In Progress` | v0.3 | `/`, `/venue`, `/venue/[id]` | Listing live dan detail dengan fasilitas, kapasitas, cabor, City Guide sekitar, rute, koordinat, serta jadwal tersedia; peta interaktif dan rekomendasi berbasis jarak belum final |
| LiveScore | `[~] In Progress` | v0.4 | `/livescore` | Projection PostgreSQL, history append-only, koreksi beralasan, optimistic revision, validasi Jadwal, public SSE tersanitasi, fallback faktual, dan hero judul terpusat responsif tersedia; distributed fanout, observability, dan E2E pertandingan staging belum final |
| Standings Medali | `[~] In Progress` | v0.4 | `/medali` | Hanya data OFFICIAL, sorting, public SSE v1, fallback polling, dan empty/error faktual; workflow backend/Admin tersedia, sedangkan E2E data kompetisi staging dan koreksi Medali official belum final |
| Galeri | `[ ] Planned` | v0.1 | `/galeri` | Foto/video |
| Depok Guide | `[ ] Planned` | v0.1 | `/depok-guide` | Coffee shop, kuliner, penginapan, wisata, RS |

## 4. Admin Web — React Dashboard

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Vite React setup | `[x] Done` | v0.2 | `apps/admin-web-react/` | TypeScript + Tailwind v4; build produksi dan image Nginx teruji |
| Role-based sidebar | `[~] In Progress` | v0.5 | admin layout | Menu Dashboard, Master Data, LiveScore, Medali, City Guide, Media Library, Verifikasi, Audit, dan Profil memakai realm role dari ID/access token; matrix granular domain lama masih bertahap |
| Master data | `[x] Done` | v0.4 | cabor, nomor pertandingan, venue, kontingen, jadwal, City Guide | CRUD, pencarian, referensi, Media Selector, soft delete beralasan, dependency guard, dan restore melalui Recycle Bin teruji end-to-end; RBAC granular dilanjutkan pada tahap hardening |
| Media Library | `[x] Done` | v0.4 | `components/media/`, master-data-service | Upload/selector/URL relatif, soft delete metadata, penyembunyian delivery publik, retensi file, dan restore teruji; kebijakan purge tetap TBD |
| Recycle Bin Admin | `[x] Done` | v0.4 | `components/master-data/RecycleBin.tsx` | Menggabungkan tombstone Master Data, Media, Venue, dan Jadwal dengan pencarian, status, actor/alasan, serta restore aksesibel |
| LiveScore center | `[~] In Progress` | v0.4 | admin livescore | Pilih Jadwal enriched, input/koreksi dengan expected revision, private SSE, dan history actor/reason; E2E pertandingan staging belum dijalankan tanpa data resmi |
| Verification workflow | `[~] In Progress` | v0.4 | admin Medali/verifikasi | PENDING → VERIFIED → OFFICIAL/REJECTED dengan role terpisah dan actor tiap tahap; correction/reversal data OFFICIAL belum tersedia |
| Audit log | `[~] In Progress` | v0.4 | admin audit | Filter, detail payload, dedup event, hash, dan DB immutable tersedia; SIEM/WORM/retention belum final |
| Export | `[~] In Progress` | v0.4 | admin audit | CSV Audit tersedia; XLSX/PDF/report domain lain belum tersedia |

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
| API Gateway | `[~] In Progress` | v0.4 | `services/api-gateway/` | JWT signature+issuer+expiry+subject+client, strict origin config, trusted actor/IP, role guard olahraga/audit, public/private stream, dan public reads teruji; RBAC domain lama/rate limit terdistribusi belum lengkap |
| Master Data Service | `[~] In Progress` | v0.4 | `services/master-data-service/` | CRUD serta soft delete/restore Cabor, Nomor, Kontingen, City Guide, dan Media sudah teruji; immutable audit persistence/outbox dan RBAC granular belum selesai |
| Venue Service | `[~] In Progress` | v0.4 | `services/venue-service/` | CRUD, soft delete/restore, dan fail-closed schedule dependency guard sudah teruji; hardening authorization/audit masih bertahap |
| Schedule Service | `[~] In Progress` | v0.5 | `services/schedule-service/` | CRUD, validasi referensi, soft delete/restore, reference endpoint, serta `GET /matches/enriched` dengan batch participant query teruji; bracket belum tersedia |
| LiveScore Service | `[~] In Progress` | v0.4 | `services/livescore-service/` | PostgreSQL revision/current projection, schedule fail-closed, expected revision, correction append-only, transactional realtime+audit outbox, retry/backoff, dan public projection tersedia; load/staging E2E belum final |
| Realtime Gateway | `[~] In Progress` | v0.4 | `services/realtime-gateway/` | Public/private SSE, internal token production guard, public metadata sanitization, replay Redis, per-client limit, durable consumers, dan stream bootstrap tersedia; distributed connection limit/fanout dan observability belum final |
| Medal Standing Service | `[~] In Progress` | v0.4 | `services/medal-standing-service/` | Migration container, validasi Kontingen, workflow PENDING/VERIFIED/REJECTED/OFFICIAL, separated actors, double-publish guard, transactional audit/realtime outbox, dan official standings tersedia; official reversal/correction belum final |
| Notification Service | `[ ] Planned` | v0.1 | `services/notification-service/` | Push/in-app |
| Audit Service | `[~] In Progress` | v0.4 | `services/audit-service/` | Durable consumer, dedup event ID, deterministic legacy ID, SHA-256 payload, poison termination, immutable trigger, role-protected query, dan Admin CSV tersedia; WORM/SIEM/retention belum final |

## 7. Infrastruktur, Security, Testing

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Docker Compose staging | `[~] In Progress` | v0.5 | `infra/docker/` | Satu baseline mencakup Public, Admin, Gateway, seluruh core domain, migration, Keycloak bootstrap, Nginx, dan observability; production override/secret/edge hardening belum final |
| Registry port portable | `[x] Done` | v0.3 | Compose, config service, `.env.example`, enam Markdown root | Public, diagnostic, local debug `28xxx`, dan infra host dipisahkan; seluruh host mapping configurable |
| Gateway CORS ownership | `[x] Done` | v0.5 | API Gateway router + Compose frontend config | Header CORS downstream dibuang sebelum kebijakan Gateway diterapkan; origin canonical hanya Public `3000` dan Admin `5173` pada development |
| Nginx SSL | `[ ] Planned` | v0.1 | `infra/nginx/` | Reverse proxy |
| Keycloak realm dan Admin OIDC | `[~] In Progress` | v0.5 | Compose bootstrap, Admin Web | Realm/client/role/user bootstrap otomatis-idempotent, callback canonical 5173, PKCE S256, dan pembacaan role ID/access token aktif; adaptasi login Techwind PORPROV, rotasi secret, serta konfigurasi production belum final |
| Canonical full-stack launcher | `[x] Done` | v0.5 | `infra/docker/compose-up.ps1`, ADR-0005 | Public/Admin dan seluruh backend berjalan dalam satu Compose; launcher campuran serta Admin env 5174/28000 dihapus |
| Media storage convergence | `[x] Done` | v0.5 | `master_data_uploads`, runtime migration | Metadata dan 16 asset aktif terverifikasi HTTP 200 dari Gateway; file lokal legacy dipindahkan ke backup non-Git tanpa purge |
| NATS JetStream | `[~] In Progress` | v0.4 | LiveScore/Medal/Audit/Realtime | Stream bootstrap, durable consumer, ack, retry, dan at-least-once outbox tersedia untuk domain olahraga; cluster/monitoring/DLQ operasional belum final |
| PostgreSQL per service | `[~] In Progress` | v0.4 | `infra/postgres/` | Database core termasuk `livescore_db`, `porprov_db`, dan `audit_db` aktif; backup/HA/retention belum final |
| Redis | `[~] In Progress` | v0.4 | Realtime cache | Password environment, replay cache, dan TTL aktif; distributed rate limit/presence belum final |
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
| Audit dan event delete/restore | `[~] In Progress` | API/service/NATS | Audit Service immutable/dedup aktif dan LiveScore/Medali memakai durable transactional outbox; event delete/restore Master/Media/Venue/Jadwal masih best-effort dan harus dimigrasikan ke outbox |
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
- [x] UI seluruh rute aktif Public/Admin menggunakan tema tunggal Techwind `dist`, strategi class `.dark`, dan quality bar kontras; route baru wajib mengulang mapping serta matriks QA.
- [ ] Test relevan dijalankan atau dijelaskan.
- [ ] Enam Markdown root yang terdampak aturan/standar telah sinkron.
- [ ] Dokumentasi, ADR, dan feature tracking diperbarui sesuai perubahan.
