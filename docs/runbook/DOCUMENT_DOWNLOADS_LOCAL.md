# Unduhan Publik dan Sematan Dokumen — Lokal

Tanggal: 2 November 2026. Keputusan: ADR-0024. Melanjutkan ADR-0023 tanpa mengubah default policy unggah.

## Penggunaan

1. Admin → **Pengelolaan Dokumen**. Dokumen baru/existing awalnya **Privat**.
2. Super Admin memilih **Tayangkan** (ikon mata), memeriksa daftar target dan mengisi alasan. Konfirmasi menyatakan dokumen akan dapat diunduh siapa pun. Batal tayang memakai **Jadikan privat**.
3. Setelah tayang, pilih **Sematkan** (ikon pin), isi alasan, dan simpan. Satu sematan menggantikan sematan sebelumnya secara atomik. Melepas sematan tidak membatalkan publikasi.
4. Navbar Web Publik → **Unduhan**, atau `http://localhost:3000/unduhan`, menampilkan hanya dokumen tayang aktif. Cari judul/nama berkas, urutkan judul/tanggal/ukuran, pilih jumlah baris, pindah halaman, pilih satu/beberapa baris.
5. **Unduh pilihan (ZIP)** tersedia maksimal 10 berkas dengan total 100 MiB. Pemilihan seluruh halaman mengambil maksimal 10 baris pertama dan diberi label batas yang jelas; pilihan dibersihkan ketika halaman/filter/sort berubah. Tidak ada hapus/mutasi di Public.
6. Beranda → bagian pengantar di bawah Hero menampilkan tombol **Unduh {judul}** di samping **Lihat Jadwal** bila ada dokumen tersemat dan Unduhan aktif. Tidak ada hardcoded file/URL.
7. Pengelolaan Portal memiliki **Unduhan Publik** tersendiri; nonaktifkan modul/halaman atau menu sesuai kebutuhan. Modul Admin Dokumen terpisah agar tidak menghilangkan akses pemulihan dan pengelolaan dokumen privat.

## API dan keamanan

Anonim: `GET /api/v1/documents/public`, `/public/pinned`, `/public/{id}/download`, `/public/bundle?ids=...`.
Super Admin dengan izin terbaru `document.update`: `PUT /api/v1/documents/{id}/publication`, `/{id}/pin`, body `expected_version`, `enabled`, `reason` 5–500 karakter. Otorisasi service per aksi, semua mutasi berversi dan transactional outbox.

Master **17→18** additive; User tetap v6. Berkas dan data domain existing tidak dihapus. Restore arsip menjadikan dokumen privat. Riwayat metadata tidak mengubah status tayang. Dokumen yang tidak lagi tayang tidak dapat diunduh dengan URL lama atau ZIP.

Backup dump/checksum baru: `.tmp/document-downloads-20261102/backup-20261102T051404Z`. Bukti pengujian dan source manifest berada dalam folder tahap yang sama. Backup lama dan seluruh resource proyek lain dipertahankan.

## Status verifikasi

**Aktif lokal — functional/source gate PASS; visual acceptance belum dapat dijalankan.**

- Master `18|f`, User tetap `6|f`. Default kebijakan PDF 50 MiB tidak berubah. Seluruh dokumen existing tetap privat dan tidak ada sematan otomatis.
- Build/typecheck Public/Admin Linux PASS; lint Admin dan lint final empat file Public PASS tanpa warning. Regresi Go router/registry, TypeScript registry, PostgreSQL TEMP publikasi/privasi/pin/ZIP serta batas 10 berkas/100 MiB PASS. Uji constraint membuktikan dua sematan ditolak database. Tidak ada dependency baru.
- Sembilan layanan pembaca registry/Web diaktifkan melalui launcher canonical dengan `-NoBuild -NoDeps -ForceRecreate`; 19 container PORPROV berjalan dan semua health check yang tersedia sehat. Nginx config dan reload PASS.
- HTTP runtime: Navbar berisi Unduhan, `/unduhan` dan sitemap tersedia, public list kosong sesuai status privat, pin null, ID tak tersedia 404, bulk ID tidak valid 422, policy privat tetap 403. Tidak ada dokumen, status publikasi atau pin yang dimutasi pada runtime untuk pengujian.
- **19 fingerprint tabel lama identik**, dengan membandingkan JSON dokumen tanpa dua kolom baru yang bernilai false. Mount volume sama, staging Git existing identik. Modul bisnis pemilik tidak diaktifkan ulang dan konfigurasi Portal tidak disimpan/dipublikasikan otomatis.
- UI/visual browser: **BLOCKED_BROWSER_DISABLED_IN_WORK_SETTINGS**. Tool browser mengembalikan “Local browser use is disabled in Work settings”. Tidak dilakukan bypass melalui browser/native automation lain; jangan mengklaim acceptance visual, authenticated browser publish/download atau responsif light/dark tahap ini PASS. Source memakai primitive dan token canonical, tetapi itu tidak menggantikan pemeriksaan tampilan nyata.
- Tidak ada Git delivery, akses VPS, perubahan production, penghapusan source, volume, dokumen, atau backup. Full DevSecOps/CI tidak dijalankan pada slice lokal.

Bukti tersanitasi: `runtime-result.json`, `router-portal.log`, `postgres.log`, `public-boundaries-final.log`, `public-final-lint.log`, `build.log`, serta `source-final.json` pada folder tahap. Tabel/ZIP terisi diuji melalui fixture PostgreSQL TEMP dengan rollback; runtime Public tetap menampilkan keadaan kosong sampai pengelola menayangkan dokumen.

### Catatan pemulihan Docker lokal

Docker kehilangan descriptor sebagian image lama meskipun container masih berjalan, sehingga tag/commit image lama ditolak `content digest ... not found`. Sebelum recreate, filesystem container stateless diekspor menjadi `runtime-rootfs-*.tar` (volume data tidak termasuk), diimpor dengan tag khusus `porprov-downloads-rollback-20261102:*`, lalu diuji executable dalam container terisolasi tanpa network/volume. Snapshot menggunakan ENTRYPOINT/CMD/USER/WORKDIR asli dan environment runtime dari Compose; credential environment tidak dibawa ke image impor. Ini **snapshot pemulihan filesystem, bukan digest image lama yang identik**. Tidak ada snapshot rollback yang diaktifkan. Checksum arsip dan ketersediaan sembilan image PASS; `rollback-tags.json` mencatat batas klaim secara eksplisit.

## Rollback

Simpan image aktif sebelum rebuild memakai tag rollback khusus dan daftar checksum backup. Recreate hanya image layanan terkait dari snapshot dengan `--no-deps`, kemudian reload Nginx dan smoke. Tabel/kolom Master v18 tetap disimpan. Jangan menghapus dokumen atau memulihkan dump di atas perubahan baru tanpa keputusan pemulihan tersendiri. Tidak ada commit/push/merge, CI/deployment atau akses VPS dalam tahap ini.
