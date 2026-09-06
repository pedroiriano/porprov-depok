# AI.md — Panduan Masuk Agent AI/Codex Portal PORPROV v5

> **WAJIB DIBACA PERTAMA.** Agent AI/Codex wajib membaca keenam dokumen tata kelola root—`README.md`, `AI.md`, `AGENTS.md`, `RULES.md`, `FEATURES.md`, dan `DOCUMENTATION.md`—sebelum menganalisis, menulis, atau mengubah kode. Untuk seluruh pekerjaan VPS, `DEPLOYMENT_VPS.md` juga wajib dibaca lengkap.

## Konteks Aplikasi Aktif

Deployment VPS Ubuntu intranet memakai Nginx sebagai edge. Seluruh origin
production memakai HTTPS canonical; port HTTP hanya memberi redirect permanen
dengan header defensif. Admin `/admin/`, Keycloak, dan API bertoken tetap berada
pada origin HTTPS yang sama. Build, restore, dan migrasi
panjang dijalankan sebagai job server-side dengan lock, log, dan checkpoint
agar reconnect client tidak menghentikan pekerjaan. Job yang me-recreate
upstream Nginx juga wajib me-recreate/reload Nginx dan menjalankan smoke HTTPS
agar alamat DNS Docker tidak tertahan pada IP container lama.

Repository `porprov-depok` adalah platform resmi PORPROV XV Jawa Barat 2026 untuk Kota Depok. Sistem menggunakan monorepo aplikasi web/mobile, Golang microservices, database per service, API Gateway, event-driven architecture, serta runtime Docker. Admin Web dan alur Master Data–Media Library–Venue–Schedule telah terintegrasi. Navigasi Public Web canonical adalah Beranda, Cabor, Venue, Jadwal, Klasemen, dan Jelajah; Jelajah menuju `/city-guide`. Public membaca detail Cabor/Venue, Jadwal enriched, projection LiveScore persisten, public SSE tersanitasi, dan klasemen Medali OFFICIAL tanpa data tiruan. Hardening aktif mencakup CSP nonce per request, HSTS di edge, HTTPS canonical, metadata SEO resmi, pengurangan fingerprint, dan penolakan input malformed sebagai 4xx. Status domain lain tetap mengikuti `FEATURES.md`.

Schedule Service adalah pemilik susunan Peserta A/B pertandingan. Admin memilih satu jenis yang sama untuk kedua sisi—`individual`, `team`, atau `contingent`—lalu mengisi afiliasi Kontingen dan identitas yang relevan bersama Jadwal; LiveScore hanya mengonsumsi susunan terurut tersebut dan dilarang membuat identitas peserta paralel.

Service Go yang menerima request paralel wajib memakai pool koneksi PostgreSQL (`pgxpool`), bukan membagikan satu `pgx.Conn` antargoroutine. Error database dicatat pada log internal dengan konteks operasional dan dikembalikan ke client sebagai pesan stabil tanpa detail sensitif.

Master Data Service adalah pemilik City Guide beserta pasangan koordinat desimalnya. Create/update wajib menerima latitude dan longitude berpasangan dengan rentang geografis valid. `map_route_url` bersifat opsional dan hanya menerima URL HTTPS resmi Google Maps; UI memprioritaskannya bila valid lalu membentuk tautan peta dari koordinat bila kosong. Pencarian publik memakai query `q` tunggal maksimal 80 karakter, sedangkan Admin memakai pagination server-side maksimal 100 baris. Catering dan Info Travel menyimpan kontak/layanan terstruktur; Info Travel wajib memiliki jenis serta jumlah armada. Gambar berasal dari Media Library dan tidak ada field screenshot eksternal.

Master Data Service juga menjadi pemilik konten Hero Landing Page. Judul, teks sorotan opsional, isi, gambar Media Library, dan status aktif dikelola melalui Admin; hanya satu Hero aktif boleh ditayangkan. Public Web hanya membaca projection Hero aktif melalui API Gateway dan memakai fallback canonical ketika dependency belum siap. Delete Hero wajib soft delete dan restore melalui Recycle Bin.

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
| UI System | Techwind 3.3.0 untuk Public, Cuba Admin Dashboard untuk Admin, Tailwind CSS v4.x sebagai mesin implementasi, design tokens PORPROV, mobile-first, accessible components |


