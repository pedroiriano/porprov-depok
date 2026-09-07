# FEATURES.md — Feature Tracking Portal PORPROV Enterprise UI/UX v5

Dokumen ini melacak status implementasi fitur, komponen, arsitektur, dan quality gates. Agent wajib membaca dan memperbarui dokumen ini sebelum dan sesudah pekerjaan.

> **Aturan aktif per 6 September 2026:** Techwind 3.3.0 tetap menjadi otoritas visual Public. Cuba Admin Dashboard menjadi target otoritas visual Admin, tetapi penyalinan vendor dan implementasinya berstatus `BLOCKED_LICENSE_EVIDENCE`; Admin Techwind aktif dipertahankan sebagai baseline transisi/rollback. Visual language ketiga dan pencampuran global style dilarang. Semua delete data persisten wajib soft delete. Status di bawah mencerminkan implementasi nyata, bukan hanya target governance.

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
| Struktur monorepo enterprise | `[ ] Planned` | v0.1 | `apps/`, `services/`, `packages/`, `infra/`, `docs/` | Sesuai RULES v5 |
| README root | `[x] Done` | v5.0 | `README.md` | Orientasi aplikasi, split UI authority, quality gate, soft delete, dan sinkronisasi pedoman |
| AI/Codex docs | `[x] Done` | v5.0 | enam Markdown root + governance/ADR | Workflow, delivery gate, split UI authority, UI contracts, NFR, dan status implementasi diselaraskan |
| Engineering/UIUX quality standard | `[x] Done` | v5.0 | `docs/governance/ENGINEERING_UIUX_QUALITY_STANDARD.md` | Standar normatif turunan RULES; tidak mengubah status fitur runtime |
| Reference docs | `[x] Done` | v0.1 | `docs/reference/`, `design/PORPROV_ENTERPRISE_BLUEPRINT.md` | Unified Enterprise Blueprint Document telah dibuat berdasarkan BRD/PRD/SRS/SDD dan arsitektur aktif |

