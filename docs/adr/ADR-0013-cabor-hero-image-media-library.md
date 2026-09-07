# ADR-0013: Hero Image Cabor dari Media Library

- Status: Accepted
- Tanggal: 13 Agustus 2026
- Tahap: 4, 5, dan 10 - Public Web, Admin Web, dan Deployment

## Konteks

Header halaman detail Cabor hanya memakai gradasi statis. Operator memerlukan
gambar editorial berbeda untuk setiap Cabor tanpa mengubah source code atau
memasukkan URL eksternal.

## Keputusan

1. Cabor memiliki `hero_image_url` opsional yang dikelola bersama Logo Cabor.
2. Nilai baru wajib berupa path `/uploads/` dari Media Library aktif. API dan
   constraint database menolak URL eksternal, traversal, serta backslash.
3. Admin menyediakan selector Media Library dan preview landscape 16:9 tepat
   di bawah input Logo Cabor.
4. Public Web merender gambar utama sebagai elemen dekoratif `object-contain`
   agar komposisi tampil utuh tanpa crop atau distorsi. Lapisan blur pengisi
   kanvas dan overlay berlapis tetap menjaga kontras teks. Gradasi canonical
   menjadi fallback saat field kosong.
5. Penyimpanan hanya memuat referensi URL; lifecycle file tetap dimiliki Media
   Library dan mengikuti soft delete/retention yang berlaku.

## Konsekuensi

- Operator dapat mengganti visual per Cabor tanpa deployment source code.
- Seluruh Cabor lama tetap tampil aman sebelum gambar dipilih.
- Arsip media membuat delivery file ditolak; overlay dan warna dasar section
  tetap menjaga header terbaca tanpa membocorkan atau memakai sumber eksternal.
- Focal point khusus tidak diperlukan pada baseline karena gambar utama selalu
  ditampilkan utuh dan dipusatkan dengan `object-contain`.

## Quality Gate

- Migration Master Data v11 berstatus `dirty=false`.
- API menolak URL non-Media Library dan media yang sudah diarsipkan.
- Create/update/clear field teruji dan audit mutation Cabor tetap berjalan.
- Admin lint/build, Public lint/build, Go test, responsive smoke, media HTTP,
  health container, dan security header production harus lulus.
