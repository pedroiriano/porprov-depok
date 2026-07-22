# Portal PORPROV XV Jawa Barat 2026 Kota Depok

Monorepo aplikasi web, mobile, Golang microservices, dan infrastruktur Docker untuk penyelenggaraan PORPROV XV Jawa Barat 2026 di Kota Depok. Repository ini juga memuat enam dokumen root yang menjadi pedoman bersama pengembang dan agent AI.

## Kondisi Aplikasi Saat Ini

- Public Web, Admin Web, API Gateway, seluruh core service, PostgreSQL, Keycloak, Redis, NATS, dan monitoring mempunyai satu runtime Docker Compose terintegrasi.
- CRUD Master Data, pemilihan Media Library, soft delete, dan pemulihan melalui Recycle Bin Admin sudah tersedia end-to-end untuk Cabor, Nomor Pertandingan, Kontingen, City Guide, Media, Venue, dan Jadwal. Hardening RBAC granular serta kebijakan retensi/purge tetap mengikuti `FEATURES.md`.
- Public Web tahap v0.4 sudah memiliki beranda Techwind PORPROV, listing serta detail Cabor/Venue, Jadwal teragregasi, LiveScore persisten dengan public SSE tersanitasi, dan Klasemen Medali yang hanya membaca submission OFFICIAL. Seluruh state loading/empty/error bersifat faktual tanpa data tiruan; peta interaktif, distributed realtime, dan deployment production dilanjutkan berdasarkan `FEATURES.md`.
- Seluruh rute aktif Public dan Admin telah diselaraskan terhadap Techwind `dist`, memakai satu strategi tema berbasis class `.dark`, token semantik terang/gelap, serta quality gate kontras WCAG 2.2 AA yang didokumentasikan di `docs/uiux/TECHWIND_DIST_LIGHT_DARK_AUDIT.md`.
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
| UI System | Techwind 3.3.0 sebagai tema tunggal wajib, Tailwind CSS v4.x hanya sebagai mesin implementasi, design tokens PORPROV, mobile-first, accessible components |


## Tema Tunggal UI/UX PORPROV

| Area | Sumber Tema Wajib | Adaptasi PORPROV |
|---|---|---|
| Public Web | Techwind 3.3.0 `theme-reference/HTML/Landing/dist/`: hero, navigation, event sections, cards, gallery, CTA, footer | Diimplementasikan ulang di Next.js menggunakan identitas, konten, SEO, dan data olahraga PORPROV |
| Admin Web | Techwind 3.3.0 `theme-reference/HTML/Dashboard/dist/`: sidebar, topbar, dashboard, form, table, calendar, gallery | Diimplementasikan ulang di React sebagai workspace operator PORPROV yang cepat, aman, dan role-aware |
| Web/Mobile baru | Pola terdekat dari dua folder `dist` Techwind canonical | Diadaptasi responsif dengan identitas PORPROV; tema/template/design system visual lain dilarang |

Target “masterpiece” adalah adaptasi Techwind yang orisinal, bukan penyalinan template mentah atau pencampuran tema. UI harus konsisten, memiliki seluruh state interaksi, mobile-first, WCAG 2.2 AA, cepat, SEO-ready untuk Public Web, efisien untuk Admin, serta lolos visual/accessibility regression sesuai risiko. Tailwind CSS dan library komponen hanya alat teknis; style bawaannya tidak boleh menggantikan tema Techwind.

Tema runtime wajib memakai class `.dark` sebagai satu-satunya pemicu utility `dark:*`; preferensi warna sistem hanya boleh menentukan nilai awal. Teks normal harus mencapai rasio kontras minimal 4,5:1 dan teks besar/komponen grafis esensial minimal 3:1 pada kedua tema.

## Aturan Data Utama

Semua penghapusan data persisten wajib menggunakan soft delete. Record menyimpan waktu, actor, dan alasan yang relevan; query aktif menyembunyikan data terhapus; restore harus terotorisasi dan diaudit. File Media Library tetap disimpan selama masa retensi. Hard delete hanya diperbolehkan sebagai purge terkontrol, bukan aksi delete biasa.

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

Read-model publik Jadwal tersedia pada `GET /api/v1/schedule/matches/enriched`. Endpoint ini memperkaya match aktif dengan Cabor, Nomor Tanding, Kontingen/peserta, dan Venue pada Schedule Service; browser tetap hanya berkomunikasi melalui API Gateway.

Stream realtime publik berada di `GET /api/v1/stream/events` dan sengaja anonim untuk data tayang, tetapi tidak memuat actor/request/alasan koreksi. Workspace Admin menggunakan `GET /api/v1/stream/admin/events` dengan JWT di API Gateway dan secret internal pada hop service. Keputusan persistence, outbox, workflow, dan audit dicatat di [`docs/adr/ADR-0004-secure-realtime-transactional-outbox-and-verification.md`](docs/adr/ADR-0004-secure-realtime-transactional-outbox-and-verification.md).


## Cara Pakai

1. Baca `AI.md`, lalu `RULES.md`, `FEATURES.md`, `DOCUMENTATION.md`, `AGENTS.md`, dan README ini.
2. Simpan dokumen kebutuhan/desain resmi di `docs/reference/` dan laporkan bila belum tersedia.
3. Gunakan hanya `theme-reference/HTML/Landing/dist/` untuk audit UI Public dan `theme-reference/HTML/Dashboard/dist/` untuk audit Admin.
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

Techwind pada `Landing/dist` dan `Dashboard/dist` adalah satu-satunya tema UI/UX proyek. Produk, template, atau design system lain tidak boleh dijadikan acuan visual maupun interaction language. Dilarang memublikasikan brand, logo, demo copy, atau identitas pihak ketiga sebagai bagian dari PORPROV; gunakan asset resmi dan pastikan pemanfaatan Techwind sesuai lisensi proyek.