## 2. Design System & UI/UX

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Kebijakan otoritas visual terpisah | `[x] Done` | v5.0 | enam root docs, ADR-0015, kontrak UI Admin | Techwind untuk Public dan Cuba untuk Admin; visual language ketiga serta campuran global style dilarang |
| Tema wajib Techwind Public | `[x] Done` | v4.0 | `theme-reference/HTML/Landing/dist/`, `apps/public-web-nextjs/` | Seluruh rute aktif dipetakan dan diaudit; rute baru wajib mengikuti pola `Landing/dist` |
| Baseline Techwind Admin aktif | `[x] Done` | v4.0 | `theme-reference/HTML/Dashboard/dist/`, `apps/admin-web-react/` | Dipertahankan sebagai runtime transisi dan rollback; bukan target visual layar baru v5 |
| Target Cuba Admin | `[ ] Planned` | v5.0 | target `theme-reference/Cuba/template/`, `apps/admin-web-react/` | `BLOCKED_LICENSE_EVIDENCE`: bukti lisensi belum ditemukan; belum ada asset vendor, feature flag, atau migrasi runtime |
| Kontrak visual Admin Cuba | `[x] Done` | v1.0 | `docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md` | Mapping shell/form/table/chart/login/help/media/editor tersedia sebagai aturan; implementasi belum dimulai |
| Strategi tema terang/gelap | `[x] Done` | v4.0 | Public/Admin CSS + Theme Provider | Class `.dark` menjadi single source of truth; preferensi sistem hanya tema awal; token semantik dan fallback contrast-safe tersedia |
| Masterpiece quality gate | `[~] In Progress` | v4.1 | public/admin/design system | Audit 27 Juli 2026 mencakup 9 rute Public dan 10 rute Admin pada mobile/desktop, light/dark, lint, build, gambar, overflow, serta Console. Visual regression dan audit WCAG otomatis penuh masih perlu diintegrasikan ke CI |
| Tailwind v4.x design tokens | `[ ] Planned` | v0.1 | `packages/design-tokens/` | Warna PORPROV, status badge, typography |
| Component blueprint | `[ ] Planned` | v0.1 | `packages/ui/` | Button, Card, Badge, Tabs, FilterBar |
| Match card | `[ ] Planned` | v0.1 | `packages/ui/MatchCard` | Wajib memakai pola event/card Techwind `Landing/dist` |
| Editorial card | `[ ] Planned` | v0.1 | `packages/ui/EditorialCard` | Wajib memakai pola blog/editorial Techwind `Landing/dist` |
| Event hero dinamis | `[x] Done` | v0.6 | Public `/`, Admin `/hero`, Master Data migration v8 | Judul, sorotan, isi, dan background Hero dibaca dari record aktif melalui Gateway; Admin menyediakan CRUD, Media Selector, status aktif tunggal, pratinjau Techwind, soft delete/restore, fallback startup, serta lint/build/test lulus |
| Skeleton loading | `[~] In Progress` | v0.2 | Public Venue/Jadwal/LiveScore | Venue, Jadwal, dan LiveScore memiliki loading serta empty/error yang faktual; modul publik lain belum seluruhnya diselaraskan |
| Accessibility baseline | `[~] In Progress` | v0.3 | seluruh rute aktif Public/Admin | Fokus keyboard, target 44px termasuk kontrol Leaflet dan tautan detail, heading/ARIA, live region, reduced motion, viewport pendek, menu/sidebar mobile, modal 100dvh, tabel/pagination scroll-safe, dan overflow telah diaudit; audit WCAG otomatis di CI belum selesai |
| Unified `AdminDataTable` | `[~] In Progress` | v5.0 | `apps/admin-web-react/` | Sorting/pagination telah distandardisasi pada beberapa tabel; primitive bersama, selection lintas halaman, bulk action, dan server-pagination menyeluruh belum lengkap |
| Modal/form interaction contract | `[~] In Progress` | v5.0 | Admin shared components | Baseline modal tersedia; focus trap, inert background, dirty-form guard, modal manager, dan parity seluruh form belum dibuktikan |