## Otoritas UI/UX Wajib

| Area | Sumber Tema Wajib | Adaptasi PORPROV |
|---|---|---|
| Public Web | Techwind 3.3.0 `theme-reference/HTML/Landing/dist/` | Navigasi, hero, event sections, editorial cards, galeri, CTA, footer, dan penyajian data olahraga diimplementasikan ulang sebagai komponen Next.js PORPROV |
| Admin Web | Cuba Admin Dashboard; target lokal `theme-reference/Cuba/template/` setelah gate lisensi | Sidebar, topbar, KPI, forms, tables, calendar, gallery, profile, dan workflow operator diimplementasikan ulang sebagai komponen React PORPROV; Admin Techwind aktif tetap baseline transisi |
| Mobile | Design tokens PORPROV dan pola tugas produk web terdekat | Adaptasi mobile-native; dilarang membuat tema ketiga |

“Masterpiece” berarti hasil adaptasi otoritas visual yang terukur: hierarki visual kuat, konsistensi token/komponen, state lengkap, WCAG 2.2 AA, mobile-first, performa tinggi, SEO Public Web, efisiensi kerja Admin, serta motion yang aman. Techwind dan Cuba tidak boleh dicampur sebagai global style; penyalinan brand/demo/vendor runtime mentah tidak memenuhi standar. Tailwind CSS dan library komponen adalah alat teknis, bukan sumber tema.

Folder upstream UI di luar root hanya boleh dibaca sebagai referensi. Build/runtime tidak boleh bergantung kepadanya. Implementasi atau penyalinan Cuba berstatus `BLOCKED_LICENSE_EVIDENCE` sampai bukti lisensi diverifikasi; arah dan tahapan migrasi ada di `docs/adr/ADR-0015-split-ui-authority-techwind-public-cuba-admin.md`.

Tailwind CSS v4 wajib mengikat utility `dark:*` hanya ke class `.dark`, selaras dengan toggle Techwind. Preferensi sistem hanya menentukan pilihan awal; token semantik dan pasangan warna harus memenuhi kontras WCAG 2.2 AA pada tema terang maupun gelap. Audit rute dicatat di `docs/uiux/TECHWIND_DIST_LIGHT_DARK_AUDIT.md`.


## Urutan Membaca Wajib

| Urutan | File | Fungsi |
|---|---|---|
| 1 | `AI.md` | Pintu masuk agent |
| 2 | `RULES.md` | Aturan mutlak implementasi |
| 3 | `FEATURES.md` | Tracking fitur, status, dan larangan menimpa fitur final |
| 4 | `DOCUMENTATION.md` | Cara menjalankan, struktur, deployment, dan SOP teknis |
| 5 | `AGENTS.md` | Protokol kerja Codex/VS Code |
| 6 | `README.md` | Orientasi repository dan status aplikasi saat ini |
| 7 | `DEPLOYMENT_VPS.md` | Aturan deployment aman, backup/restore, TLS/OIDC, rollback, dan handoff Agent AI |
| 8 | `docs/reference/` | BRD/PRD/SRS/SDD, ASCII Wireframe, dan dokumen arsitektur enterprise |
| 9 | `docs/governance/ENGINEERING_UIUX_QUALITY_STANDARD.md` | Kontrak engineering, delivery, UI primitives, media, draft/revision, security, performance, reliability, dan SEO |
| 10 | ADR-0015 + `docs/uiux/ADMIN_CUBA_VISUAL_CONTRACT.md` | Wajib sebelum pekerjaan Admin UI/Cuba |

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

