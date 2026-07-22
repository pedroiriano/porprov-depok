# Audit UI/UX Techwind Dist — Public dan Admin PORPROV

Tanggal baseline: 22 Juli 2026.

## Tujuan dan Sumber Tunggal

Audit ini menetapkan Techwind sebagai tema tunggal wajib dengan hanya dua sumber visual canonical:

- Public Web: `theme-reference/HTML/Landing/dist/`.
- Admin Web: `theme-reference/HTML/Dashboard/dist/`.

Folder `src/`, source Gulp, demo JavaScript, brand, logo, dan copy Techwind tidak menjadi runtime atau identitas PORPROV. Aplikasi memakai salinan CSS `dist` yang checksum-nya identik, kemudian mengimplementasikan ulang pola visual sebagai React/Next.js, Tailwind CSS v4, token PORPROV, dan konten Indonesia.

Tema, template, design system visual, layout, tipografi, komponen bergaya, atau interaction language dari sumber lain dilarang. Tailwind CSS v4 dan library komponen hanya boleh menyelesaikan kebutuhan teknis; seluruh style akhirnya wajib mengikuti Techwind dan token PORPROV.

## Temuan Akar Masalah

Tailwind CSS v4 aplikasi sebelumnya memakai pemicu `dark:*` berdasarkan preferensi warna sistem, sedangkan CSS Techwind `dist` dan tombol tema memakai class `.dark`. Pada OS gelap, root dapat berstatus `light` tetapi utility `dark:*` tetap aktif. Kondisi hybrid ini menghasilkan kartu gelap dengan teks gelap, form tidak terbaca, dan warna halaman berbeda dari tombol tema.

Audit runtime juga menemukan dua masalah cascade Public Web: file `Landing/dist` mendeklarasikan ulang token primary setelah bundle Next.js, dan variant berbasis `:where()` tidak mempunyai specificity untuk mengalahkan utility terang yang dimuat belakangan. Token PORPROV kini dikunci sebagai adaptasi di root, `--color-primary` mempunyai nilai AA berbeda per tema, dan variant class memakai `:is()` agar pasangan `dark:*` tetap menang tanpa mengubah file `dist` canonical.

Koreksi canonical pada kedua frontend:

```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark, .dark *));
```

Class `html.light` atau `html.dark` kini menjadi satu-satunya sumber state tema. Token surface, teks, border, placeholder, form, alert, badge, focus ring, reduced motion, dan safety net komponen legacy mengikuti state tersebut. Admin mobile memodelkan state sidebar secara eksplisit per breakpoint; off-canvas tertutup diberi `aria-hidden` dan `inert`, sedangkan tombol, backdrop, dan penutupan setelah navigasi mengikuti state visual yang sama.

## Mapping Public Web

| Route | Referensi Techwind `Landing/dist` | Adaptasi PORPROV yang Diaudit |
|---|---|---|
| `/` | `index-event.html`, `index-gym.html`, `page-aboutus.html` | Navbar, hero 100dvh/parallax, countdown, host/maskot, feature cards, venue live, CTA, footer |
| `/cabor` | `index-gym.html`, `portfolio-detail-one.html` | Grid cabang olahraga, icon/media, empty/error state, tautan detail |
| `/cabor/[id]` | `portfolio-detail-one.html`, `blog-detail.html` | Hero detail, nomor pertandingan, jadwal, venue terkait, metadata resmi |
| `/venue` | `index-event.html`, `portfolio-detail-one.html` | Status koneksi, filter, venue cards, pagination, kapasitas, cabor, rute |
| `/venue/[id]` | `portfolio-detail-one.html`, `page-aboutus.html` | Hero detail, fasilitas, koordinat/rute, jadwal, cabor, City Guide sekitar |
| `/jadwal` | `index-gym.html`, `index-event.html` | Filter bar, grouped schedule, match card, loading/empty/error |
| `/livescore` | `index-event.html`, `index-gym.html` | Connection state, score cards, metadata pertandingan, integritas data |
| `/medali` | `index-event.html`, `ui-components.html` | Standings table, filter/search, status resmi, loading/empty/error |

## Mapping Admin Web

