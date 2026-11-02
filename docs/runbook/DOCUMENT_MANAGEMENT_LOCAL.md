# Pengelolaan Dokumen — Lokal

Tanggal: 2 November 2026. ADR: [ADR-0023](../adr/ADR-0023-private-document-management.md).

## Penggunaan

1. Masuk sebagai Super Admin aktif ke `http://localhost:5173/admin/documents`.
2. **Unggah dokumen**: isi judul/keterangan, pilih atau seret satu PDF, lalu simpan. Default maksimum **50 MiB** (52.428.800 byte).
3. **Pengaturan unggah**: pilih jenis berkas yang diperbolehkan dan ukuran maksimal 1–100 MiB, isi alasan, lalu simpan. Batas gambar Pustaka Media tidak berubah.
4. Daftar mendukung pencarian, pengurutan, jumlah baris, pagination server-side dan pilihan baris halaman aktif. Arsip massal memerlukan konfirmasi daftar target/alasan dan melaporkan kegagalan parsial.
5. Dokumen aktif dapat diunduh sesuai izin. Arsip menyembunyikan unduhan tetapi mempertahankan berkas. **Tampilkan arsip** menyediakan pemulihan.
6. **Riwayat** menampilkan aktor, versi, waktu, alasan dan keterangan. Gunakan versi lama sebagai perubahan baru; tidak ada overwrite histori. Riwayat pengaturan dapat dipakai kembali melalui versi policy terkini.
7. Pengelolaan Portal → Modul mengontrol ketersediaan Admin. Modul Dokumen bersifat privat; pilihan Web Publik dan pengelolaan eksternal tidak tersedia. Izin tetap berlaku walaupun modul aktif.

MIME yang dapat dipilih: `application/pdf`, `text/plain`, `text/csv`, `image/jpeg`, `image/png`, `image/webp`. Katalog aman tidak menerima MIME arbitrary. TXT/CSV harus UTF-8. Pemeriksaan signature bukan antivirus; hindari dokumen dari sumber tak tepercaya dan gunakan scanner perangkat saat membuka unduhan.

## Kontrak dan aktivasi

API melalui Gateway: `/api/v1/documents`, `/policy`, `/policy/history`, `/{id}`, `/{id}/download`, `/{id}/history`, `/{id}/restore`, `/{id}/restore-revision`. Kontrak lengkap: `openapi/openapi.yaml`.

Master **16 → 17** dan User **5 → 6** hanya additive, diotorisasi pengguna setelah backup lokal. Backup dump, checksum, image ID, working-tree/index patch dan fingerprint tabel lama berada di `.tmp/document-management-20261102/backup-20261102T034803Z`. Dump telah diperiksa dengan `pg_restore --list` dan SHA-256.

Rebuild pembaca registry: Master Data, Gateway, Schedule, LiveScore, Medal Standing, Venue, Realtime, serta Admin. Aktivasi memakai launcher canonical `infra/docker/compose-up.ps1` dengan `-NoBuild -NoDeps -ForceRecreate` setelah build dan migrasi; tidak menjalankan bootstrap/migrasi domain lain. Uji `nginx -t` sebelum reload Nginx.

Nginx tetap membatasi endpoint umum pada 12 MiB. Hanya lokasi exact `/api/v1/documents` mendapat envelope 101 MiB; handler menegakkan ukuran policy dan overhead multipart 64 KiB. Deadline transfer khusus terautentikasi 120–130 detik; timeout umum/SSE tetap.

## Bukti uji dan batas klaim

