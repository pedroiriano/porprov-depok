# Pengelolaan Portal — kontrak dan operasional lokal

Rujukan arsitektur: [ADR-0020](../adr/ADR-0020-portal-management-publication-capabilities.md).

## Penggunaan

Masuk sebagai Super Admin pada `http://localhost:5173/admin/portal-management`. Pilih **Ubah konfigurasi**, atur Modul, Halaman dan Bagian, atau Menu dan Urutan. Simpan draf, periksa pratinjau struktur, lalu **Publikasikan** dengan alasan. Pratinjau struktur bukan preview pixel-perfect seluruh template. Setiap perubahan menyimpan versi dan identitas aktor.

Untuk kewenangan Provinsi, pilih nonaktif atau tautan resmi bagi Cabor, Kontingen, Atlet, LiveScore dan Medali sesuai keputusan pemilik. Ini tidak memindahkan atau menghapus data existing. Kapabilitas Atlet mengendalikan penyuntingan susunan peserta Jadwal; data peserta existing tetap tersimpan. Modul Venue/Jadwal dapat mempertahankan referensi read-only tanpa menghidupkan kembali modul editorial yang dinonaktifkan.

Riwayat menyediakan pagination 20 catatan, pembandingan dua snapshot, serta pemulihan sebagai draf baru. Konflik `409` mempertahankan form; simpan salinan pekerjaan melalui draf, muat versi terbaru dan rekonsiliasi secara sadar. Jangan mengatasi konflik dengan menaikkan versi secara otomatis. Draf halaman tidak masuk projection Public. Halaman tidak diperlukan diarsipkan, bukan dihapus fisik.

## Kontrak HTTP

### Fitur dan bagian Jadwal

Pada tab **Fitur**, atur Rentang Jadwal Cabor dan Rincian Pertandingan secara terpisah untuk Public/Admin. Flag fitur tunduk pada modul Jadwal; menu Data Utama, dashboard, dan arsip menyesuaikan akses tanpa menghapus data. Pada **Halaman dan Bagian → Jadwal**, atur urutan, tampil/sembunyi, serta varian kedua bagian. Gunakan anchor `/jadwal#rentang-jadwal` atau `/jadwal#rincian-pertandingan` sebagai target menu. Simpan draf lalu publikasikan secara eksplisit dengan alasan untuk menerapkan pilihan.

Konfigurasi lama diadaptasi saat dibaca: slot konten sebelumnya mempertahankan status tampil/varian, urutan dan versi. Tidak ada migrasi skema atau publikasi otomatis; snapshot histori tetap immutable. Klien lama tanpa field fitur mempertahankan pilihan fitur draf terkunci saat menyimpan. Lihat ADR-0022 untuk kontrak dan rollback. Bukti aktivasi lokal berada pada `.tmp/schedule-portal-controls-20261027/HASIL.md`.

Referensi pertandingan LiveScore adalah GET-only `/portal/references/livescore-matches` (JWT, `livescore.view`, modul LiveScore Admin) dan `/livescore/schedule-projection` (modul LiveScore Public). Referensi tidak memberi hak menyunting Jadwal dan tetap dibatasi saat LiveScore dinonaktifkan.

Semua rute berikut melalui `/api/v1`, response `no-store`.

| Rute | Akses/perilaku |
|---|---|
| `GET /portal/public` | Projection tayang anonim; tanpa secret atau draf |
| `GET /portal/manage` | Super Admin aktif + izin terbaru; draf, publikasi, versi |
| `PUT /portal/manage` | `{expected_version, document, reason}`; validasi registry dan Media Library |
| `POST /portal/publish` | `{expected_version, reason}`; publikasi draf tersimpan |
| `POST /portal/restore` | `{expected_version, revision_id, reason}`; buat draf pemulihan |
| `GET /portal/history?page=N` | Riwayat terbatas 20/halaman |
| `GET /portal/history/{id}` | Snapshot immutable terotorisasi |
| `GET /portal/references/venue-cabors` | Baca Cabor bagi izin `venue.view` |
| `GET /portal/references/cabors`, `/nomor-tandings`, `/kontingens` | Baca referensi bagi izin `master_data.view` |

Sukses mutasi `200`; tidak terautentikasi `401`, tidak berwenang/modul nonaktif `403`, versi konflik `409`, konfigurasi tidak valid `422`, dependency gagal `503`. Gateway tidak meneruskan header otorisasi internal yang dipasok browser. Proxy Public menggunakan `404` bagi halaman nonaktif/draf dan halaman rujukan resmi bagi mode eksternal. Link publik tersembunyi sesuai publikasi.

## Aktivasi lokal dan pemulihan

Backup dump Master Data berada pada `.tmp/portal-management-20261024/backup/master_data_db.dump`, SHA256 `89D6F009A054547984183CEFCAE4C05F52BBC02906FF2FE9A12BDE5DA7F55ABA`. Listing restore dan checksum tervalidasi; ini bukan klaim drill restore penuh. Snapshot image/row count dan log gate disimpan di direktori yang sama/parent, diabaikan Git.

Migrasi additive lokal v15→v16 menghasilkan `portal_configuration`, `portal_revisions`, `portal_outbox`. Jumlah row tabel domain sebelum/sesudah identik. Baseline belum disimpan sebagai publikasi perubahan dan seluruh modul existing tetap aktif sampai pemilik mempublikasikan pilihan.

Launcher full-stack tetap `infra/docker/compose-up.ps1`; hanya layanan terdampak di-recreate, volume sama dan Nginx harus diuji/dimuat ulang setelah pergantian upstream. Jangan memakai Compose down, penghapusan volume, atau migrasi turun. Tag rollback lokal berawalan `porprov-local-rollback:portal-20261024-` dan daftar exact image disimpan dalam snapshot lokal.

Uji lifecycle memakai tabel PostgreSQL TEMP dan transaksi luar yang di-rollback: draf, konflik, publikasi, projection privat, riwayat immutable, pemulihan, dan outbox. Tidak ada fixture domain permanen. Verifikasi source/build/runtime dibedakan dari penerimaan visual terautentikasi; hasil aktual dicatat pada laporan lokal, tanpa mengklaim production berubah.

Peringatan collation PostgreSQL existing berada di luar perubahan ini. Exception dependency bertanggal kedaluwarsa tidak diperpanjang; full DevSecOps/Git delivery/deployment tidak dijalankan pada pekerjaan lokal ini.