Quality gate standar wajib: format, lint/typecheck, test terkait, build terdampak, diff check, dan secret scan dasar. Security test spesifik risiko tetap wajib. Full DevSecOps hanya atas instruksi eksplisit atau release gate final. Commit/push memerlukan otorisasi delivery; merge memerlukan protected CI PASS pada SHA final dan instruksi merge; deploy, migrasi, serta akses VPS memerlukan izin terpisah. Gunakan klaim “tidak ada defect diketahui pada scope” berdasarkan acceptance criteria, bukan janji absolut.

## Prinsip Data yang Tidak Boleh Dilanggar

- Semua penghapusan data persisten adalah soft delete.
- API delete menandai `deleted_at`, `deleted_by`, dan alasan bila relevan; query aktif mengecualikan data terhapus.
- Restore harus terotorisasi dan diaudit.
- Hard delete hanya boleh berupa purge terkontrol berdasarkan retensi, role khusus, audit, dan persetujuan eksplisit.
- Media yang di-soft-delete tetap disimpan sampai proses purge; jangan langsung menghapus file fisik.
- City Guide aktif wajib mempunyai latitude `-90..90` dan longitude `-180..180` yang diisi berpasangan. `map_route_url` boleh kosong; bila terisi harus berupa URL HTTPS Google Maps yang tervalidasi dan dipakai sebelum fallback koordinat. Record legacy tanpa koordinat hanya boleh dipertahankan untuk migrasi dan harus dilengkapi melalui form edit sebelum pembaruan berikutnya.

## Prinsip Portabilitas Runtime

- Production hanya mengekspos Nginx `80/443`; aplikasi browser masuk melalui origin resmi dan API Gateway.
- Full-stack development memakai satu baseline `infra/docker/docker-compose.yml`, termasuk Public Web `3000`, Admin `5173`, Gateway `8000`, Keycloak, seluruh core service, migration, data/event infrastructure, observability teknis, dan Umami self-hosted. Panel/API Umami tidak diekspos langsung; tracker publik harus same-origin dan statistik Admin wajib melalui API Gateway ber-JWT/RBAC.
- Docker memakai port internal tetap serta DNS nama service. Host port configurable melalui `.env` lokal dari `infra/docker/.env.example`; `.env` aktual tidak dilacak Git.
- Local debugging memakai namespace `28xxx` hanya untuk satu komponen yang disengaja. Hentikan container domain yang sama dan jangan memakai mode lokal sebagai full-stack kedua.
- Named volume `master_data_uploads` adalah storage runtime Media Library; jangan menjalankan Master Data lokal terhadap database Docker karena folder uploadnya berbeda.
- Bootstrap Keycloak client/role/user development harus otomatis dan idempotent sebelum Gateway/Admin dipakai.
- Jangan menulis URL service atau port diagnostik langsung di frontend; gunakan environment dan API Gateway.
- Agregasi referensi lintas service untuk konsumsi publik harus dikerjakan sebagai read-model di backend pemilik alur, bukan rangkaian request langsung dari browser. Jadwal memakai `/schedule/matches/enriched` melalui API Gateway.
- Master Data memiliki referensi Kontingen, Schedule memiliki susunan peserta per match, dan LiveScore memiliki revisi skor. Penggantian susunan peserta wajib satu transaksi dengan perubahan Jadwal serta melakukan soft delete pada susunan lama.
- Data tayang realtime publik boleh anonim hanya melalui API Gateway dan wajib berupa projection tersanitasi. Stream Admin membutuhkan JWT/role di edge serta secret internal yang eksplisit di luar development.
- Update/koreksi skor dan keputusan Medali harus commit bersama outbox. Koreksi skor append-only; hanya submission Medali VERIFIED yang dapat dipublikasikan menjadi OFFICIAL.
- Deployment VPS wajib mengikuti `DEPLOYMENT_VPS.md`: audit read-only lebih dahulu, backup/checksum sebelum mutation, Git fast-forward commit terverifikasi, job server-side dengan lock/status/log, serta quality gate data, TLS, OIDC, dan rollback. Credential tidak boleh berada di prompt, file Git, atau log.
- Security release gate wajib meliputi tepat satu CSP lengkap pada setiap redirect HTTP dan response HTTPS; `base-uri`, `form-action`, serta `frame-ancestors` selalu eksplisit. Public Web membentuk nonce unik per response di `src/proxy.ts`; edge hanya mempertahankan CSP nonce Public bila ketiga directive tersebut terdeteksi lengkap. Admin/API/Upload/Keycloak dan setiap CSP upstream yang tidak lengkap memakai fallback deterministik; CSP Admin production melarang `style-src 'unsafe-inline'`. Seluruh HTTPS wajib mengirim COOP `same-origin`, COEP `require-corp`, dan CORP `same-origin`; resource peta eksternal harus dimuat melalui CORS. Font aplikasi wajib di-self-host dari dependency berlisensi dan dipin; CSS, HTML, serta CSP production tidak boleh memanggil Google Fonts atau font CDN lain tanpa keputusan keamanan eksplisit. HSTS hanya diterbitkan edge dan tepat satu melalui HTTPS, header versi/framework dihilangkan, Admin/API/LiveScore memakai `no-store`, ID detail Public yang tidak canonical langsung menjadi `404`, error `5xx` disanitasi di API Gateway, serta audit penuh dependency npm termasuk toolchain build, `govulncheck`, secret scan, container production fail-closed, smoke header, pemeriksaan dependency lintas-origin browser, dan ZAP baseline pasif wajib lulus. Runtime Go minimal 1.26.5 dan dependency `golang.org/x/text` minimal 0.39.0 sampai baseline diperbarui melalui advisory resmi.
- Secret yang pernah masuk histori Git dianggap bocor walaupun file sudah dihapus. Rotasi/revoke dilakukan sebelum rewrite histori; force-push histori membutuhkan persetujuan dan koordinasi eksplisit.