- PASS: validasi MIME/ekstensi/signature, penolakan format berbahaya, teks biner, proof service palsu/salah aksi.
- PASS: PostgreSQL TEMP dengan rollback untuk policy default/dinamis, unggah, pencarian literal SQL-looking, unduh privat, konflik versi, arsip/restore, pemulihan riwayat, immutable trigger dan audit outbox.
- PASS: ukuran tepat 50 MiB diterima; 50 MiB + 1 byte ditolak; berkas sementara yang ditolak dibersihkan. Fixture berada dalam direktori temporer test, bukan storage runtime.
- PASS: Gateway menolak anonim, izin dicabut, dan non-Super-Admin untuk kebijakan; proof berasal dari aksi yang benar, modul nonaktif ditolak.
- PASS: build/typecheck Admin final (image Linux), lint, pemeriksaan bahasa dan kontrak OpenAPI, regresi registry Go/TypeScript, diff check dan secret scan dasar. Full DevSecOps/CI tidak dijalankan.
- Tidak ada dependency baru, Git delivery, akses/deployment VPS, atau perubahan data production. Full DevSecOps tidak dijalankan untuk slice lokal ini.

## Hasil aktivasi

**PASS — aktif pada Docker lokal**, 2 November 2026.

- Master `17|f`, User `6|f`; default policy versi 1, hanya `application/pdf`, 52.428.800 byte. Enam permission awal hanya diberikan kepada peran Super Admin existing. Tidak ada dokumen fixture pada tabel/storage runtime.
- Delapan image aplikasi terkait dibangun dan diaktifkan melalui launcher canonical; image migrator juga diperbarui agar startup berikutnya mengenali skema baru. Semua 19 layanan berjalan, seluruh health check yang tersedia sehat. Tidak ada restart baru pada scope; satu restart historis Umami mendahului backup.
- Nginx config/reload PASS. Pengguna runtime memiliki akses tulis ke parent storage; subdirektori dokumen menghasilkan `404` melalui route unggahan publik. Delapan smoke HTTP PASS sesuai konfigurasi pemilik: modul yang sengaja dimatikan tetap ditolak, tanpa aktivasi ulang/publikasi otomatis.
- Empat belas tabel lama identik. Satu tabel draf memiliki perubahan yang dijelaskan: retensi existing User Service membersihkan **satu draf yang sudah kedaluwarsa**, dibuktikan terhadap metadata/payload dump di memori; semua draf lainnya identik. Draf visual pemeriksaan dibuang melalui aplikasi. Tabel bisnis tidak diubah.
- Browser Super Admin: daftar dan policy berhasil dimuat; PDF saja dan batas 50 MiB terkonfirmasi; form menerima ketikan berurutan tanpa kehilangan fokus; draf terdeteksi tersimpan, penutupan kotor dikonfirmasi dan draf uji dibuang. Tidak dilakukan unggah/simpan dokumen bisnis atau perubahan policy melalui browser.
- Visual representatif **1440px dark** dan **390px light** PASS, tanpa overflow halaman. Temuan pencarian terlalu sempit pada mobile diperbaiki dan diverifikasi ulang. Modal policy dapat digulir dengan footer tetap terjangkau; console error kosong.
- Integrasi Pengelolaan Portal terkonfirmasi: Dokumen tersedia sebagai modul Admin, pilihan publik disabled, pilihan tautan eksternal tidak disediakan. Klien/revisi lama tidak mengaktifkan kembali pilihan nonaktif (regresi PostgreSQL PASS). Konfigurasi Portal tidak disimpan/dipublikasikan saat smoke.
- Staging existing identik terhadap snapshot sebelum aktivasi; HEAD tetap `3d66af9e08f994d837818a5016b8bd759d541232`. Tidak ada commit/push/merge atau akses VPS. Perubahan VA yang sudah ada dipertahankan.

Exact 33 file source/hash, image ID dan bukti tersanitasi: `.tmp/document-management-20261102/source-manifest.json`, `health-and-images.json`, `runtime-checks.json`, `draft-retention-receipt.json`. Screenshot: `admin-upload-1440-dark.png`, `admin-documents-390-light.png`, `admin-policy-390-light.png`. Backup/checksum dan image rollback tersedia: tujuh image Go cocok dengan digest runtime sebelum aktivasi dan dipulihkan dari arsip lokal melalui tag khusus; image Admin lama tidak lagi tersedia sehingga Admin baseline dibangun dari HEAD pra-fitur `3d66af9`, diuji Nginx/aset, dan diarsipkan. Admin rollback ini **bukan digest image lama yang identik**. Tidak ada image rollback yang diaktifkan. Bukti tambahan: `rollback-go-receipt.json`, `admin-rollback-receipt.json` dan `rollback-and-integrity.json`. Pengujian lifecycle menggunakan handler dan PostgreSQL TEMP; visual nyata memeriksa read/modal/draf, bukan mengklaim unggah bisnis end-to-end atau QA multi-pengguna penuh.