## 3. Public Web — Next.js PWA

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| App Router setup | `[ ] Planned` | v0.1 | `apps/public-web-nextjs/` | TypeScript + Tailwind |
| Navigasi utama | `[x] Done` | v0.8 | `Navbar.tsx` | Beranda, Cabor, Venue, Jadwal, Klasemen, dan Jelajah tersedia konsisten pada desktop/mobile; `Jelajah` menuju `/city-guide` dengan active-state dan `aria-current`. Toggle mobile memakai kontrak `#navigation.open` Techwind agar status terbuka tidak dikalahkan `display: none` pada breakpoint mobile. |
| SEO metadata system | `[ ] Planned` | v0.1 | `app/**/metadata` | Metadata API |
| PWA installability | `[~] In Progress` | v0.2 | manifest/service worker | Manifest, service worker, theme color light/dark, serta ikon PNG valid 192/512 tersedia dan teruji HTTP 200; audit install/offline lintas-browser belum final |
| Beranda | `[~] In Progress` | v0.5 | `/` | Hero Techwind masterpiece, pengantar PORPROV XV dari booklet resmi halaman 4, section Maskot Toca-Toci dari halaman 6-7, pusat informasi, Venue live tanpa label editorial “Data Langsung dari Panitia”, dan CTA penonton tersedia; data Live Now/Medali/editorial penuh masih bertahap |
| Cabor listing/detail | `[x] Done` | v0.5 | `/cabor`, `/cabor/[slug]`, Admin Master Data | Listing, dynamic metadata, detail, nomor tanding, venue, jadwal, slug publik, redirect UUID, serta Hero Image opsional dari Media Library dengan overlay kontras dan fallback gradasi tersedia |
| Jadwal | `[x] Done` | v0.5 | `/jadwal`, `ScheduleMatchCard` | Read-model enriched menampilkan Peserta A/B Individu/Tim/Kontingen, filter tanggal/cabor/venue/status/pencarian, grouping, loading/empty/error, serta E2E mobile baseline teruji |
| Venue & Maps | `[~] In Progress` | v0.8 | `/`, `/venue`, `/venue/[id]` | Listing live dan detail dengan fasilitas, kapasitas, cabor, rute, koordinat, jadwal, serta popup penanda peta berkontras AA pada light/dark tersedia. Detail Venue memilih maksimal satu rekomendasi dalam radius 15 km untuk setiap kelompok City Guide—Tempat Menginap, Pusat Perbelanjaan, Wisata Kuliner, Coffee Shop, Catering, Travel & Transportasi, Rumah Sakit, dan Lainnya—serta menampilkan empty state faktual ketika tidak ada lokasi relevan. |
| City Guide listing/search | `[~] In Progress` | v0.9 | `/city-guide`, Admin, Master Data `GET /city-guides` | Public mempertahankan format array kompatibel dan pagination ringkas yang scroll-safe pada mobile; Admin memakai pagination server-side `page/per_page` dengan metadata total, pencarian kontak, filter kategori, dan rows-per-page. Kategori Catering serta Info Travel memiliki kontak/layanan terstruktur melalui migrasi Master Data v9; Travel mewajibkan jenis dan jumlah armada. Semua label form terikat ke kontrolnya. Build, unit test, migrasi runtime lokal, dan regresi viewport 390 px lulus; deployment VPS belum dijalankan. |
| LiveScore | `[~] In Progress` | v0.5 | `/livescore` | Projection PostgreSQL, history append-only, koreksi beralasan, optimistic revision, validasi Jadwal + Peserta A/B, public SSE tersanitasi, serta penahanan skor saat identitas peserta belum lengkap tersedia; distributed fanout, observability, dan E2E data pertandingan staging belum final |
| Standings Medali | `[~] In Progress` | v0.4 | `/medali` | Hanya data OFFICIAL, sorting, public SSE v1, fallback polling, dan empty/error faktual; workflow backend/Admin tersedia, sedangkan E2E data kompetisi staging dan koreksi Medali official belum final |
| Galeri | `[ ] Planned` | v0.1 | `/galeri` | Foto/video |
| Depok Guide | `[ ] Planned` | v0.1 | `/depok-guide` | Coffee shop, kuliner, penginapan, wisata, RS |

