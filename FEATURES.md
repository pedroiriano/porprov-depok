# FEATURES.md — Feature Tracking Portal PORPROV Enterprise UI/UX v5

Dokumen ini melacak status implementasi fitur, komponen, arsitektur, dan quality gates. Agent wajib membaca dan memperbarui dokumen ini sebelum dan sesudah pekerjaan.

> **Aturan aktif per 7 September 2026:** Techwind 3.3.0 tetap menjadi otoritas visual Public. Bukti pembelian satu lisensi Cuba telah diverifikasi untuk satu end product PORPROV; karena repository GitHub publik, implementasi Admin tetap clean-room tanpa source/aset vendor dan berada di balik feature flag. Admin Techwind dipertahankan sebagai rollback. Visual language ketiga dan pencampuran global style dilarang. Semua delete data persisten wajib soft delete. Status di bawah mencerminkan implementasi nyata, bukan hanya target governance.

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
| Target Cuba Admin | `[~] In Progress` | v12 | `apps/admin-web-react/`, `docs/uiux/` | Seluruh route utama memakai implementasi clean-room tanpa source/aset vendor. Tahap 12 menambah taksonomi dinamis, akun/peran/permission, notifikasi, ApexCharts, Dropzone, sidebar responsif, dan recovery UI; production tetap menunggu deployment terpisah. |
| Kontrak visual Admin Cuba | `[x] Done` | v1.0 | `docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md` | Mapping shell/form/table/chart/login/help/media/editor menjadi aturan implementasi clean-room; slice representatif sudah diterapkan tanpa source/aset vendor |
| Strategi tema terang/gelap | `[x] Done` | v4.0 | Public/Admin CSS + Theme Provider | Class `.dark` menjadi single source of truth; preferensi sistem hanya tema awal; token semantik dan fallback contrast-safe tersedia |
| Masterpiece quality gate | `[~] In Progress` | v4.1 | public/admin/design system | Audit 27 Juli 2026 mencakup 9 rute Public dan 10 rute Admin pada mobile/desktop, light/dark, lint, build, gambar, overflow, serta Console. Visual regression dan audit WCAG otomatis penuh masih perlu diintegrasikan ke CI |
| Tailwind v4.x design tokens | `[ ] Planned` | v0.1 | `packages/design-tokens/` | Warna PORPROV, status badge, typography |
| Component blueprint | `[ ] Planned` | v0.1 | `packages/ui/` | Button, Card, Badge, Tabs, FilterBar |
| Match card | `[ ] Planned` | v0.1 | `packages/ui/MatchCard` | Wajib memakai pola event/card Techwind `Landing/dist` |
| Editorial card | `[ ] Planned` | v0.1 | `packages/ui/EditorialCard` | Wajib memakai pola blog/editorial Techwind `Landing/dist` |
| Event hero dinamis | `[x] Done` | v0.6 | Public `/`, Admin `/hero`, Master Data migration v8 | Judul, sorotan, isi, dan background Hero dibaca dari record aktif melalui Gateway; Admin menyediakan CRUD, Media Selector, status aktif tunggal, pratinjau Techwind, soft delete/restore, fallback startup, serta lint/build/test lulus |
| Skeleton loading | `[~] In Progress` | v0.2 | Public Venue/Jadwal/LiveScore | Venue, Jadwal, dan LiveScore memiliki loading serta empty/error yang faktual; modul publik lain belum seluruhnya diselaraskan |
| Accessibility baseline | `[~] In Progress` | v0.3 | seluruh rute aktif Public/Admin | Fokus keyboard, target 44px termasuk kontrol Leaflet dan tautan detail, heading/ARIA, live region, reduced motion, viewport pendek, menu/sidebar mobile, modal 100dvh, tabel/pagination scroll-safe, dan overflow telah diaudit; audit WCAG otomatis di CI belum selesai |
| Unified `AdminDataTable` | `[~] In Progress` | v5.2 | `components/cuba/AdminDataTable.tsx`, `/user-management`, User Service | Primitive bersama menyediakan sorting aksesibel, selection halaman, bulk action, pagination, dan loading/empty/error; `/user-management` sudah memakai search/sort/pagination server-side kompatibel legacy, sedangkan migrasi tabel lain belum lengkap |
| Modal/form interaction contract | `[~] In Progress` | v5.2 | Admin shared modal + `/user-management` | Focus trap, inert background, scroll lock, return focus, Escape/backdrop rule, submit lock, dan dirty-form guard tersedia pada form pengguna; parity seluruh form belum selesai |

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
| Venue & Maps | `[~] In Progress` | v1.0 | `/`, `/venue`, `/venue/[id]` | Listing live dan detail dengan fasilitas, kapasitas, cabor, rute, koordinat, jadwal, serta popup penanda peta berkontras AA pada light/dark tersedia. Detail Venue memilih maksimal satu rekomendasi per kelompok City Guide dalam radius 15 km dan selalu memprioritaskan satu pin global pada kategorinya walaupun di luar radius. Migrasi Master Data v12 dan smoke runtime lokal lulus pada 7 September 2026. |
| City Guide listing/search | `[~] In Progress` | v1.0 | `/city-guide`, Admin, Master Data `GET /city-guides` | Public mempertahankan format array kompatibel; Admin memakai pagination server-side, pencarian/filter, serta fitur satu pin rekomendasi seluruh Venue khusus `super_admin`. Migrasi v12 aktif pada runtime lokal dengan `Department Sports Lab` sebagai satu pin default, menjamin maksimal satu pin aktif, dan melindungi pin dari pengarsipan; build, unit test, dan smoke end-to-end lokal lulus. |
| LiveScore | `[~] In Progress` | v0.5 | `/livescore` | Projection PostgreSQL, history append-only, koreksi beralasan, optimistic revision, validasi Jadwal + Peserta A/B, public SSE tersanitasi, serta penahanan skor saat identitas peserta belum lengkap tersedia; distributed fanout, observability, dan E2E data pertandingan staging belum final |
| Standings Medali | `[~] In Progress` | v0.4 | `/medali` | Hanya data OFFICIAL, sorting, public SSE v1, fallback polling, dan empty/error faktual; workflow backend/Admin tersedia, sedangkan E2E data kompetisi staging dan koreksi Medali official belum final |
| Galeri | `[ ] Planned` | v0.1 | `/galeri` | Foto/video |
| Depok Guide | `[ ] Planned` | v0.1 | `/depok-guide` | Coffee shop, kuliner, penginapan, wisata, RS |

