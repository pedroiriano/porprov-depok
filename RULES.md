# RULES.md — Aturan Mutlak Portal PORPROV Enterprise UI/UX v5

Dokumen ini mengikat semua agent AI/Codex saat membuat, mengubah, menguji, atau mendokumentasikan aplikasi Portal PORPROV XV Jawa Barat 2026.

## 0. Konteks Produk dan Sumber Kebenaran

- Produk aktif adalah repository `porprov-depok` untuk Portal PORPROV XV Jawa Barat 2026 Kota Depok.
- Kondisi implementasi aktual wajib dibaca dari `FEATURES.md`; jangan menganggap fitur planned sebagai tersedia atau fitur yang hanya compile sebagai final.
- `RULES.md` adalah sumber normatif. `README.md`, `AI.md`, `AGENTS.md`, `FEATURES.md`, dan `DOCUMENTATION.md` wajib konsisten dengannya.
- Setiap perubahan aturan atau standar wajib memperbarui semua Markdown root yang terdampak dalam pekerjaan yang sama.
- Otoritas visual dipisahkan tegas: Public memakai Techwind 3.3.0 pada `theme-reference/HTML/Landing/dist/`; Admin menargetkan Cuba Admin Dashboard pada `theme-reference/Cuba/template/` setelah gate lisensi. Admin Techwind aktif adalah baseline transisi/rollback, bukan otoritas layar baru. Visual language ketiga dan pencampuran global style Techwind/Cuba dilarang.

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
| UI System | Techwind 3.3.0 untuk Public, Cuba Admin Dashboard untuk Admin, Tailwind CSS v4.x sebagai mesin implementasi, design tokens PORPROV, mobile-first, accessible components |


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
│   ├── HTML/
│   │   ├── Landing/
│   │   └── Dashboard/  # baseline Admin transisi
│   └── Cuba/            # target setelah gate lisensi
│       └── template/
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

## 5. Otoritas Visual Wajib per Produk

| Area | Sumber Tema Wajib | Adaptasi PORPROV |
|---|---|---|
| Public Web | Techwind 3.3.0 `theme-reference/HTML/Landing/dist/` | Navigation, hero, event/feature sections, editorial, gallery, CTA, footer, LiveScore, venue, medali, berita, dan Depok Guide diimplementasikan ulang sebagai komponen Next.js PORPROV |
| Admin Web | Cuba Admin Dashboard; target lokal `theme-reference/Cuba/template/` setelah gate lisensi | Application shell, sidebar, topbar, KPI, form, table, calendar, profile, gallery, dan workflow operator diimplementasikan ulang sebagai komponen React PORPROV |
| Mobile | Design tokens PORPROV dan pola tugas produk web terdekat | Adaptasi mobile-native menggunakan identitas PORPROV; dilarang membentuk tema ketiga |


Aturan:
- Techwind wajib untuk Public dan Cuba wajib untuk Admin. Admin Techwind yang berjalan dipertahankan sementara sebagai baseline transisi dan rollback sampai migrasi Cuba lulus parity.
- Folder upstream `C:\Datas\Proyek\UI\techwind-pembelajaran\source` dan `C:\Datas\Proyek\UI\cuba-pembelajaran\template` hanya boleh dibaca. Build, Docker, test, dan runtime tidak boleh bergantung pada path luar root.
- Penyalinan, commit, atau distribusi asset/vendor Cuba dilarang sampai bukti lisensi sah diverifikasi dan dicatat (`BLOCKED_LICENSE_EVIDENCE`). Setelah lulus, snapshot minimal diimpor ke root dengan versi/checksum dan dijaga read-only.
- Source Gulp, demo JavaScript, brand, logo, demo copy, dan identitas vendor tidak boleh masuk runtime. “Sama persis” berarti fidelity anatomy, hierarchy, layout, spacing, density, responsive behavior, dan interaction pattern—bukan menyalin brand atau HTML mentah.
- Dilarang memakai visual language ketiga atau mengimpor global CSS/JavaScript Techwind dan Cuba secara bersamaan.
- Tailwind CSS v4.x adalah alat implementasi utility dan token, bukan tema alternatif. Library komponen hanya boleh dipakai untuk perilaku teknis dan harus dinormalisasi terhadap otoritas produk.
- Tailwind CSS v4 wajib mendefinisikan variant `dark:*` berbasis class `.dark`; `prefers-color-scheme` hanya boleh menentukan nilai awal dan tidak boleh menimpa pilihan eksplisit pengguna.
- Telaah halaman referensi yang relevan sebelum mengubah UI; dokumentasikan mapping komponen dan keputusan besar pada docs UI/UX atau ADR.
- Adaptasikan pola otoritas produk sebagai React/Next.js yang aksesibel, bukan menyalin runtime mentah atau membangun visual language baru.
- Gunakan identitas visual PORPROV/Kota Depok, asset resmi, copywriting Indonesia, dan token aplikasi. Jangan mengekspos logo, nama, demo content, atau identitas Techwind/Cuba.
- Pastikan penggunaan dan distribusi asset kedua template didukung bukti lisensi proyek.

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