## Aturan Ringkas yang Tidak Boleh Dilanggar

- Setiap tahap harus berhenti dan meminta konfirmasi sebelum lanjut ke tahap berikutnya.
- Setiap output kode wajib berupa full code lengkap dengan nama file dan path.
- Dilarang menulis placeholder seperti `...`, `kode sebelumnya`, `lanjutkan sendiri`, atau potongan parsial bila diminta implementasi file.
- Komentar kode wajib informatif: `// INFO:`, `// CHANGE:`, `// SECURITY:`, `// PERFORMANCE:`, `// SEO:`, `// ACCESSIBILITY:`, `// TEST:`.
- Setiap fitur wajib memperbarui `FEATURES.md`, dan setiap perubahan arsitektural wajib dicatat di dokumentasi/ADR.
- Setiap perubahan aturan/standar wajib memperbarui Markdown root yang relevan.
- Semua delete data persisten wajib soft delete.
- Semua implementasi harus mobile-first, aksesibel, SEO-ready untuk public web, aman, observable, dan testable.
- Gunakan Techwind untuk Public dan Cuba untuk Admin sesuai gate lisensi; jangan mencampur keduanya atau mengambil visual language ketiga.


## Orientasi Produk

- Public Web harus SEO-friendly seperti portal olahraga modern, dengan kombinasi LiveScore padat, sports storytelling, dan landing event yang energik.
- Admin Web harus mendukung dashboard realtime, approval, audit log, data table besar, filter kompleks, dan export.
- Mobile Public harus mudah, cepat, notifikasi-ready, dan offline-friendly terbatas.
- Mobile Admin/Koresponden harus sangat sederhana, tombol besar, input LiveScore cepat, geotag, bukti foto, dan offline queue.

## Prinsip Hak Cipta dan Orisinalitas

Techwind Public dan Cuba Admin adalah dua otoritas visual yang dipisahkan tegas. Produk lain tidak boleh dijadikan sumber visual ketiga. Jangan menyalin brand, logo, demo copy, atau identitas pihak ketiga; fidelity template hanya berlaku pada anatomy, layout, spacing, density, responsive behavior, dan interaction pattern yang diadaptasi dengan identitas serta design tokens PORPROV.
