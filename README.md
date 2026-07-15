# Portal PORPROV XV Jawa Barat 2026 Kota Depok

Monorepo aplikasi web, mobile, Golang microservices, dan infrastruktur Docker untuk penyelenggaraan PORPROV XV Jawa Barat 2026 di Kota Depok. Repository ini juga memuat enam dokumen root yang menjadi pedoman bersama pengembang dan agent AI.

## Kondisi Aplikasi Saat Ini

- Admin Web, API Gateway, Master Data Service, Venue Service, Schedule Service, Media Library, PostgreSQL, Keycloak, Redis, NATS, dan monitoring telah mempunyai runtime Docker terintegrasi.
- CRUD Master Data, pemilihan Media Library, soft delete, dan pemulihan melalui Recycle Bin Admin sudah tersedia end-to-end untuk Cabor, Nomor Pertandingan, Kontingen, City Guide, Media, Venue, dan Jadwal. Hardening RBAC granular serta kebijakan retensi/purge tetap mengikuti `FEATURES.md`.
- Public Web tahap v0.4 sudah memiliki beranda Techwind PORPROV, listing serta detail Cabor/Venue, Jadwal teragregasi, LiveScore persisten dengan public SSE tersanitasi, dan Klasemen Medali yang hanya membaca submission OFFICIAL. Seluruh state loading/empty/error bersifat faktual tanpa data tiruan; peta interaktif, distributed realtime, dan deployment production dilanjutkan berdasarkan `FEATURES.md`.
- Hardening olahraga tahap v0.4 mencakup JWT issuer/expiry/client validation, role guard, private Admin SSE, revision/koreksi LiveScore append-only, workflow Medali PENDING–VERIFIED–OFFICIAL/REJECTED, transactional outbox LiveScore/Medali, serta Audit Log immutable dan deduplicated. Outbox domain lama, MFA, RBAC menyeluruh, dan hardening production tetap berstatus sesuai `FEATURES.md`.
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
| UI System | Techwind 3.3.0 sebagai baseline visual, Tailwind CSS v4.x, design tokens PORPROV, mobile-first, accessible components |


## Baseline UI/UX PORPROV

| Sumber Inspirasi | Prinsip yang Diambil | Adaptasi PORPROV |
|---|---|---|
| `theme-reference/HTML/Landing/` | Techwind Public Web: hero, navigation, event sections, cards, gallery, CTA, footer | Diimplementasikan ulang di Next.js menggunakan brand, konten, SEO, dan sports experience PORPROV |
| `theme-reference/HTML/Dashboard/` | Techwind Admin: sidebar, topbar, dashboard, form, table, calendar, gallery | Diimplementasikan ulang di React sebagai workspace operator PORPROV yang cepat, aman, dan role-aware |
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |

Target “masterpiece” bukan penyalinan template. UI harus orisinal, konsisten, memiliki seluruh state interaksi, mobile-first, WCAG 2.2 AA, cepat, SEO-ready untuk Public Web, efisien untuk Admin, serta lolos visual/accessibility regression sesuai risiko.

## Aturan Data Utama

Semua penghapusan data persisten wajib menggunakan soft delete. Record menyimpan waktu, actor, dan alasan yang relevan; query aktif menyembunyikan data terhapus; restore harus terotorisasi dan diaudit. File Media Library tetap disimpan selama masa retensi. Hard delete hanya diperbolehkan sebagai purge terkontrol, bukan aksi delete biasa.

## Sinkronisasi Pedoman

Setiap perubahan aturan atau standar wajib diterapkan pada keenam Markdown root yang relevan dalam pekerjaan yang sama. `RULES.md` adalah sumber normatif, `FEATURES.md` menyimpan status aktual, dan perubahan arsitektur tetap membutuhkan ADR.

## Port dan Mode Menjalankan

| Mode | Endpoint |
|---|---|
| Production | Nginx `80/443`; service domain tidak dipublikasikan |
| Docker development | Admin `5173`, API Gateway `8000`, Keycloak `8080` |
| Docker diagnostic | Master `18081`, Schedule `18082`, Venue `18087` |
| Local Go debug | Gateway `28000`, Master `28081`, Schedule `28082`, Venue `28087`; service lain mengikuti registry `28xxx` |
| Infrastruktur host | PostgreSQL `15432`, Redis `16379`, NATS `14222/18222`, Prometheus `19090`, Grafana `13000` |

Semua host port dapat diubah melalui `infra/docker/.env` berdasarkan template `.env.example`. Port internal Docker tidak perlu diubah saat migrasi hosting karena service berkomunikasi melalui DNS Compose.

Read-model publik Jadwal tersedia pada `GET /api/v1/schedule/matches/enriched`. Endpoint ini memperkaya match aktif dengan Cabor, Nomor Tanding, Kontingen/peserta, dan Venue pada Schedule Service; browser tetap hanya berkomunikasi melalui API Gateway.

Stream realtime publik berada di `GET /api/v1/stream/events` dan sengaja anonim untuk data tayang, tetapi tidak memuat actor/request/alasan koreksi. Workspace Admin menggunakan `GET /api/v1/stream/admin/events` dengan JWT di API Gateway dan secret internal pada hop service. Keputusan persistence, outbox, workflow, dan audit dicatat di [`docs/adr/ADR-0004-secure-realtime-transactional-outbox-and-verification.md`](docs/adr/ADR-0004-secure-realtime-transactional-outbox-and-verification.md).


## Cara Pakai

1. Baca `AI.md`, lalu `RULES.md`, `FEATURES.md`, `DOCUMENTATION.md`, `AGENTS.md`, dan README ini.
2. Simpan dokumen kebutuhan/desain resmi di `docs/reference/` dan laporkan bila belum tersedia.
3. Gunakan `theme-reference/HTML/Landing/` untuk audit UI Public dan `theme-reference/HTML/Dashboard/` untuk audit Admin.
4. Jalankan pekerjaan sesuai tahap yang telah dikonfirmasi dan perbarui dokumen/status terkait.

Panduan startup lengkap tersedia di [`docs/runbook/LOCAL_DEVELOPMENT.md`](docs/runbook/LOCAL_DEVELOPMENT.md). Pilih mode Docker Compose atau mode local development; jangan mencampur Admin dev `5174`/Gateway `28000` dengan Admin Docker `5173`/Gateway `8000` tanpa override environment yang disengaja.

## Catatan Orisinalitas

Techwind adalah baseline lokal proyek, sedangkan Flashscore dan ESPN adalah benchmark sports experience. Dilarang memublikasikan brand, logo, demo copy, atau identitas pihak ketiga sebagai bagian dari PORPROV. Gunakan asset resmi dan pastikan pemanfaatan tema sesuai lisensi proyek.
