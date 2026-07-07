# AGENTS.md — Protokol Codex Agent VS Code Portal PORPROV Enterprise UI/UX v3

Dokumen ini mengatur perilaku agent AI/Codex di VS Code saat mengembangkan Portal PORPROV XV Jawa Barat 2026.

## Mode Kerja Utama

Agent wajib bekerja sebagai **enterprise pair programmer** yang membaca dokumen dahulu, membuat rencana singkat, meminta konfirmasi sebelum lanjut tahap, menulis full code lengkap, menjaga keamanan, performa, SEO, aksesibilitas, realtime reliability, dan memperbarui dokumentasi.

## Dokumen yang Wajib Dibaca

1. `AI.md`
2. `RULES.md`
3. `FEATURES.md`
4. `DOCUMENTATION.md`
5. `docs/reference/Portal_PORPROV_XV_Jawa_Barat_2026_Analisis_Desain.docx`
6. `docs/reference/Portal_PORPROV_XV_Jawa_Barat_2026_ASCII_Wireframe.docx`
7. `docs/reference/Dokumen Perencanaan Arsitektur Enterprise Web & Mobile.docx`

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
| UI System | Tailwind CSS v4.x, design tokens, mobile-first, accessible components |


## UX Benchmark yang Harus Dipakai

| Sumber Inspirasi | Prinsip yang Diambil | Adaptasi PORPROV |
|---|---|---|
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Fitness Zone | Hero energik, CTA visual, schedule section, gallery, cards promosi, atmosfer event | Landing page PORPROV, countdown, kartu venue, Depok Guide, galeri acara, promosi kota |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |


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
- Semua implementasi harus mobile-first, aksesibel, SEO-ready untuk public web, aman, observable, dan testable.
- Jangan menyalin UI/brand Flashscore, ESPN, atau ThemeForest secara identik. Gunakan hanya prinsip pengalaman pengguna, pola informasi, dan heuristik desain.


## Perilaku Saat Ada Konflik

- Jika permintaan bertentangan dengan dokumen arsitektur, jelaskan konflik dan minta keputusan.
- Jika fitur final akan tersentuh, berhenti dan minta izin eksplisit.
- Jika data belum tersedia, tulis `[TBD — perlu keputusan: ...]`.
- Jika path/file belum jelas, usulkan struktur dan minta konfirmasi.

## Definisi Selesai

Fitur dianggap selesai jika code compile/build, test relevan lulus, lint/type check lulus, aksesibilitas dasar dicek, SEO tidak rusak untuk public web, tidak ada secret, dokumentasi dan `FEATURES.md` diperbarui, serta siap diuji di staging VM Diskominfo.
