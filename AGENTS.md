# AGENTS.md — Protokol Codex Agent Portal PORPROV Enterprise UI/UX v4

Dokumen ini mengatur perilaku agent AI/Codex di VS Code saat mengembangkan Portal PORPROV XV Jawa Barat 2026.

> **Konteks aktif per 16 Juli 2026:** repository `porprov-depok` adalah aplikasi PORPROV XV Jawa Barat 2026 untuk Kota Depok. Runtime full-stack canonical memakai Docker Compose dan mencakup Public/Admin Web v0.4, API Gateway, Master Data, Venue, Schedule, LiveScore, Medal Standing, Audit, Realtime Gateway, PostgreSQL, Keycloak beserta bootstrap role/client, Redis, NATS, Nginx, dan observability. Namespace `28xxx` hanya untuk debugging satu komponen, bukan full-stack kedua. Data publik membaca detail Cabor/Venue, Jadwal enriched, projection LiveScore persisten, public SSE tersanitasi, serta Medali OFFICIAL tanpa data tiruan. Soft delete/Recycling domain inti tetap aktif; MFA, outbox domain lama, RBAC menyeluruh, scale-out, dan production hardening dilanjutkan bertahap.

## Mode Kerja Utama

Agent wajib bekerja sebagai **enterprise pair programmer** yang membaca dokumen dahulu, membuat rencana singkat, meminta konfirmasi sebelum lanjut tahap, menulis full code lengkap, menjaga keamanan, performa, SEO, aksesibilitas, realtime reliability, dan memperbarui dokumentasi.

## Dokumen yang Wajib Dibaca

1. `AI.md`
2. `RULES.md`
3. `FEATURES.md`
4. `DOCUMENTATION.md`
5. `README.md`
6. `AGENTS.md`
7. `docs/reference/Portal_PORPROV_XV_Jawa_Barat_2026_Analisis_Desain.docx`
8. `docs/reference/Portal_PORPROV_XV_Jawa_Barat_2026_ASCII_Wireframe.docx`
9. `docs/reference/Dokumen Perencanaan Arsitektur Enterprise Web & Mobile.docx`

Jika dokumen referensi belum tersedia, agent wajib melaporkan gap tersebut, tidak boleh mengarang isinya, dan tetap memakai enam Markdown root sebagai baseline yang dapat diverifikasi.

## Stack Wajib

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


## Baseline UI/UX yang Harus Dipakai

| Sumber Inspirasi | Prinsip yang Diambil | Adaptasi PORPROV |
|---|---|---|
| `theme-reference/HTML/Landing/` | Baseline Techwind untuk Public Web: navigation, hero, section rhythm, cards, editorial, event, gallery, CTA, footer | Diubah menjadi pengalaman PORPROV yang orisinal, energik, SEO-ready, realtime, dan beridentitas Kota Depok |
| `theme-reference/HTML/Dashboard/` | Baseline Techwind untuk Admin Web: sidebar, topbar, dashboard, forms, tables, profile, calendar, gallery, responsive shell | Diubah menjadi workspace operator olahraga yang padat, cepat, role-aware, audit-friendly, dan aksesibel |
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |

### Standar “Masterpiece” PORPROV

- Techwind adalah baseline komposisi dan interaksi, bukan hasil akhir yang disalin mentah.
- Implementasi wajib menggunakan komponen React/Next.js dan token PORPROV; source Gulp/HTML tema tidak menjadi runtime aplikasi.
- Setiap layar wajib mempunyai hierarki visual yang jelas, state loading/empty/error/success, responsif mobile-first, navigasi keyboard, focus state, kontras WCAG 2.2 AA, dan motion yang menghormati `prefers-reduced-motion`.
- Public Web harus terasa energik dan editorial tanpa mengorbankan kepadatan LiveScore, SEO, atau Core Web Vitals.
- Stream publik hanya boleh memuat projection tayang tersanitasi; stream operasional Admin wajib melewati JWT/role API Gateway dan secret internal yang aman di luar development.
- Perubahan LiveScore/Medali yang kritis wajib memakai transaksi state + outbox. Koreksi skor append-only dan publikasi Medali hanya dari status VERIFIED, dengan actor tiap tahap dipertahankan.
- Data lintas domain yang dibutuhkan satu layar publik wajib disediakan melalui backend read-model dan API Gateway; browser tidak boleh mengorkestrasi port service atau bergantung pada UUID mentah untuk presentasi.
- Admin Web harus mengutamakan kecepatan kerja, keterbacaan tabel/form, status sistem, konfirmasi aksi, dan konsistensi lintas modul.
- Asset, logo, copywriting, dan identitas Techwind tidak boleh dipublikasikan sebagai brand PORPROV. Pastikan penggunaan tema mematuhi lisensi yang dimiliki proyek.

## Aturan Data: Soft Delete Wajib

- Semua operasi hapus atas data persisten/domain wajib menggunakan soft delete, termasuk Master Data, Media Library, Venue, Jadwal, user, berita, galeri, dan data operasional lain.
- Model minimal memiliki `deleted_at`, `deleted_by`, dan bila relevan `delete_reason`; query normal wajib memfilter `deleted_at IS NULL`.
- API `DELETE` hanya menandai data terhapus dan menulis audit trail. Sediakan restore yang terotorisasi; hard delete/purge hanya melalui kebijakan retensi, role khusus, audit, dan persetujuan eksplisit.
- File Media Library tidak boleh langsung dihapus dari storage ketika metadata di-soft-delete. Penghapusan fisik hanya dilakukan proses purge terkontrol setelah masa retensi.
- Dilarang memakai cascade hard delete lintas domain. Publikasikan event delete/restore bila perubahan perlu diketahui service lain.
- Implementasi lama yang masih hard delete wajib dicatat sebagai technical debt di `FEATURES.md` dan dimigrasikan sebelum fitur dinyatakan final.

