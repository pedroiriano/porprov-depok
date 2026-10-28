# ADR-0022 — Fitur Jadwal dan bagian native yang mandiri

Tanggal: 27 Oktober 2026. Status: implementasi lokal, tanpa Git delivery atau aktivasi production.

## Keputusan

Registry tetap memiliki 10 modul. Rentang Jadwal Cabor (`schedule_periods`) dan Rincian Pertandingan (`schedule_matches`) adalah fitur terdaftar milik `jadwal`, masing-masing dengan flag Public dan Admin. Efektivitas merupakan irisan modul induk, flag fitur, RBAC terbaru, serta publikasi halaman/bagian. Mengaktifkan fitur tidak dapat menghidupkan modul nonaktif atau memberi izin pengguna.

Halaman Jadwal memiliki dua slot native sesuai fitur tersebut. Susunan array bagian menentukan urutan; setiap slot mendukung tampil/sembunyi dan standar/ringkas. Anchor `/jadwal#rentang-jadwal` dan `/jadwal#rincian-pertandingan` dapat menjadi target menu/submenu dan hanya ditampilkan jika target tersedia. Blok editorial menggunakan primitive aman existing, tanpa HTML/script bebas. Komponen yang tidak ditayangkan tidak melakukan request datanya.

## Kompatibilitas tanpa migrasi

Adapter read-only menambahkan default fitur pada dokumen lama yang belum memiliki field features. Slot lama `content` Jadwal dipecah menjadi dua slot pada posisi yang sama, membawa flag tampil dan varian lama; ID tabrakan dihindari. Array lama kosong tetap tersembunyi. Konversi idempotent tidak menulis database, menaikkan versi, mempublikasikan pilihan, atau mengubah snapshot immutable.

Saat SAVE_DRAFT, klien lama yang tidak mengirim features mempertahankan flag dari draf terkunci sebelum normalisasi/validasi. Publikasi dan pemulihan menggunakan adapter yang sama; UI membandingkan riwayat lama dalam bentuk ternormalisasi tanpa mengubah isi riwayat tersimpan. Native slot halaman lain tidak boleh dipindahkan ke Jadwal dan dua slot Jadwal tidak boleh diduplikasi/dihapus; gunakan flag tampil untuk menyembunyikannya.

## Batas fitur dan keamanan

Gateway dan Schedule menolak endpoint periode atau pertandingan sesuai fitur masing-masing, dengan pembedaan Public/Admin existing. Header internal dari browser tetap dibuang. Master Data mengirim kebijakan bertipe; loader baru menolak konfigurasi tanpa registry fitur lengkap setelah batas kegagalan/cache existing.

LiveScore memiliki kebutuhan baca pertandingan sendiri, terpisah dari penyuntingan Jadwal. Alias GET `/portal/references/livescore-matches` membutuhkan JWT, izin terbaru livescore.view dan modul LiveScore Admin. Alias GET Public `/livescore/schedule-projection` mengikuti modul LiveScore Public. Keduanya mem-proxy path tetap ke projection pertandingan existing; tidak menerima URL/target bebas atau menyediakan mutasi. Penonaktifan LiveScore tetap memblokir alias tersebut.

## Verifikasi dan rollback

Test Go/TypeScript membuktikan kompatibilitas, slot native, kombinasi modul/fitur, penolakan JWT/izin, dan pemisahan referensi LiveScore. Lifecycle PostgreSQL memakai tabel TEMP, termasuk draf klien lama, lalu rollback. Tidak ada fixture atau publikasi pengujian permanen.

Aktivasi lokal memakai backup Master Data ber-checksum, snapshot konfigurasi/ID image, build layanan terdampak, launcher canonical dan reload Nginx. Tidak ada perubahan skema atau data domain. Bukti aktual, exact image/backup serta hash konfigurasi sebelum/sesudah disimpan pada `.tmp/schedule-portal-controls-20261027/HASIL.md`. Pemulihan mengutamakan image/source checkpoint, menjaga volume dan skema additive existing; restore dump hanya dengan otorisasi terpisah.
