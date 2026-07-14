# ADR-0001 — Integrasi Master Data, Media, Venue, dan Schedule

- Status: Accepted
- Tanggal: 2026-07-14
- Ruang lingkup: Admin Web, API Gateway, Master Data Service, Venue Service, Schedule Service

## Konteks

Admin Web sebelumnya memakai dua base URL: Media Library mengakses Master Data Service secara langsung, sedangkan form lain memakai API Gateway. Schedule juga mengirim ID cabor sebagai `nomor_tanding_id`, gateway mengarah ke port service yang salah, dan `schedule_db` memiliki foreign key ke salinan tabel venue yang bukan pemilik domain.

## Keputusan

1. Browser hanya mengakses API Gateway melalui `VITE_API_URL`.
2. Media disimpan sebagai URL relatif `/uploads/<random-id>.<extension>` dan diubah menjadi URL absolut hanya saat dirender.
3. Upload media dibatasi 10 MB dan hanya menerima JPEG, PNG, atau WebP berdasarkan signature konten, bukan hanya header browser.
4. `master-data-service` menjadi pemilik Cabor, Nomor Pertandingan, Kontingen, dan metadata Media.
5. `venue-service` menjadi satu-satunya pemilik Venue.
6. `schedule-service` menyimpan UUID eksternal nomor pertandingan dan venue tanpa foreign key lintas database. Referensi divalidasi melalui endpoint internal dengan timeout sebelum transaksi schedule ditulis.
7. URL upstream gateway dan schedule berasal dari environment variable sehingga nilai lokal dan nama service Docker tidak tercampur.
8. Migration, konfigurasi PostgreSQL, dan Prometheus dikemas ke image Docker untuk menghindari ketergantungan bind mount drive Windows.

## Konsekuensi

- Admin Web tidak lagi melewati JWT gateway saat upload atau menghapus media.
- Data media tetap portable antara localhost, staging, dan production.
- Jadwal tidak dapat dibuat menggunakan ID cabor; operator wajib membuat Nomor Pertandingan terlebih dahulu.
- Kegagalan Master Data Service atau Venue Service menghasilkan respons `503` saat validasi jadwal, bukan data referensi yatim.
- Named volume diperlukan untuk mempertahankan file media saat container diganti.

## Verifikasi

- Production build Admin Web dan seluruh image Docker berhasil.
- Unit test proxy path, validasi referensi, dan nama file media berhasil.
- CRUD sementara Cabor → Nomor Pertandingan → Venue → Jadwal berhasil dan dibersihkan.
- Upload media sementara dapat diakses melalui gateway, kemudian file dan metadata berhasil dihapus.
