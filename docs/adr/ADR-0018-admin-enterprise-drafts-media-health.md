# ADR-0018 — Draf Server, Turunan Media, dan Kesehatan Integrasi Admin

## Status

Accepted — 8 September 2026.

## Konteks

Web Admin memerlukan pemulihan formulir lintas perangkat, turunan gambar untuk
tampilan efisien, dan satu panel kesehatan dependency yang aman. IndexedDB saja
tidak menyelesaikan perpindahan perangkat; penggunaan file asli pada semua
ukuran memboroskan bandwidth; dan status teknis mentah berisiko membocorkan
alamat internal atau credential.

## Keputusan

1. User Service menjadi pemilik draf server berdasarkan subject pengguna,
   route, entity, dan versi form. Retensi tujuh hari, versi optimistis, batas
   payload, serta penolakan field sensitif diterapkan di backend. IndexedDB tetap
   menjadi fallback jaringan.
2. Master Data Service menyimpan metadata turunan `thumbnail`, `list`, dan
   `detail`; file asli tidak dihapus dan tetap menjadi sumber kebenaran.
3. API Gateway menyediakan endpoint kesehatan read-only untuk `super_admin` dan
   `auditor`. Respons hanya membawa kunci dependency, kesiapan, latensi, dan
   metrik antrean yang aman—bukan URL internal atau credential.
4. Daftar Admin memakai kontrak pagination maksimal 100 baris, debounce,
   cancellation, serta stale-response protection. Permintaan lama tanpa
   parameter pagination tetap kompatibel selama konsumen publik dimigrasikan.
5. Perubahan skema memakai migrasi forward-only dan hanya boleh diaktifkan
   setelah backup ber-checksum serta validasi restore-list.

## Konsekuensi

- Konflik draf menjadi eksplisit dan dapat diselesaikan pengguna tanpa menimpa
  perubahan perangkat lain secara diam-diam.
- Penyimpanan bertambah karena original dan derivative dipertahankan.
- Panel kesehatan membantu operasi tanpa menjadi kanal observability publik.
- Pagination saat ini kompatibel dan dilakukan oleh service setelah pembacaan
  koleksi; optimasi SQL `LIMIT/OFFSET` dapat dilakukan terpisah tanpa mengubah
  kontrak HTTP.

## Rollback

Recreate image dari baseline Git sebelumnya, pulihkan dump lokal tervalidasi
bila rollback skema diperlukan, dan pertahankan volume Pustaka Media. Jangan
menjalankan down migration pada production tanpa keputusan terpisah.
