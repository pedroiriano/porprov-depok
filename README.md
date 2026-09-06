# Portal PORPROV XV Jawa Barat 2026 Kota Depok

Monorepo aplikasi web, mobile, Golang microservices, dan infrastruktur Docker untuk penyelenggaraan PORPROV XV Jawa Barat 2026 di Kota Depok. Repository ini juga memuat enam dokumen tata kelola root dan `DEPLOYMENT_VPS.md` sebagai pedoman operasional aman bagi pengembang dan Agent AI.

## Kondisi Aplikasi Saat Ini

- Public Web, Admin Web, API Gateway, seluruh core service, PostgreSQL, Keycloak, Redis, NATS, monitoring teknis, dan Umami self-hosted mempunyai satu runtime Docker Compose terintegrasi.
- CRUD Master Data, pemilihan Media Library, soft delete, dan pemulihan melalui Recycle Bin Admin tersedia untuk Cabor, Nomor Pertandingan, Kontingen, City Guide, Media, Hero, Venue, dan Jadwal. City Guide memiliki koordinat terverifikasi, URL Google Maps opsional, pagination server-side Admin, serta form terstruktur Catering dan Info Travel. Info Travel mencatat jenis/jumlah armada; gambar selalu memakai Media Library dan bukan field screenshot eksternal. Status deployment mengikuti `FEATURES.md`.
- Susunan Peserta A/B kini dikelola bersama Jadwal sebagai dua sisi berjenis sama: Individu, Tim, atau Kontingen. Schedule Service menyimpan identitas peserta dan afiliasi kontingen secara transaksional; LiveScore hanya membaca susunan tersebut lalu mencatat skor/status, sehingga operator tidak menginput peserta dua kali.
- Schedule Service memakai `pgxpool` untuk seluruh query dan transaksi HTTP. Read-model Jadwal enriched tetap stabil ketika Public Web, Admin, dan API Gateway melakukan request serentak; detail database hanya dicatat pada log service dan tidak diekspos ke client.
- Public Web tahap v0.8 memiliki navigasi utama Beranda, Cabor, Venue, Jadwal, Klasemen, dan Jelajah; menu Jelajah membuka `/city-guide`. Beranda Techwind PORPROV memuat pengantar resmi PORPROV XV dan Maskot Toca-Toci, listing serta detail Cabor/Venue, Jadwal teragregasi, LiveScore persisten, dan Klasemen Medali OFFICIAL. Detail Venue menampilkan enam rekomendasi terdekat berdasarkan koordinat resmi. Seluruh state loading/empty/error bersifat faktual tanpa data tiruan; kelanjutan fitur mengikuti `FEATURES.md`.
- Baseline hardening v0.8 tersedia di source dan aktif di VPS Publik: Public Web membentuk CSP nonce unik per response, sedangkan Nginx menormalisasi tepat satu CSP lengkap untuk redirect HTTP dan response HTTPS, termasuk directive tanpa fallback. CSP nonce Public hanya dipertahankan bila lengkap; Admin/API/Upload/Keycloak serta upstream tidak lengkap memakai fallback edge, dan CSP Admin tidak lagi memakai `style-src 'unsafe-inline'`. Seluruh HTTPS memakai COOP `same-origin`, COEP `require-corp`, serta CORP `same-origin`; peta Leaflet memakai CORS eksplisit, ID detail malformed berhenti sebagai `404`, HSTS dimiliki tunggal oleh edge, header versi/framework dihilangkan, Admin/API/LiveScore memakai `no-store`, dan error upstream disanitasi. Nunito Variable normal/italic kini di-self-host melalui `@fontsource-variable/nunito` 5.3.0; runtime dan CSP tidak lagi bergantung pada Google Fonts. Deployment tahan rollback `external-font-hardening-20260810T075510Z`, smoke 15 endpoint, dan browser Public/Admin lulus. ZAP baseline 2.17.0 job `zap-font-rescan-20260810T075753Z` pada 10 Agustus 2026 memeriksa 292 endpoint dan terverifikasi `0 High / 0 Medium / 0 Low`. Sitemap/robots, allowlist query, npm audit penuh nol vulnerability, Go 1.26.5, govulncheck, secret scan, CodeQL/Dependabot, dan Compose production fail-closed dengan backup/checksum juga tersedia; active/authenticated scan dan rotasi credential historis tetap menjadi gate terpisah.
- Seluruh rute aktif Public dan Admin saat ini masih memiliki baseline Techwind `dist` yang telah diaudit. Governance v5 mempertahankan Techwind sebagai otoritas Public dan menetapkan Cuba sebagai target otoritas Admin; migrasi Admin belum dimulai dan berstatus `BLOCKED_LICENSE_EVIDENCE`, sehingga baseline aktif tetap dipertahankan sebagai rollback.
- Hardening olahraga tahap v0.4 mencakup JWT issuer/expiry/client validation, role guard, private Admin SSE, revision/koreksi LiveScore append-only, workflow Medali PENDING–VERIFIED–OFFICIAL/REJECTED, transactional outbox LiveScore/Medali, serta Audit Log immutable dan deduplicated. Hardening VA Public/edge v0.7 telah menghapus dua Medium lama `script-src/style-src unsafe-inline`; residual ZAP kedua ditangani melalui metadata `robots.txt`/`sitemap.xml`, HTTPS canonical, header defensif redirect, serta penolakan URL asset malformed di edge. Status deployment dan scan ulang mengikuti `FEATURES.md`.
- Kondisi dan quality gate aktual tidak boleh disimpulkan dari README saja; `FEATURES.md` adalah tracker status implementasi.

