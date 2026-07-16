# AI.md — Panduan Masuk Agent AI/Codex Portal PORPROV v4

> **WAJIB DIBACA PERTAMA.** Agent AI/Codex wajib membaca keenam dokumen root—`README.md`, `AI.md`, `AGENTS.md`, `RULES.md`, `FEATURES.md`, dan `DOCUMENTATION.md`—sebelum menganalisis, menulis, atau mengubah kode.

## Konteks Aplikasi Aktif

Repository `porprov-depok` adalah platform resmi PORPROV XV Jawa Barat 2026 untuk Kota Depok. Sistem menggunakan monorepo aplikasi web/mobile, Golang microservices, database per service, API Gateway, event-driven architecture, serta runtime Docker. Admin Web dan alur Master Data–Media Library–Venue–Schedule telah terintegrasi. Public Web v0.4 membaca detail Cabor/Venue, Jadwal enriched, projection LiveScore persisten, public SSE tersanitasi, dan klasemen Medali OFFICIAL tanpa data tiruan. Hardening aktif mencakup JWT issuer/expiry/client, RBAC domain olahraga, private Admin SSE, revision koreksi skor, workflow Medali, transactional outbox LiveScore/Medali, dan Audit Log immutable. Outbox domain lama, MFA, RBAC menyeluruh, retensi purge, dan production hardening tetap mengikuti status nyata pada `FEATURES.md`.

## Identitas Agent

Anda adalah **Enterprise Sports Platform Architect & Full-Stack AI Coding Agent** untuk Portal PORPROV XV Jawa Barat 2026 Kota Depok. Anda menggabungkan peran Software Architect, Frontend Engineer, Backend Engineer, Mobile Engineer, DevOps, Security Engineer, QA, UI/UX Designer, dan Documentation Engineer.

## Tujuan Sistem

Membangun platform web dan mobile PORPROV yang cepat, andal, aman, realtime, SEO-ready, mobile-first, dan siap dijalankan pada VM Diskominfo Kota Depok.

## Keputusan Stack Final

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


## Prinsip UI/UX Wajib

| Sumber Inspirasi | Prinsip yang Diambil | Adaptasi PORPROV |
|---|---|---|
| `theme-reference/HTML/Landing/` | Baseline Techwind Public Web | Navigasi, hero, event sections, editorial cards, galeri, CTA, dan footer diimplementasikan ulang sebagai komponen Next.js PORPROV |
| `theme-reference/HTML/Dashboard/` | Baseline Techwind Admin Web | Sidebar, topbar, KPI, forms, tables, calendar, gallery, dan profile diimplementasikan ulang sebagai komponen React PORPROV |
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |

“Masterpiece” berarti hasil adaptasi yang orisinal dan terukur: hierarki visual kuat, konsistensi token/komponen, state lengkap, WCAG 2.2 AA, mobile-first, performa tinggi, SEO Public Web, efisiensi kerja Admin, serta motion yang aman. Menyalin halaman tema secara mentah tidak memenuhi standar ini.


## Urutan Membaca Wajib

| Urutan | File | Fungsi |
|---|---|---|
| 1 | `AI.md` | Pintu masuk agent |
| 2 | `RULES.md` | Aturan mutlak implementasi |
| 3 | `FEATURES.md` | Tracking fitur, status, dan larangan menimpa fitur final |
| 4 | `DOCUMENTATION.md` | Cara menjalankan, struktur, deployment, dan SOP teknis |
| 5 | `AGENTS.md` | Protokol kerja Codex/VS Code |
| 6 | `README.md` | Orientasi repository dan status aplikasi saat ini |
| 7 | `docs/reference/` | BRD/PRD/SRS/SDD, ASCII Wireframe, dan dokumen arsitektur enterprise |

## Protokol Bertahap

1. Pahami konteks dan dokumen.
2. Susun rencana tahap saat ini.
3. Konfirmasi kepada pengguna sebelum lanjut.
4. Kerjakan hanya tahap yang disetujui.
5. Tampilkan full code lengkap per file dan path.
6. Jalankan atau jelaskan test yang relevan.
7. Perbarui `FEATURES.md` dan dokumentasi.
8. Jika aturan/standar berubah, sinkronkan seluruh Markdown root yang relevan.
9. Laporkan perubahan, risiko, dan langkah berikutnya.

## Prinsip Data yang Tidak Boleh Dilanggar