## 6. Implementasi Teknis Otoritas Visual dengan Tailwind v4.x

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
- Navigasi utama Public canonical adalah Beranda, Cabor, Venue, Jadwal, Klasemen, dan Jelajah. Label `Jelajah` wajib menuju `/city-guide` serta memiliki active-state dan `aria-current` pada desktop/mobile.
- Data lintas domain untuk layar publik wajib dipublikasikan sebagai read-model backend melalui API Gateway. Browser tidak boleh mengorkestrasi request langsung ke beberapa port service atau menampilkan UUID referensi sebagai informasi pengguna.
- Pencarian City Guide publik wajib memakai URL state `q/category/page`, diproses server-side, mempertahankan filter pada pagination, dan membatasi `q` tunggal maksimal 80 karakter. Query database wajib parameterized, wildcard input diperlakukan literal, dan tombstone tidak boleh ikut dicari.
- Daftar City Guide Admin wajib memakai pagination server-side dengan `page` minimal 1, `per_page` maksimal 100, metadata total stabil, serta tetap mengecualikan tombstone. Endpoint tanpa parameter pagination mempertahankan response array untuk kompatibilitas consumer publik.
- Gunakan PWA installable untuk kebutuhan "Chrome App".
- Realtime publik dapat memakai WebSocket atau SSE sesuai kebutuhan.

## 8. Aturan Admin Web — React Dashboard

- Gunakan React + TypeScript + Tailwind + TanStack Query.
- Admin tidak wajib SEO, tetapi wajib cepat, aman, dan realtime.
- Wajib memiliki role-based sidebar, global search, data table, filter kompleks, approval workflow, notification center, audit log, export Excel/PDF, dan dashboard KPI.
- Data besar harus memakai pagination server-side atau virtualization.
- Aksi destruktif harus menampilkan konsekuensi dan konfirmasi yang aksesibel; aksi “Hapus” selalu menjalankan soft delete dan menawarkan restore sesuai role.
- Migrasi ke Cuba wajib bertahap di balik feature flag: token → shell → primitives → satu route representatif → regression gate → route tersisa. Big-bang rewrite dilarang.
- Semua tabel operasional memakai primitive React `AdminDataTable` dengan sorting aksesibel, filter/search, pilihan 10/25/50/100, pagination server-side, row/page selection, state indeterminate, bulk action terotorisasi/teraudit, dan loading/empty/error/permission states.
- Semua modal memakai portal, posisi tengah atau full-screen mobile, backdrop blur, body scroll lock, focus trap, initial/return focus, background inert, Escape/backdrop close yang aman, dirty-form guard, dan larangan close ketika submit berjalan.
- Form wajib memiliki validasi client dan server; server tetap otoritas authorization, uniqueness, state transition, file policy, dan optimistic version.

## 9. Aturan Mobile — React Native

- Public Mobile: bottom tabs, notifikasi, offline cache terbatas, detail venue, jadwal, LiveScore, standings, galeri.
- Admin/Koresponden Mobile: login SSO, tugas hari ini, input skor cepat, scan QR, upload bukti, offline queue, sinkronisasi, riwayat aktivitas.
- Simpan token di secure storage/keychain, bukan AsyncStorage biasa.
- Gunakan large tap target dan form singkat.

