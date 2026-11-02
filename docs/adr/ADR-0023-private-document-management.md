# ADR-0023 — Pengelolaan Dokumen Privat dan Kebijakan Unggah Dinamis

Tanggal: 2 November 2026. Scope: source dan Docker lokal, dengan persetujuan migrasi additive setelah backup. Git delivery dan VPS tidak termasuk.

## Keputusan

- Dokumen merupakan modul Admin `documents`, terpisah dari gambar Pustaka Media. Tidak ada halaman, menu, atau URL dokumen anonim. Penonaktifan melalui Pengelolaan Portal mempertahankan data.
- Master v17 menambah `document_policy`, `documents`, revisi immutable, dan transactional outbox. User v6 menambah izin `document.view/create/update/archive/restore/policy`, awalnya hanya pada peran Super Admin existing. Pengaturan kebijakan juga memerlukan realm role `super_admin` aktif.
- Default hanya PDF dengan ukuran maksimum 52.428.800 byte (50 MiB). Pengaturan memilih satu atau lebih MIME dari katalog validator PDF, UTF-8 TXT/CSV, JPEG, PNG, WebP. Batas dapat diubah 1–100 MiB. MIME arbitrary, HTML, SVG, executable, dan arsip tidak dapat diaktifkan melalui JSON/UI. Menambah keluarga format baru memerlukan validator dan review source.
- Ukuran dan MIME efektif berasal dari API policy; server memeriksa MIME, ekstensi, signature/trailer PDF atau signature gambar, serta isi UTF-8 penuh untuk teks. Upload streaming tidak memuat seluruh berkas ke RAM. Pemeriksaan ini bukan antivirus atau bukti bebas malware; PDF diunduh sebagai attachment, tidak dirender inline pada origin aplikasi.
- Berkas acak `.bin` disimpan pada subdirektori privat `uploads/documents` di named volume existing. URL `/uploads/{file}` gambar tidak melayani subdirektori dokumen. Endpoint unduh memeriksa izin dan status aktif, dengan attachment, nosniff, sandbox dan no-store. Nama/path dari klien tidak menentukan lokasi storage.
- Policy dan metadata memakai versi optimistis. Perubahan policy selama unggah menghasilkan `409`, tanpa menerima unggahan memakai aturan lama. Perubahan batas/MIME hanya memengaruhi unggahan baru; dokumen existing tetap dapat diunduh sesuai izin.
- Arsip/restore mempertahankan berkas. Riwayat metadata/policy append-only; pemulihan menciptakan versi baru. Berkas existing tidak diganti di tempat. Mengunggah versi berkas lain berarti menambah dokumen baru.
- Mutasi state, revision dan outbox satu transaksi; worker mengirim audit dengan deduplikasi NATS. Gateway memeriksa izin terbaru dan mengganti header spoofed dengan HMAC internal per aksi; service menolak proof kosong/salah atau actor tidak lengkap.
- Modal, tabel, pagination server-side, draft dan feedback menggunakan komponen Cuba bersama. Draf hanya menyimpan judul/keterangan/alasan, bukan isi berkas/token. Pengguna memilih ulang file setelah membuka ulang halaman.

## Kompatibilitas dan rollback

Adapter menambahkan modul privat pada konfigurasi lama tanpa mengubah JSON/versi publikasi tersimpan. Klien dan revisi lama yang tidak memuat modul baru mempertahankan pilihan modul pada draf existing. Registry dibaca tujuh layanan Go; seluruh image pembaca harus diperbarui bersama sebelum acceptance. Pilihan modul bisnis existing tidak dipublikasikan otomatis.

Rollback aplikasi memakai image ID sebelum aktivasi dan reload Nginx; tabel additive tetap dipertahankan. Jangan menjalankan migrasi down, menghapus named volume, atau menimpa database berisi perubahan baru. Restore dump hanya untuk pemulihan terencana dan diotorisasi.

## Ancaman dan verifikasi

Risiko utama: MIME spoofing, path traversal, berkas aktif, disk/memory exhaustion, bypass ACL melalui header, akses arsip, race policy, lost update, dan hilangnya audit saat broker gagal. Mitigasi: allowlist validator, storage privat acak, bounded streaming, limit khusus endpoint, deadline terbatas, proof per aksi, otorisasi berlapis, optimistic locking, soft delete dan outbox. Kuota total storage dan pemindaian antivirus terpusat belum disediakan oleh slice ini.

Bukti serta batas acceptance dicatat dalam `docs/runbook/DOCUMENT_MANAGEMENT_LOCAL.md` dan folder `.tmp/document-management-20261102`. Tiga dokumen referensi DOCX yang diwajibkan governance belum ditemukan; implementasi mengikuti Markdown root dan kontrak UI/security canonical.