## 4. Admin Web — React Dashboard

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Vite React setup | `[x] Done` | v0.2 | `apps/admin-web-react/` | TypeScript + Tailwind v4; build produksi dan image Nginx teruji |
| Role-based sidebar | `[~] In Progress` | v0.6 | admin layout | Menu Dashboard, Master Data, Hero Utama, LiveScore, Medali, City Guide, Media Library, Verifikasi, Audit, dan Profil memakai realm role dari ID/access token; matrix granular domain lama masih bertahap |
| Master data | `[~] In Progress` | v0.9 | cabor, nomor pertandingan, venue, kontingen, jadwal, City Guide | CRUD, pencarian, referensi, Media Selector, form Jadwal + Peserta A/B, serta City Guide. City Guide menyediakan URL Google Maps, fallback koordinat, pagination server-side Admin, form Catering, serta form Info Travel dengan jenis/jumlah armada. Screenshot eksternal tidak menjadi field; gambar memakai Media Library. Deployment v0.9 masih pending. |
| Media Library | `[x] Done` | v0.4 | `components/media/`, master-data-service | Upload/selector/URL relatif, soft delete metadata, penyembunyian delivery publik, retensi file, dan restore teruji; kebijakan purge tetap TBD |
| Optimasi gambar ≤3 MiB | `[ ] Planned` | v5.0 | Media Library/API policy | Lossless-first, fallback lossy atas persetujuan, magic/MIME/dimension/decompression validation, checksum, dan policy endpoint belum diimplementasikan |
| Autosave dan pemulihan draft | `[ ] Planned` | v5.0 | Admin forms + server draft + IndexedDB | Dua lapis, retention, status simpan, cleanup, dan conflict `409` belum diimplementasikan |
| Revision history konten | `[ ] Planned` | v5.0 | domain content + Admin tab | Revision immutable dan restore-as-new-revision baru aktif khusus LiveScore; kontrak generik konten belum tersedia |
| CRUD Hero Utama | `[x] Done` | v0.6 | `pages/HeroManagement.tsx`, Master Data `/heroes` | Tambah, daftar, detail, edit, aktivasi tunggal, pemilih Media Library, preview responsif, soft delete, Recycle Bin, audit event, dan projection publik aktif tersedia |
| Recycle Bin Admin | `[x] Done` | v0.5 | `components/master-data/RecycleBin.tsx` | Menggabungkan tombstone Master Data, Media, Venue, dan Jadwal dengan pencarian, status, actor/alasan, serta restore aksesibel. Tabel Recycle Bin kini menggunakan standardisasi pagination dan sorting. |
| LiveScore center | `[~] In Progress` | v0.5 | admin livescore | Membaca Peserta A/B dari Jadwal, memberi label skor per peserta, dan mengunci scoring bila susunan belum lengkap; expected revision, koreksi, private SSE, serta history tersedia, sedangkan E2E data pertandingan staging belum final |
| Verification workflow | `[~] In Progress` | v0.5 | admin Medali/verifikasi | PENDING → VERIFIED → OFFICIAL/REJECTED dengan role terpisah dan actor tiap tahap. Tabel antrean dan klasemen resmi kini menggunakan standardisasi pagination dan sorting. |
| Audit log | `[x] Done` | v0.5 | admin audit | Filter, detail payload, dedup event, hash, dan DB immutable tersedia. Tabel Audit Log kini menggunakan standardisasi pagination dan sorting dengan limit 500 event. |
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
| API Gateway | `[~] In Progress` | v0.6 | `services/api-gateway/` | JWT signature+issuer+expiry+subject+client, strict origin, trusted actor/IP, role guard, stream publik/pribadi, serta allowlist GET Master Data yang hanya membuka Hero aktif dan referensi tayang teruji; RBAC domain lama/rate limit terdistribusi belum lengkap |
| Master Data Service | `[~] In Progress` | v0.10 | `services/master-data-service/` | CRUD serta soft delete/restore tersedia; Cabor memiliki slug dan Hero Image opsional yang wajib merujuk Media Library aktif, sedangkan immutable audit persistence/outbox dan RBAC granular belum selesai |
| Venue Service | `[~] In Progress` | v0.5 | `services/venue-service/` | CRUD, soft delete/restore, fail-closed schedule dependency guard, serta slug publik unik dengan kompatibilitas UUID sudah tersedia; hardening authorization/audit masih bertahap |
| Schedule Service | `[~] In Progress` | v0.6 | `services/schedule-service/` | CRUD Jadwal + dua peserta berjenis sama secara transaksional, validasi Kontingen, identity type/slot, soft replacement, soft delete/restore, endpoint peserta, read-model enriched batch, serta `pgxpool` untuk request konkuren teruji; bracket dan format multi-side belum tersedia |
| LiveScore Service | `[~] In Progress` | v0.5 | `services/livescore-service/` | PostgreSQL revision/current projection, validasi fail-closed Jadwal serta dua slot peserta, expected revision, correction append-only, transactional realtime+audit outbox, retry/backoff, dan public projection tersedia; load/staging E2E belum final |
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
| Nginx SSL | `[~] In Progress` | v0.7 | `infra/docker/nginx/`, `docker-compose.vps.yml`, `install-official-tls.sh` | Domain canonical `porprov.depok.go.id`, redirect HTTP ke HTTPS, wildcard DigiCert/full chain, Admin `/admin/`, issuer Keycloak HTTPS, serta installer resmi dengan backup/rollback/SNI test tersedia; sinkronisasi source ke VPS dan smoke test operator tetap diperlukan |
| Pedoman deployment VPS aman | `[x] Done` | v1.0 | `DEPLOYMENT_VPS.md`, enam Markdown root, runbook VPS | Kontrak Agent AI, klasifikasi secret, SSH fingerprint, preflight, environment, TLS/CA, backup/restore tujuh database+Media, job tahan reconnect, smoke/concurrency test, rollback, incident response, handoff, dan prompt aman tersedia tanpa credential |
| Keycloak realm dan Admin OIDC | `[~] In Progress` | v0.5 | Compose bootstrap, Admin Web | Realm/client/role/user bootstrap otomatis-idempotent, callback canonical 5173, PKCE S256, dan pembacaan role ID/access token aktif; adaptasi login Techwind PORPROV, rotasi secret, serta konfigurasi production belum final |
| Canonical full-stack launcher | `[x] Done` | v0.5 | `infra/docker/compose-up.ps1`, ADR-0005 | Public/Admin dan seluruh backend berjalan dalam satu Compose; launcher campuran serta Admin env 5174/28000 dihapus |
| Media storage convergence | `[x] Done` | v0.5 | `master_data_uploads`, runtime migration | Metadata dan 16 asset aktif terverifikasi HTTP 200 dari Gateway; file lokal legacy dipindahkan ke backup non-Git tanpa purge |
| Media delivery rate-limit isolation | `[x] Done` | v0.6 | Nginx `/uploads/` | Upload publik memiliki rate-limit per-IP terpisah dari API; respons `2xx/304` di-cache satu hari, sedangkan `4xx/5xx` selalu `no-store` agar kegagalan sementara tidak menjadi gambar rusak persisten |
| NATS JetStream | `[~] In Progress` | v0.4 | LiveScore/Medal/Audit/Realtime | Stream bootstrap, durable consumer, ack, retry, dan at-least-once outbox tersedia untuk domain olahraga; cluster/monitoring/DLQ operasional belum final |
| PostgreSQL per service | `[~] In Progress` | v0.4 | `infra/postgres/` | Database core termasuk `livescore_db`, `porprov_db`, dan `audit_db` aktif; backup/HA/retention belum final |
| Redis | `[~] In Progress` | v0.4 | Realtime cache | Password environment, replay cache, dan TTL aktif; distributed rate limit/presence belum final |
| Observability & visitor analytics | `[~] In Progress` | v0.3 | Prometheus, Grafana, Umami, Dashboard Admin | Prometheus memantau layanan teknis; Umami self-hosted mengumpulkan page views anonim same-origin dan Dashboard Admin menampilkan pengunjung aktif/unik, tren, halaman, referrer, perangkat, serta browser melalui API Gateway ber-RBAC. Loki/Otel/alerting dan verifikasi retensi production masih bertahap. |
| Security scan dan edge hardening | `[~] In Progress` | v0.8 | ZAP, Nginx, API Gateway, GitHub Actions, npm, govulncheck | VA 10 Agustus 2026 pukul 14.18 menemukan `1 Medium`/2 instance Cross-Domain Misconfiguration dan `1 Low` HSTS pada resource Google Fonts yang diikuti scanner, bukan header origin PORPROV. Public/Admin kini memakai Nunito Variable normal/italic self-hosted dari `@fontsource-variable/nunito` 5.3.0; import/allowlist Google Fonts dihapus dan audit npm penuh kembali nol setelah `js-yaml` 4.3.1, `browserslist` 4.28.9, serta `nanoid` 3.3.18 dipin. Deployment job tahan rollback `external-font-hardening-20260810T075510Z` menyimpan backup serta image Public/Admin/Nginx; smoke 15 endpoint, browser Public/Admin, dan pemeriksaan stylesheet/CSP lulus. ZAP baseline 2.17.0 job `zap-font-rescan-20260810T075753Z` memeriksa 292 endpoint dan terverifikasi `0 High / 0 Medium / 0 Low` dengan tujuh jenis Informational. CSP/HSTS, COOP/COEP/CORP, CORS peta, canonical 404, version-header removal, cache policy, stable 5xx, secret scan, CodeQL, Dependabot, Go 1.26.6, NATS 1.53.1, `x/crypto` 0.56.0, `x/text` 0.41.0, dan production fail-closed tersedia; active/authenticated scan, container image scan, dan rotasi credential historis tetap diperlukan. |
| Load & stress test | `[ ] Planned` | v0.1 | `tests/k6/` | Tidak boleh klaim lulus sebelum diuji |
| Master Data soft-delete integration test | `[x] Done` | v0.4 | admin + gateway + master/venue/schedule | Runtime Docker teruji untuk actor auth, delete idempotent, active get `404`, dependency guard `409`, restore berurutan, dan media delivery `404/200`; record QA akhir tetap menjadi tombstone beralasan karena purge produksi tidak dibuka |

