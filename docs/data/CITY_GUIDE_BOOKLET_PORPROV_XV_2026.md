# Dataset City Guide Booklet PORPROV XV Jawa Barat 2026

## Ruang Lingkup

Dataset kanonis berada di `data/city-guide/booklet-porprov-xv-2026.json` dan memuat seluruh 165 rekomendasi tempat pada `Booklet PORPROV XV.pdf` halaman 21–32. Urutan sumber, halaman, judul booklet, kategori, tautan Maps booklet, alamat, wilayah, koordinat, kategori lokasi, deskripsi, dan metadata verifikasi dipertahankan agar data dapat diaudit dan diimpor ulang.

| Kategori | Halaman | Jumlah |
|---|---:|---:|
| Coffee Shop | 21–24 | 62 |
| Wisata Kuliner | 25 | 10 |
| Tempat Menginap | 26–28 | 42 |
| Wisata Buatan | 29 | 17 |
| Wisata Situ | 30 | 12 |
| Pusat Perbelanjaan | 31 | 11 |
| Rumah Sakit | 32 | 11 |
| **Total** | **21–32** | **165** |

## Metode Verifikasi

1. Judul, kategori, urutan, halaman, dan tautan awal diekstrak langsung dari booklet.
2. Alamat dan koordinat diverifikasi terhadap hasil Maps yang dirujuk booklet.
3. Listing yang tidak lagi stabil atau tidak memiliki struktur bisnis dilengkapi dari sumber sekunder yang relevan: situs resmi fasilitas, SIRS Kementerian Kesehatan, BPS/BAPPEDA Kota Depok, Pemerintah Kota Depok, situs resmi PT Pakuan, OpenStreetMap/Photon, Waze, dan direktori bisnis/kuliner.
4. Nama tampilan tetap mengikuti booklet. Nama hasil verifikasi disimpan pada `verified_maps_title`; aplikasi tidak mengganti identitas sumber secara diam-diam.
5. Informasi jam operasional tidak dibakukan karena cepat berubah. Deskripsi selalu mengarahkan pengguna untuk mengonfirmasi layanan sebelum berkunjung.

Status verifikasi dataset per 22 Juli 2026:

| Status | Jumlah | Makna |
|---|---:|---|
| `verified_map` | 149 | Listing dan titik cocok dengan hasil Maps |
| `verified_secondary` | 10 | Diverifikasi melalui sumber geospasial, pemerintah, atau situs resmi lain |
| `historical_reference` | 5 | Alamat historis ditemukan, tetapi listing berubah/tutup/tidak stabil |
| `booklet_only` | 1 | Nama hanya dapat dipertahankan dari booklet dan perlu konfirmasi panitia |

Catatan penting: `Newly Hotel Indonesia` berstatus `booklet_only`. Tautan booklet saat ini mengarah ke kawasan D'Mall/Hotel Santika, tetapi tidak ditemukan listing independen yang cukup kuat untuk menyatakan keduanya sebagai entitas yang sama. Data tetap dimasukkan agar 165 item booklet lengkap, disertai catatan verifikasi di deskripsi CRUD.

## Impor Aman dan Idempoten

Jalankan dari root repository ketika Docker Compose canonical sudah aktif:

```powershell
$env:PORPROV_SEED_PASSWORD = "<password-admin-lokal>"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\import-city-guide-booklet.ps1
```

Validasi tanpa menulis data:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\import-city-guide-booklet.ps1 -DryRun
```

Importer menggunakan API Gateway dan token Keycloak sehingga validasi domain dan audit event tetap berjalan. Kunci upsert adalah gabungan `title + category`; pengulangan impor memperbarui record yang sama dan tidak melakukan delete. `image_url` yang sudah dipilih operator dipertahankan ketika dataset tidak menyediakan gambar.

## Quality Gate Dataset

- Total harus tepat 165.
- Distribusi kategori harus sama dengan tabel ruang lingkup.
- `title`, `category`, `address`, `latitude`, dan `longitude` wajib terisi.
- Koordinat wajib berada pada rentang geografis valid.
- Gabungan judul dan kategori tidak boleh duplikat.
- Operasi hapus setelah impor tetap mengikuti soft delete dan Recycle Bin.
- Entri `historical_reference` dan `booklet_only` perlu ditinjau operator sebelum publikasi produksi final.

