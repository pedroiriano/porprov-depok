# Pedoman Bahasa Web Admin PORPROV

## Tujuan

Web Admin menggunakan Bahasa Indonesia yang natural, ringkas, dan mudah dipahami operator. Istilah teknis internal tidak boleh menjadi teks antarmuka kecuali benar-benar diperlukan untuk pemeriksaan terotorisasi.

## Istilah Utama

| Hindari | Gunakan |
|---|---|
| Dashboard | Dasbor |
| Master Data | Data Utama |
| Hero Utama | Tampilan Utama |
| LiveScore Center | Pusat Skor Langsung |
| City Guide | Panduan Kota |
| Media Library | Pustaka Media |
| Audit Log | Log Audit |
| Recycle Bin | Arsip Terhapus |
| Workspace | Ruang kerja |
| Actor | Pelaku |
| Event | Pembaruan atau catatan |
| Payload | Rincian perubahan |
| Correlation/Request ID | Nomor pelacakan |
| Service | Layanan atau bagian |

## Gaya Penulisan

- Gunakan kalimat aktif dan jelaskan dampak tindakan sebelum istilah teknis.
- Tombol memakai kata kerja: Simpan, Perbarui, Arsipkan, Pulihkan, Bandingkan, Unduh.
- Pesan gagal menjelaskan tindakan pemulihan yang aman tanpa membocorkan rincian internal.
- Status memakai frasa operasional: Berfungsi normal, Perlu diperiksa, Menunggu verifikasi, Dipublikasikan.
- Nama field teknis hanya boleh tampil dalam rincian audit terotorisasi dan harus didampingi label yang dapat dipahami.

## Daftar Istilah Asing yang Diizinkan

| Istilah | Alasan |
|---|---|
| PORPROV | Singkatan resmi nama kegiatan. |
| SSO | Singkatan resmi mekanisme masuk terpadu; selalu disertai konteks masuk akun. |
| URL | Singkatan teknis yang sudah umum pada formulir alamat web. |
| CSV | Nama format berkas resmi untuk ekspor data. |
| SHA-256 | Nama algoritma resmi pada rincian integritas yang hanya tampil untuk pengguna berwenang. |
| NATS | Nama produk resmi pada Pusat Kesehatan Integrasi. |
| Redis | Nama produk resmi pada Pusat Kesehatan Integrasi. |
| Keycloak | Nama produk resmi pada Pusat Kesehatan Integrasi. |
| Umami | Nama produk resmi pada Pusat Kesehatan Integrasi. |
| Google Maps | Nama produk resmi pada formulir rute peta. |
| WhatsApp, Instagram, Facebook, TikTok | Nama merek resmi pada formulir kontak. |
| Google Chrome, Microsoft Edge, Safari, iOS | Nama produk resmi pada statistik peramban. |
| Laptop, tablet | Kata serapan yang dipahami pengguna. |

Nama produk pada Pusat Kesehatan Integrasi hanya boleh tampil kepada peran yang
berwenang dan harus disertai penjelasan operasional dalam Bahasa Indonesia.

## Penegakan

`npm run check:language` memakai AST TypeScript untuk memeriksa teks JSX,
atribut aksesibilitas, konfigurasi label, dan pesan pengguna secara
case-insensitive. Identifier, route, enum, nilai atribut mesin, dan import tidak
dipindai sebagai teks tampilan. Pengecualian baru harus ditinjau,
didokumentasikan di pedoman ini, dan tidak boleh digunakan untuk menyembunyikan
teks antarmuka yang belum diterjemahkan.