## File

| File | Fungsi |
|---|---|
| `AI.md` | Pintu masuk agent |
| `AGENTS.md` | Protokol Codex/VS Code |
| `RULES.md` | Aturan mutlak implementasi |
| `FEATURES.md` | Tracking fitur dan status |
| `DOCUMENTATION.md` | Dokumentasi teknis dan operasional |
| `README.md` | Orientasi repository, baseline, dan quick start |
| `DEPLOYMENT_VPS.md` | Pedoman kanonis deployment Ubuntu yang aman, tahan reconnect, dapat diaudit, dan bebas credential |
| `docs/governance/ENGINEERING_UIUX_QUALITY_STANDARD.md` | Standar engineering, delivery, UI/UX, media, draft/revision, security, performance, reliability, dan SEO |
| `docs/adr/ADR-0015-split-ui-authority-techwind-public-cuba-admin.md` | Keputusan Techwind Public, Cuba Admin, gate lisensi, migrasi bertahap, dan rollback |
| `docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md` | Mapping dan acceptance criteria implementasi Admin Cuba |
| `docs/runbook/LOCAL_DEVELOPMENT.md` | Runbook menjalankan Docker, seluruh service Go yang tersedia, Public Web, dan Admin Web |

## Stack Final

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


## Otoritas UI/UX PORPROV

| Area | Sumber Tema Wajib | Adaptasi PORPROV |
|---|---|---|
| Public Web | Techwind 3.3.0 `theme-reference/HTML/Landing/dist/`: hero, navigation, event sections, cards, gallery, CTA, footer | Diimplementasikan ulang di Next.js menggunakan identitas, konten, SEO, dan data olahraga PORPROV |
| Admin Web | Cuba Admin Dashboard; target snapshot lokal `theme-reference/Cuba/template/` setelah gate lisensi | Diimplementasikan ulang di React sebagai workspace operator PORPROV yang cepat, aman, dan role-aware; baseline Techwind aktif tetap rollback transisi |
| Mobile | Design tokens PORPROV dan pola tugas produk web terdekat | Diadaptasi mobile-native; tidak membuat tema ketiga |

Target “masterpiece” adalah fidelity terukur terhadap otoritas masing-masing—Techwind Public dan Cuba Admin—bukan penyalinan brand/demo/vendor runtime mentah atau pencampuran global style. UI harus konsisten, memiliki state lengkap, mobile-first, WCAG 2.2 AA, cepat, SEO-ready untuk Public, efisien untuk Admin, serta lolos visual/accessibility regression sesuai risiko.