## 8. Adopsi Praktik Teman Belajar

| Praktik | Status | Bukti/gap PORPROV |
|---|---|---|
| Source-of-truth matrix | `[ ] Planned` | Belum ada `docs/governance/SOURCE-OF-TRUTH.md` |
| Root OpenAPI contract-first | `[ ] Planned` | Belum ada `openapi/openapi.yaml`; kontrak masih tersebar per service |
| Environment security matrix + feature threat model | `[ ] Planned` | Security docs tersedia, tetapi matriks dan threat model per fitur belum standar |
| Draft recovery + generic revision history | `[ ] Planned` | Kontrak v5 sudah ditetapkan; implementasi lintas form/domain belum ada |
| Media policy endpoint/checksum/variant | `[ ] Planned` | Upload aktif, tetapi policy contract dan pipeline ≤3 MiB belum ada |
| Backup/restore RPO-RTO drill | `[ ] Planned` | Backup operasional ada; target RPO/RTO dan drill berkala belum dibuktikan |
| Release evidence commit SHA + image digest | `[~] In Progress` | Deployment memakai exact Git/backup gate; manifest evidence terpadu belum ada |
| OpenTelemetry + Loki + Tempo | `[ ] Planned` | Prometheus/Grafana aktif; Loki/Tempo/OTel belum lengkap |
| Integration Health Center read-only | `[ ] Planned` | Belum ada workspace terpusat untuk status dependency |
| Central platform config + notification center | `[ ] Planned` | Konfigurasi dan notifikasi masih tersebar/bertahap |
| SEO taxonomy, slug history, thin-page policy | `[~] In Progress` | Canonical/robots/sitemap/slug beberapa domain tersedia; taxonomy/history/policy belum menyeluruh |
| Vendor regression tests | `[ ] Planned` | Baseline Techwind pernah diaudit; suite reusable untuk Techwind/Cuba belum ada |

## 9. Kepatuhan Soft Delete

| Area | Status | Target | Catatan |
|---|---|---|---|
| Skema standar `deleted_at/deleted_by/delete_reason` | `[x] Done` | Master Data, Media, Venue, Schedule | Migration backward-safe aktif: master v9, venue v3, schedule v5; partial unique index dipakai untuk nama aktif yang relevan |
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
- [ ] Public mengikuti Techwind; pekerjaan Admin baru mengikuti kontrak Cuba hanya setelah gate lisensi. Baseline Admin Techwind tidak dihapus sebelum parity dan rollback lulus.
- [ ] Format, lint/typecheck, test terkait, build terdampak, diff check, dan secret scan dasar lulus pada scope perubahan.
- [ ] Test relevan dijalankan atau dijelaskan.
- [ ] Enam Markdown root yang terdampak aturan/standar telah sinkron.
- [ ] Dokumentasi, ADR, dan feature tracking diperbarui sesuai perubahan.