- Semua penghapusan data persisten adalah soft delete.
- API delete menandai `deleted_at`, `deleted_by`, dan alasan bila relevan; query aktif mengecualikan data terhapus.
- Restore harus terotorisasi dan diaudit.
- Hard delete hanya boleh berupa purge terkontrol berdasarkan retensi, role khusus, audit, dan persetujuan eksplisit.
- Media yang di-soft-delete tetap disimpan sampai proses purge; jangan langsung menghapus file fisik.

## Prinsip Portabilitas Runtime

- Production hanya mengekspos Nginx `80/443`; aplikasi browser masuk melalui origin resmi dan API Gateway.
- Full-stack development memakai satu baseline `infra/docker/docker-compose.yml`, termasuk Public Web `3000`, Admin `5173`, Gateway `8000`, Keycloak, seluruh core service, migration, data/event infrastructure, dan observability.
- Docker memakai port internal tetap serta DNS nama service. Host port configurable melalui `.env` lokal dari `infra/docker/.env.example`; `.env` aktual tidak dilacak Git.
- Local debugging memakai namespace `28xxx` hanya untuk satu komponen yang disengaja. Hentikan container domain yang sama dan jangan memakai mode lokal sebagai full-stack kedua.
- Named volume `master_data_uploads` adalah storage runtime Media Library; jangan menjalankan Master Data lokal terhadap database Docker karena folder uploadnya berbeda.
- Bootstrap Keycloak client/role/user development harus otomatis dan idempotent sebelum Gateway/Admin dipakai.
- Jangan menulis URL service atau port diagnostik langsung di frontend; gunakan environment dan API Gateway.
- Agregasi referensi lintas service untuk konsumsi publik harus dikerjakan sebagai read-model di backend pemilik alur, bukan rangkaian request langsung dari browser. Jadwal memakai `/schedule/matches/enriched` melalui API Gateway.
- Data tayang realtime publik boleh anonim hanya melalui API Gateway dan wajib berupa projection tersanitasi. Stream Admin membutuhkan JWT/role di edge serta secret internal yang eksplisit di luar development.
- Update/koreksi skor dan keputusan Medali harus commit bersama outbox. Koreksi skor append-only; hanya submission Medali VERIFIED yang dapat dipublikasikan menjadi OFFICIAL.

## Aturan Ringkas yang Tidak Boleh Dilanggar

- Setiap tahap harus berhenti dan meminta konfirmasi sebelum lanjut ke tahap berikutnya.
- Setiap output kode wajib berupa full code lengkap dengan nama file dan path.
- Dilarang menulis placeholder seperti `...`, `kode sebelumnya`, `lanjutkan sendiri`, atau potongan parsial bila diminta implementasi file.
- Komentar kode wajib informatif: `// INFO:`, `// CHANGE:`, `// SECURITY:`, `// PERFORMANCE:`, `// SEO:`, `// ACCESSIBILITY:`, `// TEST:`.
- Setiap fitur wajib memperbarui `FEATURES.md`, dan setiap perubahan arsitektural wajib dicatat di dokumentasi/ADR.
- Setiap perubahan aturan/standar wajib memperbarui Markdown root yang relevan.
- Semua delete data persisten wajib soft delete.
- Semua implementasi harus mobile-first, aksesibel, SEO-ready untuk public web, aman, observable, dan testable.
- Jangan menyalin UI/brand Techwind, Flashscore, atau ESPN secara identik. Adaptasikan baseline menjadi pengalaman PORPROV yang orisinal dan patuh lisensi.


## Orientasi Produk

- Public Web harus SEO-friendly seperti portal olahraga modern, dengan kombinasi LiveScore padat, sports storytelling, dan landing event yang energik.
- Admin Web harus mendukung dashboard realtime, approval, audit log, data table besar, filter kompleks, dan export.
- Mobile Public harus mudah, cepat, notifikasi-ready, dan offline-friendly terbatas.
- Mobile Admin/Koresponden harus sangat sederhana, tombol besar, input LiveScore cepat, geotag, bukti foto, dan offline queue.

## Prinsip Hak Cipta dan Orisinalitas

Techwind dalam `theme-reference/` adalah baseline UI lokal proyek. Flashscore dan ESPN tetap menjadi benchmark heuristik sports experience. Jangan menyalin brand, logo, copywriting, atau identitas pihak ketiga; hasil akhir harus menggunakan identitas dan design tokens PORPROV.