Folder referensi UI di luar root hanya upstream read-only dan tidak boleh menjadi dependency build/runtime. Bukti lisensi template belum ditemukan pada audit 6 September 2026; karena itu penyalinan vendor dan implementasi Cuba tetap diblokir. Aturan rinci tersedia di [`docs/governance/ENGINEERING_UIUX_QUALITY_STANDARD.md`](docs/governance/ENGINEERING_UIUX_QUALITY_STANDARD.md), keputusan arsitektur di [`ADR-0015`](docs/adr/ADR-0015-split-ui-authority-techwind-public-cuba-admin.md), dan mapping Admin di [`ADMIN_CUBA_VISUAL_CONTRACT.md`](docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md).

Tema runtime wajib memakai class `.dark` sebagai satu-satunya pemicu utility `dark:*`; preferensi warna sistem hanya boleh menentukan nilai awal. Teks normal harus mencapai rasio kontras minimal 4,5:1 dan teks besar/komponen grafis esensial minimal 3:1 pada kedua tema.

## Aturan Data Utama

Semua penghapusan data persisten wajib menggunakan soft delete. Record menyimpan waktu, actor, dan alasan yang relevan; query aktif menyembunyikan data terhapus; restore harus terotorisasi dan diaudit. File Media Library tetap disimpan selama masa retensi. Hard delete hanya diperbolehkan sebagai purge terkontrol, bukan aksi delete biasa.

Lokasi City Guide wajib menyimpan pasangan koordinat desimal `latitude` dan `longitude` sebagai sumber kebenaran. Latitude berada pada rentang `-90..90` dan longitude `-180..180`. Field opsional `map_route_url` dapat menyimpan URL HTTPS resmi Google Maps untuk pengalaman rute bernama; consumer memprioritaskan URL tersebut bila valid dan otomatis membentuk tautan dari koordinat bila kosong.

## Sinkronisasi Pedoman

Setiap perubahan aturan atau standar wajib diterapkan pada keenam Markdown root yang relevan dalam pekerjaan yang sama. `RULES.md` adalah sumber normatif, `FEATURES.md` menyimpan status aktual, dan perubahan arsitektur tetap membutuhkan ADR.

## Port dan Mode Menjalankan

| Mode | Endpoint |
|---|---|
| Production | Nginx `80/443`; service domain tidak dipublikasikan |
| Docker development | Public `3000`, Admin `5173`, API Gateway `8000`, Keycloak `8080` |
| Docker diagnostic | Master `18081`, Schedule `18082`, Venue `18087` |
| Local Go debug | Gateway `28000`, Master `28081`, Schedule `28082`, Venue `28087`; service lain mengikuti registry `28xxx` |
| Infrastruktur host | PostgreSQL `15432`, Redis `16379`, NATS `14222/18222`, Prometheus `19090`, Grafana `13000` |

Semua host port dapat diubah melalui file `.env` lokal yang dibuat dari `infra/docker/.env.example`. File `.env` aktual tidak dilacak Git. Port internal Docker tidak perlu diubah saat migrasi hosting karena service berkomunikasi melalui DNS Compose.

Read-model publik Jadwal tersedia pada `GET /api/v1/schedule/matches/enriched`. Endpoint ini memperkaya match aktif dengan Cabor, Nomor Tanding, Peserta A/B terurut (`individual`, `team`, atau `contingent`), Kontingen, dan Venue pada Schedule Service; browser tetap hanya berkomunikasi melalui API Gateway. Kontrak kepemilikan peserta dijelaskan di [`docs/adr/ADR-0006-schedule-participant-ownership.md`](docs/adr/ADR-0006-schedule-participant-ownership.md).

Stream realtime publik berada di `GET /api/v1/stream/events` dan sengaja anonim untuk data tayang, tetapi tidak memuat actor/request/alasan koreksi. Workspace Admin menggunakan `GET /api/v1/stream/admin/events` dengan JWT di API Gateway dan secret internal pada hop service. Keputusan persistence, outbox, workflow, dan audit dicatat di [`docs/adr/ADR-0004-secure-realtime-transactional-outbox-and-verification.md`](docs/adr/ADR-0004-secure-realtime-transactional-outbox-and-verification.md).

