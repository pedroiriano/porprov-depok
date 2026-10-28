# ADR-0021 — Rentang pelaksanaan per cabang olahraga

Tanggal: 27 Oktober 2026. Status: implementasi lokal; tidak mengotorisasi production atau Git delivery.

## Keputusan

Schedule Service memiliki entitas `SchedulePeriod`, terpisah dari pertandingan dan susunan peserta. Satu cabang dapat memiliki beberapa rentang, dengan nama khusus opsional seperti Sepakbola Putri. Referensi `cabor_id` divalidasi ke Master Data saat create/update/pemulihan; nama cabor disimpan sebagai snapshot yang diperbarui pada mutasi rentang. Tidak ada foreign key lintas database.

Tanggal bertipe SQL DATE, format API `YYYY-MM-DD`, inklusif pada kedua ujung dan tervalidasi tahun 2000–2100. Batas hari untuk indikator Public memakai Asia/Jakarta. Tanggal selesai harus sama atau setelah tanggal mulai. Data baru berstatus draf, penayangan merupakan keputusan eksplisit pengelola. Rentang tidak membuat/mengubah pertandingan, nomor pertandingan, venue atau peserta. Data contoh pada permintaan tidak dijadikan seed resmi.

Migrasi Schedule `000006` hanya menambah `schedule_periods`, `schedule_period_revisions`, dan `schedule_period_outbox`. Index unik parsial mencegah duplikat aktif untuk cabor/nama khusus/tanggal yang sama; rentang kategori berbeda boleh tumpang tindih. Tidak ada down migration destruktif. Data lama, named volume, dan versi database service lain dipertahankan.

## Keamanan dan konsistensi

Admin memakai permission `master_data.view/create/update/archive/restore` existing. Gateway memeriksa JWT/izin terbaru serta menyuntikkan proof HMAC dengan purpose khusus `porprov:schedule-periods:v1` dan identitas aktor. Header dari browser dibuang; service menolak pengelolaan tanpa proof dan identitas tepercaya. Secret berasal dari environment lokal yang tidak dilacak; tidak ada role, grant atau credential baru.

Modul `jadwal` dari ADR-0020 dan fitur turunan `schedule_periods` dari ADR-0022 mengendalikan akses Public/Admin secara kumulatif. Referensi Cabor read-only tetap tersedia melalui Gateway terotorisasi ketika pengelolaan editorial Cabor dinonaktifkan. Akun/peran tidak diubah.

Mutasi mengunci row, memeriksa `expected_version` dan menyimpan state, snapshot immutable serta outbox audit dalam transaksi yang sama. Konflik versi/duplikat menghasilkan `409`, validasi `422`, dependency gagal `503` tersanitasi. Worker retry outbox memakai event ID stabil untuk deduplikasi broker. Audit menyimpan username immutable. Arsip selalu soft delete dengan aktor/alasan; pemulihan arsip menghasilkan draf. Pemulihan riwayat menambah versi baru dan dapat mengembalikan status tayang snapshot setelah konfirmasi, tanpa mengubah histori lama.

Public hanya memperoleh rentang tayang yang tidak diarsipkan; draf, versi, aktor dan histori tidak masuk projection anonim. Filter, sort allowlist, count dan pagination dilakukan di database. Count/page memakai satu statement snapshot, hasil maksimal 100 row. Aksi massal Admin memproses transaksi per row; kegagalan parsial dilaporkan dan tidak diulang otomatis.

## UI dan rollback

Admin menggunakan Data Utama → Rentang Jadwal Cabor, primitive Cuba canonical, ModalForm/draf pengguna, pagination/sort/seleksi, konfirmasi arsip/pemulihan dan pembandingan dua revisi. Public `/jadwal` menambah section rentang sesuai komposisi Techwind; rincian pertandingan existing tetap tersedia.

Rollback pertama adalah memulihkan image lokal yang dicatat sebelum aktivasi, mempertahankan tabel additive v6 dan seluruh volume. Pemulihan data dari dump memerlukan keputusan tersendiri karena dapat menimpa perubahan setelah snapshot. Release production memerlukan persetujuan baru, migrasi terotorisasi dan gate terpisah.
