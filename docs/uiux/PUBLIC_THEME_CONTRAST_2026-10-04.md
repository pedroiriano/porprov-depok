# Audit kontras Public — 4 Oktober 2026

## Baseline dan batas perubahan

- Workspace: `C:\Datas\Proyek\Aplikasi\porprov-depok`; branch `main`, HEAD `3e409b20e9a3dbc8d325481c2ec19d42c5509bba`.
- Working tree bersih sebelum pengerjaan. Kandidat belum di-commit, di-push, atau di-deploy.
- Production diperiksa dengan SSH host key ketat dan browser read-only: checkout bersih pada HEAD yang sama, 19 kontainer berjalan, health check yang tersedia sehat.
- Hanya presentasi Public dan regression test yang berubah. Tidak ada perubahan API, auth, CSP, credential, database, konten, upload, atau konfigurasi production.

## Akar masalah dan perbaikan

CSS Techwind yang dimuat sesudah stylesheet aplikasi menetapkan navbar transparan dan warna tautan dengan `!important`. Dalam tema terang, navbar halaman dalam berada di atas Hero gelap tetapi teks tetap gelap. Perbaikan tidak mengubah CSS referensi vendor:

1. Navbar memiliki pasangan warna/surface sendiri; halaman dalam, halaman error, serta kondisi sticky memakai surface solid. Beranda memakai overlay gelap dengan opacity terikat.
2. Override `!important` dibatasi pada warna tautan navbar untuk mengalahkan deklarasi vendor. Penanda aktif tetap memakai underline dan `aria-current`, bukan warna saja.
3. `resolvedTheme`, state React sticky, sinkronisasi restored scroll, dan passive listener menjaga tema serta scroll tanpa manipulasi class DOM ganda.
4. Placeholder memakai token muted AA dengan opacity penuh; batas input dipertegas tanpa menghapus focus indicator.
5. Pasangan warna Maskot, Panduan Kota, status koneksi LiveScore/Klasemen/Venue, ringkasan Venue, serta label detail Venue diperbaiki. Hover dark pada filter/tautan detail memiliki pasangan eksplisit.
6. Overlay Hero diuji terhadap gambar putih sebagai kasus paling terang. Gambar editorial tetap berasal dari kontrak Hero/Media Library existing.

## Bukti dan hasil verifikasi

Audit awal memakai desktop aktual **1280×720**. Pada penutupan gate 4 Oktober, browser berhasil menerapkan **390×844** dan **1440×900**, dibuktikan dengan `innerWidth`/`innerHeight`, screenshot, serta pemeriksaan overflow. Pengujian tambahan memakai komponen bersama dan halaman representatif, bukan mengulang seluruh kombinasi.

| Cakupan | Hasil | Batas bukti |
|---|---|---|
| Beranda, Cabor, Venue, Jadwal, LiveScore, Klasemen, Panduan Kota, Berita | PASS pada desktop aktual light/dark untuk permukaan terukur setelah perbaikan | Berita lokal kembali terisi setelah revalidasi cache; 68 artikel bertag tersedia saat penutupan. |
| Detail Cabor dan Venue | PASS setelah targeted retest | Gambar/overlay memerlukan inspeksi visual, bukan hanya hitungan DOM. |
| Detail Berita production | PASS light/dark pada source baseline | Belum membuktikan deployment kandidat baru. |
| Navbar sebelum/sesudah scroll, tema, halaman aktif | PASS pada desktop aktual | Navbar production sebelum scroll masih memakai source lama. |
| Hero/gambar/gradient | Pemeriksaan visual dan batas kontras pada test | Evaluator DOM tidak mengkomposit gambar/overlay sibling; elemen tersebut dipisahkan sebagai pemeriksaan manual. |
| 390px/1440px, menu seluler | PASS | Viewport aktual sesuai; menu terang/gelap, Escape, Beranda, Cabor, detail Venue, dan kartu berita diperiksa secara representatif tanpa overflow. |
| Halaman Admin terautentikasi | BLOCKED_AUTH_SESSION | Browser sampai pada form SSO; tidak mengubah akun, memasukkan credential, atau menyatakan halaman Admin lulus. Source Admin tidak berubah. |
| Build + TypeScript Public, ESLint, regression test, diff check, secret scan | PASS | Gate terarah; broad CI belum dijalankan karena belum ada Git delivery. |
| Nginx lokal dan header HTTPS production | PASS | TLS normal; CSP lengkap/tunggal, HSTS tunggal, dan header sensitif existing tetap lulus script canonical. |