## Rollback

Pertahankan backup dan tujuh image Go lama dalam `containers-before.json`; gunakan image Admin baseline yang tercatat dalam `admin-rollback-receipt.json` karena image Admin lama tidak ditemukan. Tag rollback terpisah `porprov-document-rollback-20261102:*` tidak menggantikan tag/runtime aktif. Paket OCI lengkap bernama `rollback-go-images-verified.oci.tar`; artefak `rollback-go-images.oci.tar` dari percobaan awal tidak lengkap dan tidak boleh dipakai. Keduanya dipertahankan, tanpa penghapusan backup. Recreate hanya layanan terdampak menggunakan image ID sebelum aktivasi, dengan Compose root/project yang sama, `--no-deps --no-build`, lalu reload Nginx dan smoke Public/Admin. Jangan menghapus tabel additive, berkas dokumen, volume, atau menimpa data domain. Full restore database memerlukan keputusan pemulihan terpisah bila ada data baru setelah backup.


## Koreksi batas Gateway — 2 November 2026

Laporan nyata unggah PDF 28,71 MiB gagal ditemukan pada log sebagai `http: request body too large`, Master 413 dan Gateway 502. Penyebabnya middleware global `RequestSize(12 MiB)` membungkus body sebelum pembungkus rute Dokumen 100 MiB; pembungkus kedua tidak dapat menaikkan batas pertama. Pengujian handler/PostgreSQL sebelumnya tidak mencakup jalur HTTP penuh Gateway; batas klaim tersebut telah dicatat di atas.

Perbaikan memilih batas **sekali di middleware awal**, khusus `POST /api/v1/documents` 100 MiB + overhead 64 KiB; semua endpoint lain tetap 12 MiB. Policy Master tetap PDF 50 MiB dan tidak diubah. Content-Length berlebih ditolak sebelum proxy; kelebihan streaming/chunked diterjemahkan menjadi 413 JSON generik/no-store, bukan 502. CORS, request ID, logger dan metrik tetap berlaku pada penolakan awal.

Regresi HTTP transport penuh tanpa database membuktikan RED unggah 29 MiB pada source lama, lalu PASS 29/50 MiB; endpoint lain tetap menolak 13 MiB; hard limit dan chunked ditolak 413, JSON valid, CORS tetap tersedia. Suite router terdampak PASS. Bukti dan source sebelum perubahan: `.tmp/document-upload-fix-20261102`. Aktivasi hanya Gateway lokal dan reload Nginx, tanpa database/Git/VPS. Image sebelum hotfix dipertahankan dengan tag `porprov-document-upload-rollback-20261102:gateway-before`.


Penutupan hotfix lokal: **PASS**. Gateway image `sha256:2a3bf13281843c448a646ae3ecb837a4fe2bb8412a78cfee28977f75945bc86e` aktif, Nginx config/reload PASS; health Gateway, Public dan Admin HTTP 200; policy tanpa autentikasi tetap 403. Smoke runtime hard-limit memberikan 413 JSON dengan CORS, bukan 502. Rollback Gateway `sha256:f1ae6d46f3f6b1cf1637b83c1c5c308f31e7ca02ce4dc9c030d153bee7aad2e9` tetap tersedia. Tidak ada migrasi atau perubahan database pada hotfix ini, dan tidak ada Git delivery/VPS. Berkas pengguna 28,71 MiB belum diunggah ulang oleh agent; pengujian 29/50 MiB menggunakan HTTP fixture terisolasi tanpa menyimpan dokumen. Pengguna dapat mencoba kembali melalui form existing.
