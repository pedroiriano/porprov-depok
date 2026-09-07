# ADR-0017 — Pin Global Rekomendasi City Guide untuk Venue

- Status: Accepted
- Tanggal: 7 September 2026

## Konteks

Halaman detail Venue memilih satu City Guide terdekat untuk setiap kategori dalam radius 15 km. Panitia membutuhkan satu rekomendasi utama yang selalu muncul pada seluruh Venue, termasuk ketika lokasinya berada di luar radius tersebut. Relasi `venue.city_guide_ids` tidak sesuai karena bersifat per Venue dan tidak menjamin satu pilihan global.

## Keputusan

Master Data menjadi pemilik atribut `is_pinned_venue_recommendation`. Database membatasi maksimal satu record aktif yang dipin. Pergantian pin dilakukan secara transaksional melalui endpoint terotorisasi `PUT /api/v1/master-data/city-guides/{id}/venue-pin`, hanya untuk `super_admin`, dan menghasilkan audit event. City Guide yang sedang dipin tidak dapat diarsipkan sebelum pin dipindahkan.

Migrasi v12 memilih record aktif berjudul tepat `Department Sports Lab` sebagai default deterministik. Bila data tersebut tidak tersedia pada suatu instalasi baru, sistem tetap aman tanpa pin dan Admin menampilkan state yang meminta operator memilih satu record.

Public Venue selalu memilih record yang dipin untuk kategori miliknya, walaupun berjarak lebih dari 15 km. Kategori lain tetap memakai peringkat jarak dan jumlah keluaran tetap maksimal satu per kategori.

## Konsekuensi

- Pin global konsisten untuk seluruh Venue dan venue baru.
- Constraint, transaksi, RBAC, audit, serta perlindungan soft delete mencegah state ambigu.
- Migrasi harus dijalankan sebelum service dan frontend versi ini diaktifkan pada runtime.
- Rollback menghapus index dan kolom pin tanpa menghapus record City Guide.
