# Public Techwind Visual Completion v13

## Status

Fase 13.1–13.5 telah selesai dan terverifikasi pada source serta runtime Docker lokal per 8 September 2026. Git delivery belum dilakukan dan tetap memerlukan persetujuan eksplisit terpisah.

## Otoritas dan pemetaan

| Area | Referensi Techwind | Implementasi PORPROV |
|---|---|---|
| Global | `index-business.html`, `index-event.html` | Navbar, menu mobile, tema, breadcrumb, skip-link, footer, kembali ke atas |
| Beranda | `index-business.html`, `index-event.html`, `index-blog.html` | Hero, hitung mundur, ringkasan pertandingan/medali, Venue, Berita dengan panel populer sticky pada desktop, Panduan Kota, CTA |
| Cabor | `portfolio-modern-three.html`, `page-service-detail.html` | Direktori visual, pencarian/filter, detail, nomor pertandingan, jadwal, Venue |
| Venue | `property-listing.html`, `property-detail.html` | Pencarian, filter kesiapan, daftar/peta, detail fasilitas/rute/jadwal/rekomendasi terpin |
| Jadwal dan LiveScore | `index-event.html`, `widget.html` | Agenda terfilter, kartu pertandingan, skor realtime, state koneksi |
| Klasemen | `widget.html` | Podium, tabel medali, status dan pembaruan data |
| Jelajah | `index-travel.html` | Hero, pencarian, kategori dinamis, kartu tempat, peta/rute |
| Berita | `index-blog.html`, `blog-sidebar.html`, `blog-detail.html` | Berita pilihan, daftar dengan sidebar, detail dengan sidebar terkait |

Fidelity berlaku pada anatomi, hierarki, proporsi, ritme section, responsif, dan interaksi. Source HTML/Gulp, aset demo, brand, serta JavaScript vendor tidak menjadi runtime.

## Batas integrasi Berita

Koleksi lokal hanya mendefinisikan feed terkini dan populer. URL bySlug/byTag serta contoh respons tidak tersedia. Adapter karena itu bersifat server-only dan defensif, tidak memindahkan credential dari koleksi Postman, tidak mengarang endpoint, serta mempertahankan empty/error state sampai konfigurasi resmi tersedia. Gambar eksternal tidak memperlebar CSP; aset melewati proxy same-origin dengan allowlist host, pembatasan MIME/ukuran, timeout, dan redirect fail-closed.

## Bukti penutupan Fase 13.5

| Gate | Hasil lokal |
|---|---|
| Visual dan responsif | PASS — 44/44 kombinasi: 11 rute, 390/1440 px, tema terang/gelap; tidak ada overflow horizontal, gambar rusak, atau struktur `main`/`h1` ganda |
| Interaksi dan aksesibilitas dasar | PASS — menu mobile, klik luar/Escape, skip-link, fokus keyboard, label kontrol, alt gambar, dan state tema terverifikasi |
| Public Web | PASS — lint, build Next.js, 11 rute HTTPS, Berita terkini/populer, detail Berita, proxy gambar, sitemap dinamis, JSON-LD ber-nonce, manifest, dan service worker |
| Admin dan Mobile regression | PASS — Admin lint/bahasa/kontrak/build; kedua Mobile lint/typecheck/Expo compatibility/web export setelah patch SDK 57 |
| Backend | PASS — `go test ./...` dan `govulncheck` pada seluruh 10 modul Go |
| Dependency dan supply chain | PASS — audit npm sesuai kebijakan pada empat aplikasi serta CycloneDX SBOM untuk empat aplikasi |
| Secret dan credential | PASS — tracked-secret scan; koleksi Postman dan `.env` lokal diabaikan Git, tanpa nilai credential pada source atau laporan |
| Runtime dan edge | PASS — Public/Nginx running tanpa restart, `nginx -t`, CSP/HSTS/header suite, dan log kritis bersih |
| DevSecOps dinamis | PASS — OWASP ZAP baseline pasif pada HTTPS edge: 0 temuan gagal |
| Image | PASS — Trivy Critical/High fixable: Public 0 dan Nginx 0 setelah hardening Alpine serta runner |

CodeQL dan dependency review adalah gate GitHub yang hanya berjalan setelah commit/PR; keduanya belum dijalankan karena Fase 13.5 secara eksplisit berhenti sebelum Git delivery. Temuan SAST tambahan lama di backend berada di luar diff Public v13 dan dicatat sebagai utang keamanan untuk pekerjaan terpisah, tanpa ditutupi sebagai temuan Fase 13.5.
