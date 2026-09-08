# ADR-0019 — Taksonomi Dinamis, Otorisasi, dan Notifikasi Admin

## Status

Diterima — 8 September 2026.

## Konteks

Kategori Panduan Kota sebelumnya terikat pada nilai statis. Status aktif akun
tercampur dengan pengarsipan, hak akses hanya mengandalkan peran kasar, identitas
aktor audit tidak selalu ramah pengguna, dan ikon notifikasi belum mempunyai
sumber data penerima yang nyata.

## Keputusan

- Kategori Panduan Kota menjadi entitas dinamis dengan slug stabil, status,
  urutan, soft delete, pemulihan, dan riwayat. Publik hanya membaca kategori
  aktif; Admin dapat mengelola kategori tidak aktif secara terotorisasi.
- Status akun `aktif/tidak aktif` dipisahkan dari `diarsipkan`. Penonaktifan tidak
  memindahkan akun dari daftar, sedangkan arsip dapat dipulihkan. Akun sendiri
  dan Pengelola Utama aktif terakhir dilindungi.
- Peran dan hak akses memakai katalog granular, peran sistem yang dilindungi,
  peran khusus, sinkronisasi Keycloak, dan pemeriksaan ulang di API Gateway.
  Hak Venue menjadi domain tersendiri agar Pengelola Lokasi tidak memperoleh
  mutasi semua Data Utama.
- Audit menyimpan snapshot nama pengguna/nama tampilan pada saat kejadian dan
  memetakan catatan lama melalui direktori internal terotorisasi.
- Notifikasi disimpan per penerima, dideduplikasi dengan kunci per penerima,
  dapat ditandai satu/semua sebagai telah dibaca, dan tidak mengekspos notifikasi
  pengguna lain.
- Grafik Admin memakai pembungkus ApexCharts resmi yang dimuat secara malas;
  unggah gambar memakai zona jatuhkan aksesibel tanpa mengurangi validasi server.

## Konsekuensi

Migrasi PostgreSQL bersifat maju dan aditif: Master Data v15, User v4–v5, dan
Audit v3. Runtime wajib dimigrasikan setelah backup ber-checksum. Kegagalan
sinkronisasi penyedia identitas harus menggagalkan atau mengembalikan perubahan
lokal. UI bukan batas keamanan; API Gateway dan service tetap berwenang.

## Rollback

Hentikan layanan terdampak, pulihkan dump ber-checksum, kembalikan image/source
ke SHA sebelumnya, lalu recreate API Gateway, Admin, dan Nginx. Jangan menjalankan
migrasi turun pada data penting tanpa backup baru dan persetujuan eksplisit.
