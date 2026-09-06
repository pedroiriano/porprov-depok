# ADR-0010 — City Guide Business Details and Server-side Pagination

## Status

Accepted untuk implementasi lokal v0.9; deployment production belum dilakukan.

## Konteks

City Guide akan memuat Catering dan Info Travel/Jasa Transportasi sehingga jumlah record serta variasi atribut bertambah. Dataset Catering awal memiliki nama usaha, alamat, Google Maps, screenshot, dan kontak/media sosial campuran. Model lama hanya menyediakan field editorial umum dan Admin mengambil seluruh record sebelum melakukan pagination.

## Keputusan

- Endpoint `GET /city-guides` tanpa `page/per_page` tetap mengembalikan array agar consumer publik lama kompatibel.
- Jika `page` atau `per_page` dikirim, endpoint mengembalikan `data`, `page`, `per_page`, `total_items`, dan `total_pages`; `per_page` dibatasi maksimal 100.
- Kontak dan atribut layanan disimpan terstruktur pada record City Guide.
- Kategori `Info Travel` wajib menyimpan minimal satu `fleet_types` dan `fleet_count` minimal satu.
- Satu outlet/cabang adalah satu record lokasi agar koordinat tetap mempunyai satu makna.
- Field screenshot eksternal tidak disediakan. Gambar dipilih melalui Media Library dan disimpan sebagai `image_url`.
- Soft delete, audit mutasi, validasi koordinat, dan validasi URL HTTPS tetap berlaku.

## Konsekuensi

- Admin tidak perlu memuat seluruh dataset untuk menampilkan satu halaman.
- Migrasi spreadsheet memerlukan normalisasi kontak, deduplikasi nama/outlet, serta pelengkapan koordinat.
- Sorting Admin pada tahap ini berlaku di halaman aktif; sorting server-side global dapat ditambahkan pada iterasi berikutnya.