## Sinkronisasi Enam Dokumen Root

Setiap perubahan aturan, stack, arsitektur, standar UI/UX, keamanan, data, quality gate, atau status produk wajib memperbarui file root yang relevan pada tahap yang sama: `README.md`, `AI.md`, `AGENTS.md`, `RULES.md`, `FEATURES.md`, dan `DOCUMENTATION.md`. `RULES.md` adalah sumber normatif; lima file lain tidak boleh bertentangan dengannya.

## Namespace Port Wajib

- Production hanya mengekspos Nginx `80/443`; browser tidak boleh mengakses port diagnostik service.
- Public development canonical memakai Public Web `3000`, Admin `5173`, API Gateway `8000`, dan Keycloak `8080` melalui Docker Compose.
- Diagnostik Docker host memakai Master `18081`, Schedule `18082`, dan Venue `18087`.
- Local `go run` memakai namespace `28xxx` hanya untuk debugging komponen terisolasi: Gateway `28000`, User `28001`, Master `28081`, Schedule `28082`, LiveScore `28083`, Audit `28084`, Realtime `28085`, Medal `28086`, dan Venue `28087`. Container domain yang sama wajib dihentikan lebih dahulu.
- `infra/docker/compose-up.ps1` adalah launcher full-stack tunggal. Dilarang menghidupkan kembali script yang mencampur service Docker dan `go run` atau frontend pada port alternatif.
- Storage runtime Media Library wajib memakai named volume `master_data_uploads`; file lokal legacy hanya backup dan bukan sumber runtime.
- Infrastruktur host memakai port configurable dari `infra/docker/.env`: PostgreSQL `15432`, Redis `16379`, NATS `14222/18222`, Prometheus `19090`, dan Grafana `13000`.
- Port internal Docker tetap stabil dan komunikasi antarkontainer wajib memakai DNS nama service. Semua host port harus configurable melalui environment, bukan hardcoded untuk hosting.


## Tahapan Kerja Wajib

| Tahap | Fokus | Harus Konfirmasi |
|---|---|---|
| 1 | Foundation repo + tooling | Ya |
| 2 | Infra Docker/Nginx/SSL/Keycloak/Postgres/Redis/NATS | Ya |
| 3 | Golang API Gateway dan core services | Ya |
| 4 | Public Web Next.js PWA + Tailwind v4.x | Ya |
| 5 | Admin Web React Dashboard | Ya |
| 6 | Mobile Public React Native | Ya |
| 7 | Mobile Admin/Koresponden React Native | Ya |
| 8 | LiveScore event-driven realtime | Ya |
| 9 | Security, testing, observability | Ya |
| 10 | Deployment VM Diskominfo + runbook | Ya |

## Format Jawaban Agent Saat Menulis Kode

```md
## Tahap: [nama tahap]

### Ringkasan Perubahan
[penjelasan singkat]

### File yang Dibuat/Diubah
| Path | Aksi | Catatan |
|---|---|---|

### Full Code

#### `path/to/file.ext`
```language
[full code lengkap]
```

### Perintah Menjalankan
```bash
[command]
```

### Pengujian
```bash
[command test]
```

### Risiko dan Catatan
[risiko]

### Konfirmasi
Konfirmasi: lanjut ke Tahap berikutnya?
```

## Larangan Mutlak

- Setiap tahap harus berhenti dan meminta konfirmasi sebelum lanjut ke tahap berikutnya.
- Setiap output kode wajib berupa full code lengkap dengan nama file dan path.
- Dilarang menulis placeholder seperti `...`, `kode sebelumnya`, `lanjutkan sendiri`, atau potongan parsial bila diminta implementasi file.
- Komentar kode wajib informatif: `// INFO:`, `// CHANGE:`, `// SECURITY:`, `// PERFORMANCE:`, `// SEO:`, `// ACCESSIBILITY:`, `// TEST:`.
- Setiap fitur wajib memperbarui `FEATURES.md`, dan setiap perubahan arsitektural wajib dicatat di dokumentasi/ADR.
- Setiap perubahan aturan/standar wajib menyinkronkan enam Markdown root yang relevan.
- Semua delete data persisten wajib soft delete; hard delete hanya purge terkontrol.
- Jangan menambah port host baru di luar registry tanpa memperbarui enam dokumen root dan `.env.example`.
- Semua implementasi harus mobile-first, aksesibel, SEO-ready untuk public web, aman, observable, dan testable.
- Jangan menyalin UI/brand Techwind, Flashscore, atau ESPN secara identik. Gunakan Techwind sebagai baseline berlisensi dan adaptasikan menjadi design system PORPROV yang orisinal.


## Perilaku Saat Ada Konflik

- Jika permintaan bertentangan dengan dokumen arsitektur, jelaskan konflik dan minta keputusan.
- Jika fitur final akan tersentuh, berhenti dan minta izin eksplisit.
- Jika data belum tersedia, tulis `[TBD — perlu keputusan: ...]`.
- Jika path/file belum jelas, usulkan struktur dan minta konfirmasi.

## Definisi Selesai

Fitur dianggap selesai jika code compile/build, test relevan lulus, lint/type check lulus, aksesibilitas dasar dicek, SEO tidak rusak untuk public web, delete persisten memakai soft delete beserta audit/restore, tidak ada secret, enam dokumentasi root terkait telah sinkron, serta siap diuji di staging VM Diskominfo.
