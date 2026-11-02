# Penutupan teks internal Web Publik — lokal 2 November 2026

## Cakupan

Teks pengunjung ditinjau pada 66 file source Public: Beranda, Jadwal, Cabor/detail, Venue/detail, Skor Langsung, Medali, Panduan Kota, Berita/detail, Unduhan, footer, navigasi, halaman tidak tersedia, pesan gagal dan metadata. Pedoman: `docs/uiux/PUBLIC_LANGUAGE_STYLE_GUIDE.md`. Tidak menyalin source/aset tema vendor.

Perubahan utama:

- Menghapus paparan API Gateway/Master Data Service, SSE/JetStream, nomor event skor, polling/fallback dan status pengembangan/infrastruktur. Diagnostik internal, identifier, route, event dan kontrak API dipertahankan.
- Memendekkan petunjuk Jadwal, pagination, pesan kosong/gagal dan informasi dokumen. Copy tidak menjelaskan workflow publikasi Admin kepada pengunjung.
- Mengganti teks Skor langsung/Panduan kota, status koneksi yang relevan dan status pertandingan melalui pemetaan Bahasa Indonesia existing. Pesan gagal Public tidak menambahkan `cause.message` atau error transport mentah.
- Mempertahankan waktu pembaruan, keterbatasan unduhan/pagination, skor belum tersedia, serta penanda **DUMMY LOKAL — bukan jadwal resmi**. Tidak mengubah isi berita/dokumen, referensi Cabor, Hero tersimpan, kategori dinamis atau data domain sebagai koreksi editorial massal.

## Bukti

Snapshot `.tmp/public-copy-20261102/` menyimpan source sebelum edit beserta SHA256, index Git sebelum edit, daftar penggantian exact (`changes.json`), konfigurasi publik baca-saja, log build, hasil HTTP/browser, screenshot, dan hasil final ber-checksum (`result.json`). Tidak dilacak Git.

- PASS pemeriksaan AST seluruh 66 file untuk istilah internal yang diketahui. Pemindai mencakup JSX, atribut aksesibilitas, metadata/label dan error sink; komentar, import, route, CSS, identifier serta diagnostik internal tidak diperlakukan sebagai teks pengunjung.
- PASS 9 regresi terkait: dua regresi bahasa (positive/negative context) dan tujuh presentasi Jadwal. TypeScript, lint file aplikasi terdampak, diff dan secret check scoped PASS.
- PASS build Public Linux lokal melalui launcher canonical, diikuti `nginx -t` dan reload. Hanya Public lokal di-recreate; 19 layanan berjalan dan available health checks healthy. Image final `sha256:de9b82dc22168b12f273b27f21eeb36981feb5e59150270a08d41a52165ca14d`.
- PASS HTTP/SSR pada `/`, `/jadwal`, `/venue`, `/city-guide`, `/berita`, `/unduhan`. Browser representative Jadwal/detail, Venue, Panduan Kota dan Unduhan mengonfirmasi copy baru, batas unduhan, serta penanda dummy. Ini bukan pengulangan full responsive acceptance/DevSecOps atau seluruh kombinasi error upstream.
- Konfigurasi publik lokal versi 6: hash sebelum/sesudah identik; tidak ada istilah internal yang diketahui pada field editorial projection. Modul yang dinonaktifkan pemilik tidak diaktifkan untuk QA. Bahasa Cabor/Skor/Medali yang tidak aktif diperiksa melalui source, bukan diklaim telah diuji visual terautentikasi.
- Data tetap: 12 rentang dummy/12 revisi CREATE; hash pertandingan/peserta identik dengan baseline sebelum fixture. Tidak ada migrasi, perubahan data, publikasi Portal, Git delivery atau akses VPS.

## Batas dan rollback

Pemeriksaan kata terlarang bukan bukti seluruh bahasa/konten dinamis sempurna. Konten editorial, artikel, nama kategori dan berkas dari Admin/sumber berita tetap memerlukan review editorial masing-masing. Warnings dummy dipertahankan agar tidak dianggap sebagai informasi resmi.

Rollback dengan membandingkan lalu memulihkan hanya file slice dari `before/`, rebuild Public melalui `infra/docker/compose-up.ps1 -NoDeps public-web`, validasi/reload Nginx lokal. Tidak memerlukan restore database atau perubahan dependency. Jangan menimpa pekerjaan pengguna yang dibuat setelah snapshot. Tidak ada perubahan CSP, CORS, TLS, RBAC, credential, upload validator, atau pengurangan kontrol keamanan.
