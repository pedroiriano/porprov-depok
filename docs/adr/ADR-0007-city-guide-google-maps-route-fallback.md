# ADR-0007: URL Google Maps Opsional dengan Fallback Koordinat City Guide

- Status: Accepted
- Tanggal: 27 Juli 2026
- Domain: Master Data / City Guide

## Konteks

City Guide sebelumnya hanya menyimpan pasangan latitude/longitude dan seluruh consumer membentuk tautan Google Maps dari angka koordinat. Operator membutuhkan URL rute yang dapat menunjuk listing bernama secara lebih informatif, tetapi koordinat tetap diperlukan untuk portabilitas, validasi geospasial, dan fitur peta yang tidak bergantung pada vendor.

## Keputusan

1. `latitude` dan `longitude` tetap wajib pada create/update, harus berpasangan, dan tetap menjadi sumber kebenaran lokasi.
2. `map_route_url` ditambahkan sebagai metadata presentasi opsional dengan panjang maksimum 2048 karakter.
3. API hanya menerima URL HTTPS dari host resmi Google Maps dan menolak userinfo, port khusus, domain tiruan, protokol tidak aman, atau path non-Maps.
4. Consumer memilih `map_route_url` yang valid dan tidak kosong. Jika kosong atau tidak aman, consumer membentuk tautan peta dari latitude/longitude dan nama tempat.
5. Mengosongkan `map_route_url` melalui update menyimpan `NULL` dan otomatis mengaktifkan fallback koordinat.
6. Link Admin dan Public memakai nama tempat sebagai label aksesibel; angka koordinat tidak menjadi teks aksi utama.

## Konsekuensi

- Migrasi Master Data naik ke v7 dan backward-compatible karena kolom baru nullable.
- Dataset booklet dan importer dapat mengisi URL rute tanpa menghapus koordinat.
- Validasi berlapis dilakukan pada Admin, API, database (panjang), dan normalizer Public Web.
- Ketergantungan Google hanya bersifat enhancement; lokasi tetap dapat dipakai ketika URL vendor tidak tersedia.
