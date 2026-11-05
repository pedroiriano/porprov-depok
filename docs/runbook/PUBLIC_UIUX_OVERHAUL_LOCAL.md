# Penyempurnaan UI/UX Web Publik — lokal 5 November 2026

Scope pekerjaan: Hanya source dan runtime Docker lokal; tanpa migrasi, mutasi data domain, Git commit/push, atau akses VPS. Seluruh perubahan mematuhi panduan bahasa publik (`docs/uiux/PUBLIC_LANGUAGE_STYLE_GUIDE.md`) dan standar kualitas enterprise (`docs/governance/ENGINEERING_UIUX_QUALITY_STANDARD.md`).

---

## FASE 1 — Titik Temu Beranda & Konversi Pengunjung Kritis

### 1. Masalah & Evaluasi
1. **Hero Section Tanpa Konversi Cepat:**
   - Setelah countdown hitung mundur selesai atau saat turnamen berjalan, hero tidak memiliki tombol aksi langsung (CTA) menuju menu utama yang paling dicari pengunjung: Jadwal Pertandingan (`/jadwal`), Hasil Pertandingan (`/livescore`), dan Klasemen Medali (`/medali`).
   - Lebar kolom teks terperangkap di `col-span-8` meskipun countdown selesai, menyisakan area kosong di samping teks.
2. **Asimetri Grid Pusat Informasi (`#informasi`):**
   - Grid memakai kelas kaku `sm:grid-cols-2 lg:grid-cols-4`. Ketika modul tertentu dinonaktifkan oleh pemilik (misalnya Cabor/Medali), hanya 2 kartu aktif yang dirender dan menyisakan 50% lubang kosong di sisi kanan layar desktop.
3. **Bento Card Panduan Kota Mengabaikan Tema Terang:**
   - Kartu "Surga Kuliner" dan "Akomodasi Pilihan" memiliki kelas warna gelap permanen (`bg-slate-900 border-slate-800`), sehingga tampak kusam dan patah visual saat pengguna beralih ke mode terang (light mode).
4. **Integritas Tautan Pengenalan PORPROV (`PorprovIntroduction.tsx`):**
   - Tautan langsung `href="/cabor"` dapat memicu navigasi ke halaman nonaktif (404 / portal-unavailable) jika modul `cabor` dinonaktifkan di konfigurasi Portal.

---

### 2. Implementasi & Solusi
1. **`apps/public-web-nextjs/src/components/HeroSection.tsx`:**
   - Menambahkan dual CTA button yang adaptif dan terlindungi modul portal menggunakan `<PortalLink>`:
     - Tombol Primer: "Lihat Jadwal Pertandingan" (`/jadwal`).
     - Tombol Sekunder: "Hasil Pertandingan" (`/livescore`) dengan fallback "Klasemen Medali" (`/medali`).
   - Menjadikan kolom teks fleksibel: `isCountdownFinished ? "md:col-span-12" : "md:col-span-7 lg:col-span-8"`, sehingga ketika hitung mundur selesai, teks pengumuman hero memanfaatkan lebar penuh secara simetris dan elegan.
2. **`apps/public-web-nextjs/src/app/page.tsx`:**
   - Menggantikan grid kaku `#informasi` dengan `<PublicCardGrid maxColumns={4}>`.
   - Menyeimbangkan tata letak kartu secara dinamis: jika hanya 2 kartu aktif, grid otomatis beralih menjadi 2 kolom terpusat (`grid-cols-1 md:grid-cols-2`) tanpa menyisakan ruang kosong di kanan.
3. **`apps/public-web-nextjs/src/components/CityGuideSection.tsx`:**
   - Mengubah permukaan bento card kuliner dan akomodasi menjadi adaptif tema:
     `bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white`.
4. **`apps/public-web-nextjs/src/components/PorprovIntroduction.tsx`:**
   - Membungkus tautan Cabor dengan `<PortalModule id="cabor">` dan menambahkan `<PortalModule id="venue">` untuk "Lokasi Pertandingan", menjamin integritas navigasi tanpa dead link.

---

### 3. Verifikasi & Quality Gates
- **AST Bahasa Publik:** PASS (70 file source bersih dari istilah teknis terlarang).
- **Unit Test Suites:** PASS (36/36 tests, 0 failures pada `node --test scripts/uiux/test-*.mjs`).
- **TypeScript Compiler:** PASS (`tsc --noEmit` exit code 0).
- **Docker Compose:** Container `porprov_public_web` berhasil di-build ulang dan aktif sehat; Nginx edge berhasil di-reload (`nginx -s reload`).
- **Verifikasi Runtime HTTP (`http://localhost:3000`):**
  - HTTP Status: 200 OK.
  - Dual CTA Jadwal & Hasil/Medali: Aktif dan terbukti ter-render di DOM.
  - Bento Dark-Slate Adaptive: Aktif.
  - PublicCardGrid Dynamic Balancing: `data-card-count="2"` terbukti membagi kolom simetris.
  - Dead Link Guard: Tautan `/cabor` otomatis disembunyikan saat modul tidak aktif.