Uji: `node --test scripts/uiux/test-public-theme.mjs`; lint/build dari `apps/public-web-nextjs`. Runtime Public dibangun melalui launcher canonical `infra/docker/compose-up.ps1 -NoDeps public-web`, kemudian Nginx lokal divalidasi dan di-reload. Tidak ada migrasi.

Hasil final: 9/9 regression test PASS; 22 pengukuran desktop terakhir (delapan halaman utama, detail Cabor/Venue, dan 404, masing-masing light/dark) tanpa temuan pada permukaan terukur dan tanpa overflow. Pencarian Cabor tanpa hasil juga lulus pada dark lalu filternya dikosongkan kembali. Console pada targeted retest tidak memuat error/warning. Image runtime Public lokal: `sha256:d0592180420a7f073ec706a533b47e9635bf7b757adc0281777611cfed5ad6ce`; ini image kandidat working tree, bukan release commit baru. Seluruh 19 layanan lokal tetap berjalan dengan health check yang tersedia sehat.

Bukti lokal di `.tmp/ui-theme-20261004/` tidak dilacak Git. Screenshot sebelum production dan sesudah lokal menunjukkan perubahan navbar; JSON audit hanya memuat teks publik, class, warna, serta hasil kontras.

## Gap integrasi yang tidak ditutupi

Pada audit awal sumber eksternal sempat menghasilkan HTML dan halaman lokal menunjukkan keadaan kosong. Penutupan melalui script diagnostik server-only membuktikan GET tanpa query, `?page=1`, serta `?page=2` masing-masing `200 application/json` dengan lima judul valid. Setelah revalidasi cache 300 detik dan reload browser, halaman lokal menampilkan 68 artikel bertag. Tidak ada perubahan API, konfigurasi, credential, atau pemotongan filter PORPROV. Gambar kartu yang masuk viewport dimuat; gambar di luar viewport tetap memakai lazy loading.

Audit Admin terautentikasi tetap belum dibuktikan karena sesi tidak tersedia. Ini batas audit lintas aplikasi, bukan klaim bahwa Admin lulus atau perubahan source Admin; release yang diotorisasi hanya Public Web dan reload Nginx.

Tiga DOCX canonical yang diwajibkan di `docs/reference/` tetap tidak tersedia; dokumen governance Markdown menjadi baseline, bukan isi referensi yang dikarang.

## Exact kandidat

- `apps/public-web-nextjs/src/app/globals.css`
- `apps/public-web-nextjs/src/app/cabor/[id]/page.tsx`
- `apps/public-web-nextjs/src/app/city-guide/page.tsx`
- `apps/public-web-nextjs/src/app/livescore/page.tsx`
- `apps/public-web-nextjs/src/app/venue/[id]/page.tsx`
- `apps/public-web-nextjs/src/components/CaborDirectory.tsx`
- `apps/public-web-nextjs/src/components/CityGuideSection.tsx`
- `apps/public-web-nextjs/src/components/HeroSection.tsx`
- `apps/public-web-nextjs/src/components/MascotSection.tsx`
- `apps/public-web-nextjs/src/components/MedalStandings.tsx`
- `apps/public-web-nextjs/src/components/Navbar.tsx`
- `apps/public-web-nextjs/src/components/VenueShowcase.tsx`
- `scripts/uiux/test-public-theme.mjs`
- `docs/uiux/PUBLIC_THEME_CONTRAST_2026-10-04.md`
- `docs/uiux/TECHWIND_DIST_LIGHT_DARK_AUDIT.md`
- `FEATURES.md`

## Gate production berikutnya

Status scope Public lokal: **PASS / CI_AND_PRODUCTION_PENDING**. Pengguna telah mengotorisasi commit, push, PR, merge setelah gate PASS, lalu deployment hanya Public Web dan reload Nginx. Deployment memakai commit remote tervalidasi, backup/checksum, rollback, serta job server-side `flock` sesuai `DEPLOYMENT_VPS.md`; tidak boleh menyertakan database/migrasi/credential atau layanan lain. Bukti CI, SHA merge, image release, dan verifikasi production dicatat pada handoff deployment, bukan dikarang sebelum eksekusi.
