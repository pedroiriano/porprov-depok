# Bahasa Web Publik PORPROV

Teks untuk pengunjung memakai Bahasa Indonesia yang singkat dan natural. Jelaskan informasi atau tindakan yang diperlukan; jangan menampilkan fase pengembangan, arsitektur, mekanisme publikasi Admin, nama komponen internal, atau petunjuk perbaikan infrastruktur.

| Hindari | Gunakan |
|---|---|
| Periksa API Gateway dan Master Data Service | Coba muat ulang halaman beberapa saat lagi. |
| SSE + JetStream, Event #, transport | Hapus; tampilkan waktu pembaruan bila tersedia. |
| Realtime terhubung | Pembaruan langsung |
| Polling aktif, fallback 30 detik | Pembaruan berkala; jangan menyebut implementasinya. |
| Data akan tampil setelah dipublikasikan pengelola | Informasi belum tersedia. |
| Kategori dinamis sedang tidak tersedia | Kategori belum dapat dimuat. |
| LiveScore Center, City Guide | Skor langsung, Panduan kota |

## Aturan

- Gunakan pesan gagal generik dengan tindakan yang aman, misalnya “Klasemen belum dapat dimuat. Silakan coba lagi.” Jangan menambahkan error mentah, status HTTP, hostname, nama service atau konfigurasi.
- Bedakan informasi belum tersedia dari kegagalan memuat. Jangan mengklaim data resmi, lengkap, sehat, atau terverifikasi tanpa dasar.
- Pertahankan peringatan data dummy, keterbatasan unduhan, penjelasan skor yang belum tersedia, serta petunjuk pagination yang diperlukan untuk memahami hasil. Jangan menyembunyikan keterbatasan produk demi tampak selesai.
- Nama Cabor/organisasi, isi berita, nama dan keterangan dokumen, serta konten editorial dari Admin tidak diganti massal. Koreksi konten tersimpan memerlukan pekerjaan editorial terpisah; publikasi Portal dan data domain tidak boleh ikut berubah.
- Identifier, route, event, status API, log internal dan kontrak backend tetap canonical. Perubahan label tidak mengubah makna status atau kontrol keamanan. Status pertandingan yang dikenal memakai pemetaan Bahasa Indonesia existing.
- Nama merek, format berkas dan satuan resmi seperti PDF, ZIP, MiB, Google Maps dan WhatsApp tetap dipertahankan bila relevan.

## Verifikasi

`node scripts/uiux/check-public-language.mjs` memeriksa AST source Public: teks JSX, metadata/label, atribut aksesibilitas dan pesan gagal. Import, identifier, route, CSS dan diagnostik internal tidak dianggap copy pengunjung. Ini mendeteksi istilah internal yang diketahui; bukan bukti seluruh tata bahasa atau konten dinamis sempurna.

Regresi pemindai: `node --test scripts/uiux/test-public-language.mjs`. Verifikasi runtime menggunakan halaman aktif tanpa mengaktifkan modul yang dinonaktifkan pemilik. Penanda dummy lokal tetap terlihat dan tidak boleh dibawa ke production sebagai jadwal resmi.