---

## FASE 2 — Estetika Visual, Transisi Irama Vertikal & Proporsi Berita

### 1. Masalah & Evaluasi
1. **Patahan Warna Kaku pada Latar Belakang Maskot & Venue:**
   - Kelas hardcoded `bg-[#D2EAF1]` pada `MascotSection` dan `VenueShowcase` menciptakan potongan horizontal tajam tanpa gradasi penghubung terhadap section sebelum (`PorprovIntroduction` / `HomeCompetitionPulse`) dan sesudahnya (`Pusat Informasi` / `NewsSection`).
   - Di mode terang, potongan warna cyan pekat terlihat mengambang seperti balok terisolasi.
2. **Peralihan Ekstrem Denyut Pertandingan (`HomeCompetitionPulse`):**
   - Transisi dari section terang ke section gelap `bg-slate-950` membutuhkan batas irama halus agar tidak menimbulkan kontras kasar mendadak saat pengunjung menggulir halaman.
3. **Asimetri dan Distorsi Proporsi Kartu Berita (`NewsCard.tsx`):**
   - Pada mode horizontal desktop (Beranda), `lg:w-52 lg:h-auto` menyebabkan dimensi gambar melar atau menyempit mengikuti panjang teks artikel.
   - Judul berita tidak memiliki pembatas baris (`line-clamp-2`), sehingga judul panjang (3-4 baris) mendesak kartu ke bawah dan menyebabkan ketinggian kartu tidak seragam dalam satu baris grid.
   - Kartu tidak menampilkan lencana kategori/tag berita dan tanggal tidak memiliki ikon penanda visual.

---

### 2. Implementasi & Solusi
1. **`apps/public-web-nextjs/src/components/MascotSection.tsx`:**
   - Mengganti flat cyan `bg-[#D2EAF1]` menjadi gradasi atmosferik lembut:
     `bg-gradient-to-b from-sky-50/70 via-sky-100/50 to-sky-50/70 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950`.
   - Menambahkan *ambient edge feathering* pada batas atas (`h-16 bg-gradient-to-b from-white dark:from-slate-950 to-transparent`) dan bawah (`h-16 bg-gradient-to-t from-white dark:from-slate-950 to-transparent`), menghasilkan alur gulir vertikal yang mulus.
2. **`apps/public-web-nextjs/src/components/HomeCompetitionPulse.tsx`:**
   - Menambahkan sekat garis halus ambient di tepi atas dan bawah:
     `h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent`, membingkai section gelap secara presisi.
3. **`apps/public-web-nextjs/src/components/VenueShowcase.tsx`:**
   - Mengganti flat cyan `bg-[#D2EAF1]` pada mode Beranda menjadi gradasi selaras:
     `bg-gradient-to-b from-sky-50/60 via-sky-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950`.
   - Bagian bawah `to-slate-50` menyatu sempurna tanpa patahan ke `NewsSection` (`bg-slate-50`).
4. **`apps/public-web-nextjs/src/components/NewsCard.tsx`:**
   - Menyeragamkan rasio aspek gambar thumbnail: `aspect-[16/10]` pada grid vertikal dan dimensi mantap `h-52 sm:h-56 lg:h-auto lg:w-64 xl:w-72 aspect-[16/10] lg:aspect-auto` pada mode horizontal.
   - Menambahkan lencana tag kategori utama (`primaryTag`) bergaya *frosted glass* di pojok atas thumbnail.
   - Membatasi judul dengan `line-clamp-2` untuk menjamin keseragaman tinggi baris.
   - Memperkaya tanggal publikasi dengan ikon kalender `<i className="ri-calendar-line text-sm" />`.
   - Mengunci tombol "Baca selengkapnya" di bagian paling bawah kartu menggunakan `mt-auto pt-5` dengan transisi hover responsif.
5. **`apps/public-web-nextjs/src/components/NewsSection.tsx`:**
   - Menambahkan garis batas atas halus `h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-800`.
   - Merapikan tipografi dan kontras header sidebar berita pendukung: `<h3 id="popular-news-title" className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 p-3 text-center text-base font-black text-slate-900 dark:bg-slate-800 dark:text-white"><i className="ri-fire-line text-amber-500" /> Kabar PORPROV lainnya</h3>`.

---

### 3. Verifikasi & Quality Gates
- **AST Bahasa Publik:** PASS (70 file source bersih dari istilah teknis terlarang).
- **Unit Test Suites:** PASS (36/36 tests, 0 failures).
- **TypeScript Compiler:** PASS (`tsc --noEmit` exit code 0).
- **Docker Compose:** Container `porprov_public_web` berhasil di-build ulang dan aktif sehat; Nginx edge berhasil di-reload (`nginx -s reload`).
- **Verifikasi Runtime HTTP:**
  - `http://localhost:3000/` (Beranda): Status 200 OK; gradasi Maskot (`from-sky-50`), gradasi Venue (`from-sky-50/60`), dan garis sekat Pulse terkonfirmasi aktif di DOM.
  - `http://localhost:3000/berita` (Daftar Berita): Status 200 OK; `aspect-[16/10]` dan `line-clamp-2` terkonfirmasi aktif di DOM.