## 10. Backend Golang Microservices

- Gunakan Go dengan struktur bersih: `cmd/`, `internal/`, `pkg/`, `migrations/`, `api/`.
- Framework: Gin/Fiber/Chi sesuai service; pilih konsisten dan dokumentasikan ADR.
- Database access: utamakan `pgxpool` + `sqlc`; ORM hanya bila disetujui. HTTP service dilarang membagikan satu `pgx.Conn` antargoroutine dan wajib memverifikasi pool dengan `Ping` saat startup.
- Error database lengkap wajib dicatat pada log internal terstruktur dan tidak boleh dikirim mentah pada response API.
- Gunakan validator, logging Zap/Zerolog, OpenTelemetry, Prometheus.
- Analytics pengunjung wajib terpisah dari monitoring teknis dan memakai Umami self-hosted di jaringan internal. Hanya tracker/kolektor same-origin yang boleh diekspos; panel/login/API Umami tetap privat. Tracker wajib menghormati Do Not Track dan dilarang mengirim query, hash, distinct ID, atau identitas akun. Dashboard Admin hanya membaca agregat melalui API Gateway ber-JWT/RBAC; browser tidak boleh menerima credential/token Umami. Access log Nginx tidak boleh dianggap jumlah pengunjung.
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
- Master Data adalah pemilik lokasi City Guide. Create/update City Guide wajib menerima `latitude` dan `longitude` desimal secara berpasangan; latitude harus `-90..90` dan longitude `-180..180`. `map_route_url` adalah metadata presentasi opsional, maksimal 2048 karakter, dan hanya boleh berupa URL HTTPS resmi Google Maps. Consumer wajib memprioritaskan URL valid yang terisi lalu membentuk tautan dari koordinat ketika kosong; koordinat tetap menjadi sumber kebenaran.
- Master Data adalah pemilik Hero Landing Page. Hero wajib memuat judul, isi, gambar latar, status aktif, metadata actor/waktu, dan tombstone; teks sorotan boleh opsional tetapi harus merupakan bagian judul. Hanya satu Hero aktif boleh ditayangkan. Gambar baru wajib merujuk Media Library aktif, Public hanya membaca projection aktif melalui API Gateway, dan komponen Public wajib mempunyai fallback canonical saat dependency belum siap.
- Migrasi City Guide boleh mempertahankan kedua koordinat sebagai null untuk record legacy, tetapi tidak boleh menyimpan hanya satu sisi, mengarang titik fallback, atau menerima pembaruan tanpa melengkapi pasangan koordinat.
- Catering dan Info Travel menyimpan kontak serta atribut layanan terstruktur. Info Travel wajib memiliki minimal satu jenis armada dan jumlah armada aktif minimal satu. Field screenshot eksternal dilarang; gambar City Guide harus berasal dari Media Library.
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
- HSTS production wajib dimiliki Nginx edge dengan `always` agar konsisten untuk Public, Admin, API, OIDC, upload, redirect, dan error response. Header identifikasi framework serta versi patch server harus dinonaktifkan pada aplikasi dan edge.
- Port HTTP production hanya boleh memberi redirect permanen ke origin HTTPS canonical dan wajib tetap membawa `X-Content-Type-Options` serta header defensif yang relevan. Public Web tidak boleh dilayani langsung melalui HTTP production.
- Public Web Next.js wajib memakai CSP nonce unik per request untuk script dan tidak boleh mengaktifkan kembali `script-src 'unsafe-inline'`. Kebutuhan style attribute dinamis library harus dibatasi melalui `style-src-attr`, tidak diperluas menjadi `style-src 'unsafe-inline'` global.
- Parameter route identifier harus divalidasi sebelum dependency call. Input malformed harus menghasilkan response 4xx stabil, bukan exception 500 atau payload error framework.
- Public Web production wajib menerbitkan `robots.txt` dan `sitemap.xml` valid pada HTTPS canonical; route metadata/error tidak boleh menghasilkan HTML 500 untuk input asset malformed.
- Edge production wajib mengeluarkan tepat satu CSP pada redirect HTTP dan seluruh response HTTPS. Setiap kebijakan harus mendefinisikan `base-uri`, `form-action`, dan `frame-ancestors` secara eksplisit karena directive tersebut tidak fallback ke `default-src`. Hanya CSP nonce Next.js yang terbukti memuat ketiga directive boleh diteruskan melalui normalisasi edge; CSP Keycloak serta upstream yang tidak lengkap wajib diganti fallback edge kompatibel.
- Public Web wajib membentuk nonce kriptografis unik per response melalui `apps/public-web-nextjs/src/proxy.ts`, memakai `strict-dynamic`, dan melarang script attribute melalui `script-src-attr 'none'`. HSTS adalah milik tunggal Nginx edge; Next.js, Vite, dan service aplikasi tidak boleh menerbitkan HSTS production sendiri.
- CSP Admin production wajib menggunakan `style-src 'self'` tanpa `'unsafe-inline'`; style attribute yang memang dibutuhkan dipisahkan pada `style-src-attr` dan tidak boleh memperlebar `style-src` global.
- Seluruh response HTTPS wajib mengirim tepat satu `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, dan `Cross-Origin-Resource-Policy: same-origin`. Resource pihak ketiga yang benar-benar diperlukan, termasuk tile/icon peta, wajib mendukung CORS/CORP dan dimuat dengan atribut CORS eksplisit; jangan menurunkan COEP untuk menyembunyikan regresi.
- Font UI wajib di-self-host dari dependency berlisensi dengan versi exact. Dilarang memakai `@import`, `<link>`, preload, atau allowlist CSP untuk `fonts.googleapis.com`, `fonts.gstatic.com`, maupun font CDN lain di production tanpa ADR dan persetujuan keamanan eksplisit. Release gate wajib memeriksa source, bundle, stylesheet live, CSP, dan daftar resource browser agar scanner tidak keluar dari origin aplikasi akibat dependency font.
- HSTS wajib tepat satu dan hanya pada HTTPS. Edge juga wajib menerapkan `server_tokens off`, penghilangan `X-Powered-By`, MIME sniffing protection, referrer/permissions policy, serta kebijakan cache khusus. Admin/API/LiveScore tidak boleh memakai shared cache jangka panjang.
- Route detail Public wajib memvalidasi ID canonical sebelum memanggil API. Path asset atau ID malformed harus menghasilkan `404`, bukan `500`, dan tidak boleh membocorkan error framework, timestamp internal, atau detail upstream.
- `.htaccess` dilarang dijadikan sumber kebijakan pada runtime canonical karena production memakai Nginx, bukan Apache. Semua header production harus dapat ditelusuri ke konfigurasi Nginx edge atau upstream tepercaya yang dinormalisasi edge.
- Response upstream `5xx` yang melintasi API Gateway wajib disanitasi; detail database, query, hostname internal, path, dan stack trace hanya boleh berada pada log internal terproteksi.
- Production Compose wajib fail-closed terhadap secret placeholder, origin non-canonical, working tree kotor, dan commit tidak cocok. Container aplikasi wajib non-root, read-only bila kompatibel, `no-new-privileges`, dan capability minimum.
- Release gate Git wajib menjalankan secret scan, audit penuh dependency npm termasuk toolchain build, `govulncheck`, lint/build/test, CodeQL, dan dependency review. Action eksternal harus dipin ke SHA immutable.
- Runtime Go pada source, CI, dan builder container wajib minimum 1.26.6 sampai baseline diperbarui berdasarkan advisory resmi.
- Release production wajib menjalankan regression probe header dan ZAP baseline pasif setelah deploy. Klaim penutupan alert Medium/Low hanya sah bila laporan JSON hasil scan baru menunjukkan `riskcode` 2 dan 1 masing-masing nol serta daftar site/instance tidak memuat origin pihak ketiga yang tidak disengaja; scan pasif anonim tidak menggantikan active/authenticated testing terjadwal.
- Credential yang pernah tercatat pada Git wajib dirotasi/revoke. Rewrite histori dan force-push hanya boleh dilakukan setelah backup, koordinasi seluruh clone, dan persetujuan eksplisit.

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

- Admin/OIDC pada VPS dilarang memakai alamat IP HTTP. Authorization Code +
  PKCE memerlukan secure context; penonaktifan PKCE atau token/password
  plaintext dilarang.
- Build, restore, dan migrasi Ubuntu wajib memakai proses server-side tahan
  reconnect, log persisten, lock tunggal, dan langkah idempotent.
- `DEPLOYMENT_VPS.md` adalah prosedur wajib untuk seluruh Agent AI/operator.
  Deployment harus dimulai dengan audit read-only, memakai commit Git exact
  melalui fast-forward, memiliki backup+checksum+rollback point sebelum
  mutation, dan ditutup dengan verifikasi runtime, migration, data parity,
  Media, TLS, OIDC, log, serta handoff bebas secret.
- Password, JWT, cookie, connection string, private key, `.env`, dan dump
  produksi dilarang berada di prompt Agent AI, source, dokumentasi, log, atau
  history Git. Credential yang pernah terekspos dianggap kompromi dan wajib
  dirotasi; rewrite history/force-push memerlukan persetujuan eksplisit.
- Agent dilarang memakai `StrictHostKeyChecking=no`, `--insecure` sebagai
  verifikasi klien final, menonaktifkan PKCE/JWT/TLS, atau mengulang job hanya
  karena UI Agent mengalami reconnect.

- Minimum production: Docker, Docker Compose staging, Nginx reverse proxy, SSL/TLS, PostgreSQL, Redis, NATS JetStream, Keycloak, CI/CD, backup, monitoring, log aggregation.
- Enterprise upgrade: Kubernetes, Nginx Ingress, Cert Manager, HPA, PostgreSQL HA, Redis Sentinel/Cluster, NATS Cluster, object storage, blue-green/canary deployment.
- Semua konfigurasi rahasia wajib memakai `.env` atau secret manager, tidak masuk git.

## 17. Soft Delete Wajib untuk Semua Data Persisten

> Status penerapan 27 Juli 2026: kontrak ini sudah diterapkan dan diuji pada Cabor, Nomor Pertandingan, Kontingen, City Guide, Media Library, Hero, Venue, dan Jadwal. Implementasi service/domain baru wajib memakai kontrak yang sama; keputusan teknis aktif dicatat pada `docs/adr/ADR-0002-soft-delete-and-port-namespaces.md`.

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
- Jika container upstream Nginx direcreate dan memperoleh IP Docker baru, Nginx wajib direload atau direcreate pada job deployment yang sama lalu diuji; edge tidak boleh dibiarkan memakai alamat upstream lama yang menghasilkan 502.
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

## 20. Pola Kerja, Quality Gate, dan Delivery

- Semua pekerjaan memakai `Explore → Analyze → Plan → Execute → Verify → Refine`, discovery tertarget, smallest coherent solution, dan preservasi perubahan existing.
- Dilarang menjanjikan “nol bug” tanpa bukti. Klaim selesai yang sah adalah tidak ada defect diketahui pada scope dan acceptance criteria terukur telah lulus.
- Quality gate standar selalu wajib: format, lint/typecheck, test terkait, build modul terdampak, diff check, dan secret scan dasar.
- Pengujian keamanan spesifik risiko tetap bagian correctness untuk auth, authorization, SSO, SQL/migration, upload, secret, dependency, public API, container, redirect, serta permission.
- Full DevSecOps—broad SAST, SBOM, Trivy, CodeQL, `govulncheck`, audit dependency penuh, provenance, ZAP, dan suite release—hanya dijalankan atas instruksi eksplisit atau release gate final.
- Commit/push memerlukan otorisasi delivery eksplisit setelah quality gate standar lulus. Merge memerlukan protected CI PASS pada SHA final dan instruksi merge eksplisit. Deploy, migrasi, dan akses VPS selalu memerlukan izin terpisah.
- Prompt pekerjaan harus satu blok salin yang ringkas dan memuat tujuan, scope/path, constraint, acceptance criteria, verifikasi, serta kondisi berhenti.

## 21. Media Image Policy

- File sumber gambar maksimal 20 MiB; server memvalidasi ukuran, ekstensi, magic bytes, MIME, dimensi, dan decompression bomb.
- Optimasi mencoba lossless terlebih dahulu. File hasil baru wajib maksimal `3.145.728` byte (3 MiB).
- Bila lossless tidak dapat memenuhi batas, pengguna wajib memilih kompresi lossy berkualitas tinggi atau batal; sistem tidak boleh menurunkan kualitas diam-diam.
- Metadata menyimpan checksum, MIME canonical, dimensi, ukuran, actor/ownership, waktu, dan relasi varian. UI membaca policy dari API agar batas client/server tidak menyimpang.
- Nama/path client tidak dipercaya; quarantine/scan diterapkan sesuai environment dan risiko.

## 22. Draft, Validasi, dan Revision History

- Draft form memakai server draft dengan key `OIDC sub + resource/form`, serta IndexedDB sebagai fallback lokal. Draft tidak boleh memuat password, token, credential, atau data rahasia.
- Autosave memakai debounce, status simpan yang jelas, retention, cleanup setelah submit, dan audit lifecycle. Konflik antarperangkat menghasilkan `409` dengan compare/restore, bukan overwrite diam-diam.
- Validasi client memberi feedback cepat; server memvalidasi ulang authorization, business rule, uniqueness, transition, file policy, dan optimistic version dengan error code stabil.
- Konten penting memiliki revision immutable berisi actor, waktu, alasan, nomor versi, dan snapshot/diff. Restore membuat revision baru; history lama tidak boleh diubah/dihapus.
- Audit keamanan/operasi dipisahkan dari revision konten. Perubahan kritis lintas service memakai transaksi state + outbox dan consumer idempotent.

## 23. Security, Performance, Reliability, dan SEO

- Security: least privilege, deny-by-default RBAC, MFA Admin, object-level authorization, secure OIDC/session, CSRF/CORS/rate limit, sanitasi rich text/URL/upload, parameterized query, secret manager, privacy-aware audit, pinned dependency/image, dan threat model untuk fitur berisiko.
- Performance: Public p75 menargetkan LCP ≤2,5 detik, INP ≤200 ms, CLS ≤0,1; gunakan responsive image, self-hosted font, code splitting, caching tepat, compression, query/index, pool koneksi, dan backend read-model. Admin memakai server pagination, cancellation/debounce, dan virtualization sesuai volume.
- Reliability: timeout, retry dengan backoff+jitter, circuit breaker, idempotency, graceful shutdown, health/readiness, bounded queue, job tahan reconnect, backup/restore drill dengan RPO/RTO, correlation ID, serta release evidence commit SHA/image digest/migration/checksum/smoke/rollback.
- Observability bertahap menargetkan OpenTelemetry, Prometheus/Grafana, Loki, dan Tempo. Integration Health Center hanya read-only dan tidak boleh mengekspos credential atau menjadi control plane.
- SEO Public: canonical, robots, sitemap, metadata unik, structured data valid, semantic HTML, internal linking, taxonomy/slug history, redirect permanen, dan kebijakan thin/duplicate/filter pages. Draft tidak boleh terindeks.

## 24. Adopsi Praktik Teman Belajar

PORPROV mengadopsi arah berikut tanpa menganggapnya sudah terimplementasi: source-of-truth matrix; root OpenAPI contract-first; environment security matrix; threat model per fitur; draft recovery; unified data table; media policy endpoint/checksum; backup/restore RPO/RTO drill; release evidence berdasarkan commit/image digest; OpenTelemetry+Loki+Tempo; Integration Health Center read-only; centralized platform config; notification center; SEO taxonomy/slug history/thin-page policy; dan vendor regression test. Status masing-masing wajib tercatat faktual di `FEATURES.md`.

Detail penerapan normatif berada di `docs/governance/ENGINEERING_UIUX_QUALITY_STANDARD.md`. Keputusan split UI berada di `docs/adr/ADR-0015-split-ui-authority-techwind-public-cuba-admin.md`; kontrak Admin berada di `docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md`.