## 4. Admin Web — React Dashboard

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Vite React setup | `[x] Done` | v0.2 | `apps/admin-web-react/` | TypeScript + Tailwind v4; build produksi dan image Nginx teruji |
| Dashboard operasional | `[x] Done` | v5.5C | `pages/DashboardOverview.tsx`, `components/VisitorAnalytics.tsx` | Workspace Cuba memakai master data, Jadwal Pertandingan, analytics ber-RBAC, serta preview audit faktual. Contoh pertandingan hardcoded telah dihapus; state loading/error/empty, dark mode, responsif, dan CTA tugas tersedia |
| Role-based sidebar | `[x] Done` | v5.6 | `App.tsx`, `CubaAdminShell.tsx`, API Gateway | Menu, route, dan mutasi API domain Admin memakai realm role terpusat. Master Data, Hero, City Guide, Media, Venue, Jadwal, dan akun dibatasi `super_admin`; LiveScore, Medali, Verifikasi, serta Audit mengikuti role operasional masing-masing dan backend tetap menolak role yang tidak berhak. |
| Kategori Panduan Kota dinamis | `[x] Done` | v12 | Master Data v15, `CityGuideCategories.tsx` | CRUD, status, urutan, slug stabil, soft delete/restore/history, pemisahan projection publik/Admin, migrasi lokal bersih, dan gate source terdampak telah lulus. |
| Status akun dan Peran/Hak Akses | `[x] Done` | v12 | User v4-v5, Gateway, `UserManagement.tsx`, `RoleManagement.tsx` | Status aktif terpisah dari arsip; peran khusus dan permission granular ditegakkan pada menu, route, aksi UI, Gateway, dan service dengan perlindungan akun/peran sistem serta sinkronisasi Keycloak. |
| Notifikasi Admin nyata | `[x] Done` | v12 | User v4, `CubaAdminShell.tsx` | Daftar per penerima, jumlah belum dibaca, baca satu/semua, deduplikasi, polling fallback, klik luar, dan Escape telah tersedia serta diuji pada kontrak terdampak. |
| Grafik ApexCharts dan Dropzone | `[x] Done` | v12 | `AdminChart.tsx`, `MediaUploadButton.tsx` | Wrapper ApexCharts lazy-load dengan normalisasi modul CommonJS dan unggah seret-dan-lepas aksesibel tersedia tanpa source vendor atau pelemahan validasi server; lint/build dan runtime Admin lokal lulus. |
| Master data | `[~] In Progress` | v11 | cabor, nomor pertandingan, lokasi, kontingen, jadwal, Panduan Kota | CRUD, referensi, formulir Jadwal + Peserta A/B, modal/draf/riwayat, serta tabel Cuba tersedia. Cabor, kontingen, nomor, lokasi, jadwal, dan Panduan Kota memakai pencarian/pengurutan/pagination server-side kompatibel maksimal 100 dengan debounce, pembatalan, dan proteksi respons usang. Production belum berubah. |
| Pustaka Media | `[x] Done` | v11 | `components/media/`, `components/cuba/AdminMediaGrid.tsx`, master-data-service | Galeri memakai pencarian debounce, pembatalan, pengurutan, pagination server-side maksimal 100, validasi unggah, soft delete/restore, dan retensi file. Migrasi Master v14 aktif lokal untuk turunan thumbnail/list/detail; file asli tetap dipertahankan. |
| Optimasi gambar ≤3 MiB | `[x] Done` | v5.6 | `lib/mediaUpload.ts`, `MediaUploadButton.tsx`, Master Data `/media/policy` | Client/server menegakkan hasil akhir maksimal 3 MiB, MIME/signature/dimensi aman, lossless-first untuk PNG, dan fallback WebP berkualitas tinggi hanya setelah persetujuan eksplisit. Sumber client dibatasi 20 MiB; server menyimpan checksum dan ukuran faktual. |
| Simpan otomatis dan pemulihan draf | `[x] Done` | v11 | `ModalForm.tsx`, `lib/serverDraft.ts`, user-service | Draf server dan IndexedDB terisolasi berdasarkan OIDC subject, route, entity, dan versi form; retensi 7 hari, versi optimistis, resolusi konflik lintas perangkat, sanitasi field sensitif, penghapusan, dan test konkurensi tersedia. Migrasi User v3 aktif lokal. |
| Revision history konten | `[x] Done` | v5.6 | `RevisionHistory.tsx`, Audit Log, form domain Admin | Cabor, Nomor, Kontingen, Venue, Jadwal, Hero, dan City Guide dapat memuat payload audit create/update ke form; operator tetap wajib menyimpan sehingga pemulihan menghasilkan revisi baru dan tidak menimpa histori immutable. |
| CRUD Hero Utama | `[x] Done` | v5.5A | `pages/HeroManagement.tsx`, Master Data `/heroes` | Tambah, daftar, detail, edit, aktivasi tunggal, pemilih Media Library, preview responsif, soft delete, Recycle Bin, audit event, dan projection publik tetap tersedia. Workspace clean-room Cuba menambah KPI status, validasi sorotan/gambar, feedback konsisten, serta modal alasan pengarsipan yang aksesibel |
| Recycle Bin Admin | `[x] Done` | v5.4D | `components/master-data/RecycleBin.tsx` | Menggabungkan tombstone Master Data, Media, Venue, dan Jadwal dengan pencarian, status, actor/alasan, serta restore aksesibel. Tabel Cuba memakai sorting, jumlah baris, pagination, select-all/multi-select, pemulihan tunggal/massal, composite selection key lintas-domain, dan pelaporan partial failure tanpa hard delete. |
| LiveScore center | `[~] In Progress` | v5.5C | `pages/LiveScoreCenter.tsx` | Membaca Peserta A/B dari Jadwal, memberi label skor per peserta, dan mengunci scoring bila susunan belum lengkap; expected revision, koreksi, private SSE, history, KPI, state lengkap, responsif, serta dark mode clean-room Cuba tersedia. Empty state membuka langsung tab Jadwal Pertandingan melalui deep-link tervalidasi. E2E data pertandingan staging belum final |
| Verification workflow | `[~] In Progress` | v5.5B | `pages/Medals.tsx`, `/medals`, `/verifikasi` | PENDING → VERIFIED → OFFICIAL/REJECTED dengan role terpisah dan actor tiap tahap. Route Medali/Verifikasi membuka workspace berbeda dari satu sumber canonical; tabel memiliki pencarian, filter, sorting, jumlah baris, pagination, dan konfirmasi transisi terpusat tanpa `window.prompt` |
| Audit log | `[x] Done` | v5.5C | `pages/AuditLog.tsx` | Filter, pencarian debounce, detail payload terpusat, dedup event, hash, DB immutable, CSV, sorting, jumlah baris, dan pagination limit 500 event tersedia dalam workspace Cuba tanpa selection yang tidak relevan |
| Profil akun | `[x] Done` | v5.5C | `pages/Profile.tsx` | Claim identitas dan realm role OIDC ditampilkan tanpa token/password; Account Console Keycloak dibuka aman pada tab baru dengan `noopener`, state sesi kosong, dark mode, dan layout responsif |
| Export | `[~] In Progress` | v0.4 | admin audit | CSV Audit tersedia; XLSX/PDF/report domain lain belum tersedia |