| Route/Area | Referensi Techwind `Dashboard/dist` | Adaptasi PORPROV yang Diaudit |
|---|---|---|
| Shell semua route | `index.html` | Sidebar role-aware, topbar, theme switch, notifikasi, profil, responsive overlay |
| `/` | `index.html` | Header operasional, KPI cards, tabel pertandingan, log sistem |
| `/master-data` | `index.html`, `ui-components.html` | Tab aksesibel, tabel/form/modal, selector media, Recycle Bin |
| `/livescore` | `index.html`, `calendar.html` | Form scoring, badge koneksi, revision history, event stream |
| `/medals`, `/verifikasi` | `index.html`, `ui-components.html` | Workflow submission, verification badge, tabel official, modal |
| `/city-guide` | `index.html`, `gallery-one.html` | Table/list, media picker, create/delete state |
| `/media` | `gallery-one.html` | Gallery grid, image preview, upload, empty/error/success |
| `/audit-log` | `index.html`, `ui-components.html` | Filter bar, dense table, integrity detail, export |
| `/user-management` | `index.html`, `profile.html` | Search, role table, form akun, destructive confirmation |
| `/profile` | `profile.html` | Identitas, email, role, SSO status, logout |

## Standar Kontras dan Tema

| Elemen | Light | Dark | Batas minimum |
|---|---|---|---|
| Teks utama | slate-900 pada white/slate-50 | slate-50/100 pada slate-800/900 | 4,5:1 normal; 3:1 teks besar |
| Teks sekunder | slate-700/600 | slate-300 | 4,5:1 |
| Teks muted | slate-500 | slate-400 | 4,5:1 untuk informasi bermakna |
| Aksen Public | PORPROV blue `primary-500` AA | sky-300 pada surface gelap | 4,5:1 |
| Aksen Admin | indigo-600 | indigo-400 | 4,5:1 |
| Border form | slate-300 | slate-600/700 | 3:1 terhadap surface saat menunjukkan batas kontrol |
| Focus | ring primary/indigo 2 px, offset 3 px | sama | selalu terlihat dengan keyboard |

Badge status memakai pasangan background dan teks per tema; tidak boleh sekadar mengubah teks tanpa mengganti surface. Hero bergambar wajib memiliki overlay yang menjaga teks putih terbaca pada seluruh bagian gambar.

## Cakupan QA

- Public: 8 route termasuk detail Cabor dan Venue.
- Admin: 10 route, seluruh tab Master Data, modal, tabel, dropdown, empty/error/success state yang dapat dipicu dari data aktif.
- Viewport: desktop dan mobile 390×844.
- Tema: `light` dan `dark`, termasuk OS yang memilih dark saat aplikasi memilih light.
- Hasil kontras DOM: Admin 10/10 route terang dan gelap tanpa temuan; Public 8/8 route gelap tanpa temuan dan seluruh surface non-gambar pada tema terang tanpa temuan. Hero serta badge di atas gambar diverifikasi visual karena evaluator DOM tidak dapat mengkomposit background image/overlay transparan.
- Mobile: Hero Public tepat 844 px pada viewport 390×844, tidak ada overflow, menu Public berfungsi; sidebar Admin tertutup/inert secara default, terbuka satu klik, menutup setelah navigasi, dan tidak menimbulkan overflow.
- Quality gate: Public ESLint + Next production build; Admin Oxlint + TypeScript + Vite production build.
- Runtime: Docker Compose canonical pada Public `3000` dan Admin `5173`.

## Aturan untuk Perubahan Berikutnya

1. Pilih pola dari file HTML yang relevan dalam folder `dist` canonical dan catat mapping bila route baru dibuat.
2. Gunakan class `.dark` sebagai satu-satunya state tema; dilarang menambah media-query theme kedua.
3. Setiap warna teks bermakna harus memiliki rasio terukur, bukan hanya terlihat baik pada monitor pengembang.
4. Setiap komponen baru wajib diuji pada light/dark, desktop/mobile, keyboard, loading, empty, error, dan success.
5. Jangan menyalin brand/demo copy Techwind dan jangan memasukkan Gulp/demo JavaScript ke runtime.
6. Jangan memakai tema/template/design system visual lain, termasuk sebagai inspirasi sebagian; jika pola belum tersedia, komposisikan pola Techwind terdekat dan dokumentasikan mapping-nya.

## Gap Dokumen Referensi

Tiga path DOCX yang diwajibkan `AGENTS.md` belum tersedia di `docs/reference/`. Enam DOCX ditemukan di `design/`: tiga sumber lengkap dan tiga `Final_*` yang hanya berupa ringkasan singkat. Audit ini memakai dokumen sumber lengkap sebagai konteks tambahan, tetapi enam Markdown root dan source Techwind `dist` tetap menjadi baseline yang dapat diverifikasi sampai dokumen canonical dipindahkan ke `docs/reference/`.
