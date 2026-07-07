# Portal PORPROV XV Jawa Barat 2026 — Codex Agent Guidelines Enterprise UI/UX v3

Paket ini berisi file pedoman agent AI/Codex untuk VS Code setelah penyesuaian stack enterprise dan penyempurnaan UI/UX berbasis benchmark Flashscore, ESPN, Fitness Zone, serta Tailwind CSS v4.x.

## File

| File | Fungsi |
|---|---|
| `AI.md` | Pintu masuk agent |
| `AGENTS.md` | Protokol Codex/VS Code |
| `RULES.md` | Aturan mutlak implementasi |
| `FEATURES.md` | Tracking fitur dan status |
| `DOCUMENTATION.md` | Dokumentasi teknis dan operasional |

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
| UI System | Tailwind CSS v4.x, design tokens, mobile-first, accessible components |


## UI/UX Synthesis

| Sumber Inspirasi | Prinsip yang Diambil | Adaptasi PORPROV |
|---|---|---|
| Flashscore | Kepadatan LiveScore, filter cabor/tanggal, match card, standings, detail match, status realtime | LiveScore per cabor, venue, kontingen, ronde, status official, timeline event, standings medali |
| ESPN | Sports media storytelling, highlights, news cards, video/editorial hub, coverage berbasis narasi olahraga | Berita PORPROV, highlight atlet, galeri, press release, profil venue, cerita maskot Toca-Toci |
| Fitness Zone | Hero energik, CTA visual, schedule section, gallery, cards promosi, atmosfer event | Landing page PORPROV, countdown, kartu venue, Depok Guide, galeri acara, promosi kota |
| Tailwind CSS v4.x | Utility-first, CSS-first token, responsive utilities, scrollbar/logical utilities modern | Design system PORPROV dengan token warna, spacing, status badges, skeleton loading, dark mode opsional |


## Cara Pakai

1. Salin semua file MD ke root repository `porprov-xv/`.
2. Simpan dokumen referensi di `docs/reference/`.
3. Jalankan Codex/agent di VS Code.
4. Instruksikan agent untuk membaca `AI.md` terlebih dahulu.
5. Pastikan agent selalu meminta konfirmasi sebelum lanjut tahap berikutnya.

## Catatan Orisinalitas

Benchmark UI/UX hanya dipakai untuk prinsip desain dan pola pengalaman pengguna. Dilarang menyalin visual, brand, logo, ikon proprietary, layout spesifik, atau copywriting pihak ketiga secara identik.
