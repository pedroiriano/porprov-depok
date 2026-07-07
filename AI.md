# AI.md — Panduan Masuk Agent AI/Codex untuk Portal PORPROV XV Jawa Barat 2026

> **WAJIB DIBACA PERTAMA.** Agent AI/Codex di VS Code wajib membaca `RULES.md`, `FEATURES.md`, `DOCUMENTATION.md`, dan `AGENTS.md` sebelum menganalisis, menulis, atau mengubah kode.

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
| UI System | Tailwind CSS v4.x, design tokens, mobile-first, accessible components |


## Prinsip UI/UX Wajib

| Sumber Inspirasi | Prinsip yang Diambil | Adaptasi PORPROV |
|---|---|---|
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Fitness Zone | Hero energik, CTA visual, schedule section, gallery, cards promosi, atmosfer event | Landing page PORPROV, countdown, kartu venue, Depok Guide, galeri acara, promosi kota |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |


## Urutan Membaca Wajib

| Urutan | File | Fungsi |
|---|---|---|
| 1 | `AI.md` | Pintu masuk agent |
| 2 | `RULES.md` | Aturan mutlak implementasi |
| 3 | `FEATURES.md` | Tracking fitur, status, dan larangan menimpa fitur final |
| 4 | `DOCUMENTATION.md` | Cara menjalankan, struktur, deployment, dan SOP teknis |
| 5 | `AGENTS.md` | Protokol kerja Codex/VS Code |
| 6 | `docs/reference/` | BRD/PRD/SRS/SDD, ASCII Wireframe, dan dokumen arsitektur enterprise |

## Protokol Bertahap

1. Pahami konteks dan dokumen.
2. Susun rencana tahap saat ini.
3. Konfirmasi kepada pengguna sebelum lanjut.
4. Kerjakan hanya tahap yang disetujui.
5. Tampilkan full code lengkap per file dan path.
6. Jalankan atau jelaskan test yang relevan.
7. Perbarui `FEATURES.md` dan dokumentasi.
8. Laporkan perubahan, risiko, dan langkah berikutnya.

## Aturan Ringkas yang Tidak Boleh Dilanggar

- Setiap tahap harus berhenti dan meminta konfirmasi sebelum lanjut ke tahap berikutnya.
- Setiap output kode wajib berupa full code lengkap dengan nama file dan path.
- Dilarang menulis placeholder seperti `...`, `kode sebelumnya`, `lanjutkan sendiri`, atau potongan parsial bila diminta implementasi file.
- Komentar kode wajib informatif: `// INFO:`, `// CHANGE:`, `// SECURITY:`, `// PERFORMANCE:`, `// SEO:`, `// ACCESSIBILITY:`, `// TEST:`.
- Setiap fitur wajib memperbarui `FEATURES.md`, dan setiap perubahan arsitektural wajib dicatat di dokumentasi/ADR.
- Semua implementasi harus mobile-first, aksesibel, SEO-ready untuk public web, aman, observable, dan testable.
- Jangan menyalin UI/brand Flashscore, ESPN, atau ThemeForest secara identik. Gunakan hanya prinsip pengalaman pengguna, pola informasi, dan heuristik desain.


## Orientasi Produk

- Public Web harus SEO-friendly seperti portal olahraga modern, dengan kombinasi LiveScore padat, sports storytelling, dan landing event yang energik.
- Admin Web harus mendukung dashboard realtime, approval, audit log, data table besar, filter kompleks, dan export.
- Mobile Public harus mudah, cepat, notifikasi-ready, dan offline-friendly terbatas.
- Mobile Admin/Koresponden harus sangat sederhana, tombol besar, input LiveScore cepat, geotag, bukti foto, dan offline queue.

## Prinsip Hak Cipta dan Orisinalitas

Flashscore, ESPN, dan tema Fitness Zone hanya dipakai sebagai benchmark pola UX. Jangan menyalin layout, asset, logo, warna khas, ikon proprietary, copywriting, atau komponen visual secara identik.