## 5. Mobile Apps — React Native

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| Public Mobile | `[x] Done` | v0.1 | `apps/mobile-public-react-native/` | UI Jadwal, LiveScore, medali, Cabor |
| Admin/Koresponden Mobile | `[ ] Planned` | v0.1 | `apps/mobile-admin-react-native/` | Input skor, bukti foto, offline queue |
| Mobile dependency security gate | `[~] In Progress` | v0.2 | kedua aplikasi mobile, GitHub Actions, npm audit | Expo SDK 57 patch-compatible, lint, typecheck, dan export Web representatif tersedia. Lockfile Metro 0.84.5 tidak lagi memuat `image-size`, sehingga audit aktif nol Critical/High dan menyisakan 14 Moderate. CI tetap menolak semua Critical/High selain exception kontingensi dua advisory exact yang disetujui sampai 7 Oktober 2026; detail expiry/mitigasi berada di `docs/security/NPM_AUDIT_EXCEPTION_IMAGE_SIZE_2026-09-07.md`. |
| Secure storage | `[ ] Planned` | v0.1 | mobile auth | Token aman |
| Push notification | `[ ] Planned` | v0.1 | mobile notification | FCM/APNs |
| Offline queue | `[ ] Planned` | v0.1 | mobile sync | LiveScore lapangan |