---

## FASE 3 — Feedback Interaktif, Loading Shimmer & Navigasi Ponsel

### 1. Masalah & Evaluasi
1. **Feedback Saat Memuat Data Masih Berupa Teks Polos:**
   - Komponen `ScheduleMatches`, `SchedulePeriods`, `LiveScorePage`, dan `MedalStandings` sebelumnya menampilkan teks mentah `Memuat rincian pertandingan...` atau spinner tunggal saat data sedang diambil (250ms latency), menimbulkan persepsi jeda render yang kaku dan belum mencerminkan visual kontemporer.
2. **Proporsi Dialog Detail Pertandingan di Ponsel:**
   - `ScheduleDialog` membutuhkan batas ketinggian aman viewport vertikal (`max-h-[88dvh]`) serta padding responsif (`p-5 sm:p-6`) agar informasi jadwal tidak terpotong pada layar ponsel pendek.
3. **Navigasi Submenu Ponsel:**
   - Tanda panah dropdown submenu pada mobile menu sebelumnya memakai karakter Unicode mentah `⌄`, yang memiliki rendered glyph bervariasi antarsistem operasi (Android/iOS) dan tidak beranimasi saat dibuka.
4. **Konsistensi Radius Sudut Kartu Cabor:**
   - Kartu pada `CaborDirectory` menggunakan `rounded-xl` sementara seluruh kartu beranda dan Techwind PORPROV telah distandardisasi menjadi `rounded-2xl`, serta judul cabang belum memiliki proteksi `line-clamp-2`.

---

### 2. Implementasi & Solusi
1. **Standardisasi Loading Skeleton Shimmer:**
   - **`ScheduleMatches.tsx`:** Menggantikan teks status dengan skeleton shimmer 3-kartu responsif lengkap dengan placeholder tanggal, nomor tanding, dan tombol detail.
   - **`SchedulePeriods.tsx`:** Menggantikan teks status dengan skeleton shimmer 3-kartu berirama harmonis.
   - **`apps/public-web-nextjs/src/app/livescore/page.tsx`:** Menggantikan teks status dengan 2-baris skeleton shimmer yang presisi meniru kontur `MatchResultList`.
   - **`MedalStandings.tsx`:** Menggantikan spinner tunggal dengan shimmer podium 3 besar serta shimmer tabel baris berpaginasi.
2. **`ScheduleDetails.tsx` (Dialog Detail Pertandingan & Rentang):**
   - Menyesuaikan proporsi modal: `max-h-[88dvh] w-[calc(100%-2rem)] max-w-xl p-5 sm:p-6 rounded-2xl` dengan backdrop blur `backdrop-blur-sm`.
   - Tombol tutup dialog dan tombol aksi "Lihat hasil pertandingan →" menjamin target sentuh minimal 44×44px dan adaptif `w-full sm:w-auto`.
3. **`Navbar.tsx` (Navigasi Ponsel):**
   - Menggantikan karakter mentah `⌄` dengan Remix Icon `<i className="ri-arrow-down-s-line text-lg transition-transform duration-200" />` yang otomatis berputar 180° saat submenu aktif.
   - Memastikan area sentuh tombol dropdown memenuhi standar aksesibilitas minimum 44×44px (`min-h-11 min-w-11`).
4. **`CaborDirectory.tsx`:**
   - Menyeragamkan radius kartu menjadi `rounded-2xl` dan mengunci judul dengan `line-clamp-2`.

---

### 3. Verifikasi & Quality Gates
- **AST Bahasa Publik:** PASS (70 file source bersih dari istilah teknis terlarang).
- **Unit Test Suites:** PASS (36/36 tests lulus, 0 error).
- **TypeScript Compiler:** PASS (`tsc --noEmit` exit code 0).
- **Docker Compose:** Container `porprov_public_web` berhasil di-build ulang dan aktif sehat; Nginx edge berhasil di-reload (`nginx -s reload`).
- **Verifikasi Runtime HTTP:** Seluruh rute publik aktif merespons `HTTP 200 OK`:
  - `http://localhost:3000/` (Beranda): 200 OK
  - `http://localhost:3000/jadwal`: 200 OK (ScheduleDialog padding `sm:p-6` & skeleton aktif)
  - `http://localhost:3000/livescore`: 200 OK (LiveScore skeleton aktif)
  - `http://localhost:3000/berita`: 200 OK
  - `http://localhost:3000/unduhan`: 200 OK
  - `http://localhost:3000/city-guide`: 200 OK
