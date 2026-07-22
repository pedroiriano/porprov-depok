# Mapping UI/UX Beranda Public Web terhadap Techwind Landing

Tanggal audit: 22 Juli 2026.

## Referensi

- Baseline canonical: `theme-reference/HTML/Landing/dist/`, terutama pola pada `index-event.html`, `index-gym.html`, dan halaman detail yang relevan.
- Techwind adalah satu-satunya tema UI/UX yang diizinkan; referensi visual, template, atau design system lain tidak boleh dicampurkan.
- Pola yang digunakan: hero event, overlay berlapis, CTA primer/sekunder, about split dua kolom dari `index-charity.html`, profile cards, kartu informasi, venue/gallery cards, dan CTA penutup.
- Sumber konten resmi section kedua dan ketiga: `Booklet PORPROV XV.pdf` halaman PDF 4, 6, dan 7. Aset logo, Toca, serta Toci memakai file resmi yang sudah tersedia di `public/assets/images/`.
- Implementasi runtime: React/Next.js dan Tailwind CSS v4; HTML/Gulp/JavaScript Techwind tidak dimasukkan ke aplikasi.

## Adaptasi PORPROV

| Bagian | Pola Techwind | Adaptasi PORPROV |
|---|---|---|
| Hero | Event hero dengan gambar, overlay, headline, dan CTA | Tinggi 100 viewport, parallax 50%, countdown PORPROV, CTA Jadwal/Venue, reduced-motion fallback |
| Tentang PORPROV XV | About split dua kolom, brand panel, feature cards, dan CTA | Definisi PORPROV, semangat “Bergerak Bersama Menuju Depok Maju”, serta tujuan penjaringan bakat, pembinaan, dan persiapan menuju PON dari booklet halaman 4 |
| Maskot | Profile/team cards dengan visual dominan dan detail nilai | Toca sebagai semangat juang/prestasi serta Toci sebagai sportivitas/keharmonisan dari booklet halaman 6-7; memakai aset resmi, bukan generasi ulang |
| Pusat Informasi | Feature/service cards | Pintasan LiveScore, Jadwal, Medali, dan Cabor dengan identitas status olahraga |
| Venue | Portfolio/gallery cards | Data live dari API Gateway, polling 30 detik, timestamp, skeleton, empty, error/retry, offline, pagination, dan rute |
| CTA Penonton | Full-width event CTA | Panduan venue dan agenda pertandingan dengan aset peta PORPROV |

## Keputusan Interaksi dan Aksesibilitas

- Parallax dijalankan dengan `requestAnimationFrame`, faktor pergerakan `0.5`, dan dihentikan untuk pengguna `prefers-reduced-motion`.
- Venue tidak diklaim event-driven realtime karena Venue Service belum menerbitkan event khusus; data disegarkan saat load, setiap 30 detik, saat tab aktif kembali, dan saat koneksi pulih.
- Informasi kartu Venue selalu terlihat tanpa bergantung pada hover.
- Footer hanya memakai route/anchor yang tersedia; tautan `href="#"` dan ikon tanpa accessible name telah dihapus.
- QA responsif 22 Juli 2026 memverifikasi hero tepat `100dvh` pada viewport mobile 390×844, tanpa horizontal overflow, serta navigasi mobile dapat dibuka dan menuju Jadwal.
- E2E 15 Juli 2026 memverifikasi Public Web `3000` melalui Gateway `28000`: Cabor, Jadwal, Venue, Klasemen, dan LiveScore/SSE merespons dengan state faktual. Jadwal dan Klasemen yang belum berisi record menampilkan empty state, bukan data tiruan.
- Target sentuh utama minimal 44 piksel, fokus keyboard terlihat, heading semantik, status koneksi memakai live region, dan zoom viewport tetap diizinkan.
- URL frontend memakai `NEXT_PUBLIC_API_URL` dan hanya mengakses API Gateway; port Keycloak `8080` tidak dipakai sebagai API.
- Utility `dark:*` Tailwind dikendalikan hanya oleh class `.dark` melalui variant `:is()` yang cukup spesifik untuk mengalahkan utility terang Techwind `dist`; preferensi sistem hanya dipakai untuk menentukan pilihan awal.
- Audit seluruh rute Public/Admin, matriks komponen, dan quality gate kontras tersedia di `docs/uiux/TECHWIND_DIST_LIGHT_DARK_AUDIT.md`.

## Gap Referensi

Tiga dokumen `.docx` yang disebutkan pada `AGENTS.md` belum tersedia di `docs/reference/`. Implementasi ini memakai enam Markdown root dan source Techwind lokal sebagai baseline yang dapat diverifikasi. Mapping harus diaudit ulang bila dokumen resmi tersebut tersedia.