## 6. Backend & Realtime

| Fitur | Status | Versi | File/Area | Catatan |
|---|---|---|---|---|
| API Gateway | `[~] In Progress` | v0.7 | `services/api-gateway/` | JWT signature+issuer+expiry+subject+client, strict origin, trusted actor/IP, role guard, stream publik/pribadi, allowlist public read, serta RBAC mutasi konten `super_admin` teruji. Rate limit terdistribusi dan beberapa hardening lintas-domain tetap bertahap. |
| Master Data Service | `[~] In Progress` | v0.11 | `services/master-data-service/` | CRUD/soft delete/restore, Cabor Hero Image, Media pagination server-side, policy upload ≤3 MiB, checksum/dimensi/actor v13 tersedia. Immutable audit persistence/outbox internal service tetap backlog; authorization browser ditutup fail-closed di API Gateway. |
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
| Security scan dan edge hardening | `[~] In Progress` | v0.8 | ZAP, Nginx, API Gateway, GitHub Actions, npm, govulncheck | VA 10 Agustus 2026 pukul 14.18 menemukan `1 Medium`/2 instance Cross-Domain Misconfiguration dan `1 Low` HSTS pada resource Google Fonts yang diikuti scanner, bukan header origin PORPROV. Public/Admin kini memakai Nunito Variable normal/italic self-hosted dari `@fontsource-variable/nunito` 5.3.0; import/allowlist Google Fonts dihapus dan audit npm Web kembali nol setelah `js-yaml` 4.3.1, `browserslist` 4.28.9, serta `nanoid` 3.3.18 dipin. Mobile Expo SDK 57 kini masuk lint/typecheck/build/audit CI dan lockfile Metro 0.84.5 aktif nol Critical/High; exception fail-closed kontingensi hanya mengizinkan dua advisory `image-size` build-time sampai 7 Oktober 2026. Deployment job tahan rollback `external-font-hardening-20260810T075510Z` menyimpan backup serta image Public/Admin/Nginx; smoke 15 endpoint, browser Public/Admin, dan pemeriksaan stylesheet/CSP lulus. ZAP baseline 2.17.0 job `zap-font-rescan-20260810T075753Z` memeriksa 292 endpoint dan terverifikasi `0 High / 0 Medium / 0 Low` dengan tujuh jenis Informational. CSP/HSTS, COOP/COEP/CORP, CORS peta, canonical 404, version-header removal, cache policy, stable 5xx, secret scan, CodeQL, Dependabot, Go 1.26.6, NATS 1.53.1, `x/crypto` 0.56.0, `x/text` 0.41.0, dan production fail-closed tersedia; active/authenticated scan, container image scan, dan rotasi credential historis tetap diperlukan. |
| Load & stress test | `[ ] Planned` | v0.1 | `tests/k6/` | Tidak boleh klaim lulus sebelum diuji |
| Master Data soft-delete integration test | `[x] Done` | v0.4 | admin + gateway + master/venue/schedule | Runtime Docker teruji untuk actor auth, delete idempotent, active get `404`, dependency guard `409`, restore berurutan, dan media delivery `404/200`; record QA akhir tetap menjadi tombstone beralasan karena purge produksi tidak dibuka |