Hero Landing Page aktif tersedia pada `GET /api/v1/master-data/heroes/active`; daftar dan seluruh mutasinya tetap terproteksi JWT. Keputusan ownership, aktivasi tunggal, Media Library, fallback, dan soft delete dicatat di [`docs/adr/ADR-0008-dynamic-public-hero-ownership.md`](docs/adr/ADR-0008-dynamic-public-hero-ownership.md).

Analytics pengunjung memakai Umami self-hosted tanpa membuka panel Umami ke internet. Public hanya dapat memuat tracker same-origin dan mengirim event anonim; ringkasan statistik dibaca server-side oleh API Gateway pada `GET /api/v1/analytics/overview` untuk role `super_admin` atau `auditor`. Arsitektur, privasi, dan batas eksposur dicatat di [`docs/adr/ADR-0014-self-hosted-visitor-analytics.md`](docs/adr/ADR-0014-self-hosted-visitor-analytics.md).


## Cara Pakai

Deployment production memakai Nginx port 80 hanya untuk redirect menuju HTTPS.
Public canonical berada di `https://porprov.depok.go.id/` dan Admin di
`https://porprov.depok.go.id/admin/`. Keycloak serta API bertoken memakai
origin HTTPS yang sama karena OIDC PKCE tidak dapat berjalan aman pada alamat
IP HTTP. Build/restore panjang wajib dijalankan sebagai job server-side tahan
reconnect. Lihat
[`DEPLOYMENT_VPS.md`](DEPLOYMENT_VPS.md) sebagai aturan kanonis dan
[`docs/runbook/VPS_UBUNTU_INTRANET.md`](docs/runbook/VPS_UBUNTU_INTRANET.md)
sebagai ringkasan perintah. Deployment yang me-recreate upstream wajib sekaligus
me-reload/recreate Nginx dan menjalankan smoke HTTPS agar DNS container edge segar.

Domain production resmi adalah `https://porprov.depok.go.id`; Public berada di
root dan Admin berada di `https://porprov.depok.go.id/admin/`.

Untuk sertifikat wildcard resmi, operator memakai
`infra/docker/install-official-tls.sh`; target canonical-nya adalah
`infra/docker/tls`. Installer ini tetap dapat membuktikan TLS melalui SNI
loopback saat DNS belum tersedia dan melaporkan `TLS_INSTALLED_DNS_PENDING`
tanpa mengklaim domain publik sudah aktif.

1. Baca `AI.md`, lalu `RULES.md`, `FEATURES.md`, `DOCUMENTATION.md`, `AGENTS.md`, README ini, dan `DEPLOYMENT_VPS.md` sebelum menyentuh VPS.
2. Simpan dokumen kebutuhan/desain resmi di `docs/reference/` dan laporkan bila belum tersedia.
3. Gunakan `theme-reference/HTML/Landing/dist/` untuk audit UI Public. Admin aktif masih diaudit terhadap baseline Techwind sampai snapshot Cuba lokal berlisensi tersedia; pekerjaan Admin baru mengikuti kontrak Cuba dan gate ADR-0015.
4. Jalankan full stack hanya melalui baseline berikut:

```powershell
Set-Location .\infra\docker
Copy-Item .\.env.example .\.env -ErrorAction SilentlyContinue
.\compose-up.ps1
```

5. Akses Public `http://localhost:3000` dan Admin `http://localhost:5173`. Bootstrap realm/client/role Keycloak berjalan otomatis dan idempotent.
6. Jalankan pekerjaan sesuai tahap yang telah dikonfirmasi dan perbarui dokumen/status terkait.

Panduan startup lengkap tersedia di [`docs/runbook/LOCAL_DEVELOPMENT.md`](docs/runbook/LOCAL_DEVELOPMENT.md). Namespace `28xxx` hanya untuk debugging satu komponen secara eksplisit; hentikan container domain yang sama sebelum menjalankan `go run` agar database dan storage tidak menerima concurrent writer.

## Catatan Orisinalitas

Techwind pada `Landing/dist` adalah otoritas Public; Cuba adalah target otoritas Admin setelah gate lisensi. Produk lain tidak boleh menjadi visual language ketiga, dan global style kedua template tidak boleh dicampur. Dilarang memublikasikan brand, logo, demo copy, atau identitas vendor sebagai bagian dari PORPROV; gunakan asset resmi serta bukti lisensi yang dapat diverifikasi.