## 8. Adopsi Praktik Teman Belajar

| Praktik | Status | Bukti/gap PORPROV |
|---|---|---|
| Source-of-truth matrix | `[ ] Planned` | Belum ada `docs/governance/SOURCE-OF-TRUTH.md` |
| Root OpenAPI contract-first | `[~] In Progress` | `openapi/openapi.yaml` v12 mencakup draf, kesehatan integrasi, media, akun/status, peran/permission, notifikasi, taksonomi Panduan Kota, direktori audit, dan daftar operasional; endpoint lama lain dikonvergensikan bertahap. |
| Environment security matrix + feature threat model | `[ ] Planned` | Security docs tersedia, tetapi matriks dan threat model per fitur belum standar |
| Draft recovery + generic revision history | `[x] Done` | Draf server berscope pengguna/rute/entitas/versi, fallback IndexedDB, retensi 7 hari, konflik optimistis, sanitasi data sensitif, dan pembanding dua riwayat aktif lokal; penyimpanan hasil pemulihan membuat revisi baru. |
| Media policy endpoint/checksum/variant | `[x] Done` | Kebijakan ≤3 MiB, validasi signature/dimensi, checksum/pelaku, deduplicasi media aktif, dan turunan thumbnail/list/detail aktif lokal setelah backup serta migrasi Master v14. |
| Backup/restore RPO-RTO drill | `[ ] Planned` | Backup operasional ada; target RPO/RTO dan drill berkala belum dibuktikan |
| Release evidence commit SHA + image digest | `[~] In Progress` | Deployment memakai exact Git/backup gate; manifest evidence terpadu belum ada |
| OpenTelemetry + Loki + Tempo | `[ ] Planned` | Prometheus/Grafana aktif; Loki/Tempo/OTel belum lengkap |
| Pusat Kesehatan Integrasi read-only | `[x] Done` | Endpoint dan layar Kesehatan Integrasi ber-RBAC aktif lokal tanpa membocorkan target/credential; akses anonim ditolak dan probe dependency diterjemahkan menjadi status operasional. |
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
- [~] Public mengikuti Techwind; fondasi Admin clean-room mengikuti kontrak Cuba di balik flag. Aset/source vendor tetap menunggu gate lisensi dan baseline Techwind tidak dihapus sebelum parity serta rollback lulus.
- [ ] Format, lint/typecheck, test terkait, build terdampak, diff check, dan secret scan dasar lulus pada scope perubahan.
- [ ] Test relevan dijalankan atau dijelaskan.
- [ ] Enam Markdown root yang terdampak aturan/standar telah sinkron.
- [ ] Dokumentasi, ADR, dan feature tracking diperbarui sesuai perubahan.
