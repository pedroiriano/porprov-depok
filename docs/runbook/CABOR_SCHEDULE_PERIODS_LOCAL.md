# Rentang Jadwal Cabang Olahraga — operasional lokal

Rujukan: [ADR-0021](../adr/ADR-0021-cabor-inclusive-schedule-periods.md).

## Penggunaan

1. Buka `http://localhost:5173/admin/master-data?tab=rentang-jadwal` dengan akun berizin Data Utama.
2. Pilih **Tambah rentang**, cabang olahraga, nama khusus opsional, tanggal mulai/selesai lengkap dengan tahun dan keterangan publik opsional.
3. Isi alasan perubahan. Aktifkan **Tampilkan pada halaman Jadwal Web Publik** bila sudah disahkan, lalu simpan. Tanpa pilihan tayang, data menjadi draf.
4. Lihat `http://localhost:3000/jadwal`. Pencarian cabang/kategori, filter berlangsung pada tanggal, dan pagination membaca projection tayang melalui Gateway.
5. Arsipkan data yang tidak diperlukan. Menu **Arsip rentang** dan **Pulihkan** mempertahankan histori dan mengembalikan data sebagai draf. Riwayat dapat dibandingkan dua versi dan dipulihkan sebagai perubahan baru dengan konfirmasi.

Contoh pengisian: Bola Basket, 31 Oktober–5 November; Sepakbola dengan nama khusus Sepakbola Putri, 2–13 November. Tahun wajib dipilih. Contoh tersebut tidak dimasukkan otomatis ke database sebagai data resmi.

Form memakai draf server/perangkat canonical. Konflik `409` mempertahankan pekerjaan; periksa data terbaru dan rekonsiliasi isi draf secara sadar, tanpa menaikkan versi secara otomatis. Jika Cabor diarsipkan, pilih referensi aktif sebelum menyimpan. Nama cabor pada rentang merupakan snapshot saat mutasi, bukan pembacaan lintas service dari browser.

## Kontrak HTTP

Prefix Gateway `/api/v1/schedule`, internal Schedule `/api/v1`. Semua response fitur menggunakan `Cache-Control: no-store`.

| Method dan rute | Akses |
|---|---|
| `GET /periods` | Anonim; tayang + tidak diarsipkan saja |
| `GET /periods/manage` | JWT aktif + `master_data.view` |
| `POST /periods` | `master_data.create` |
| `PUT /periods/{id}` | `master_data.update` |
| `DELETE /periods/{id}` | `master_data.archive`; soft delete |
| `POST /periods/{id}/restore` | `master_data.restore`; kembali sebagai draf |
| `GET /periods/{id}/history?page=N` | `master_data.view`; 20 snapshot/halaman |
| `POST /periods/{id}/restore-revision` | `master_data.update`; revision harus milik entitas yang sama |

Daftar menerima `q` maksimal 80 karakter, `page`, `per_page` 1–100, `cabor_id`, `date`, `sort` allowlist dan `direction=asc/desc`. Admin dapat memakai `archived=true`; parameter ini tidak membuka data privat di endpoint publik. Filter tanggal mencocokkan `starts_on <= date <= ends_on`.

Payload simpan: `cabor_id`, `label` maksimal 120 karakter, `starts_on`, `ends_on`, `notes` maksimal 1.000 karakter, `is_published`, `expected_version`, `reason` 5–500 karakter. Create memakai versi 0; mutasi lain wajib versi terbaru. Arsip/pulih cukup mengirim versi dan alasan. Pemulihan revisi menambahkan `revision_id`. UUID harus canonical; body dibatasi 16 KiB. Tidak ada HTML/JS yang dieksekusi dari konten.

## Persistensi dan bukti

- Database pemilik: `schedule_db`, migrasi lokal v5→v6 additive, tanpa perubahan pertandingan/peserta.
- Backup sebelum migrasi: `.tmp/schedule-periods-20261027/backup/schedule_db.dump`.
- SHA256 backup: `5EC442093448029A0C29B4B8E15103A327C7623F549E21AD019C6B68FFD59659`.
- Checksum dan listing archive tervalidasi. Ini tidak diklaim sebagai drill restore penuh.
- Inventaris image rollback dan jumlah row domain sebelum/sesudah berada di folder backup. Tag rollback berawalan `porprov-local-rollback:schedule-periods-20261027-` dengan exact nama dari snapshot.
- Pengujian lifecycle menggunakan tabel TEMP, transaksi luar dan rollback; tidak membuat fixture domain permanen atau mengubah audit production.
- Aktivasi memakai launcher canonical `infra/docker/compose-up.ps1` untuk layanan terdampak, dilanjutkan `nginx -t` dan reload Nginx. Jangan Compose down, hapus volume, migrasi turun atau mengakses VPS.

Hasil source/runtime/browser aktual dicatat dalam `.tmp/schedule-periods-20261027/HASIL.md`. Status migrasi/build tidak menggantikan verifikasi browser terautentikasi. Peringatan collation PostgreSQL existing berada di luar scope dan tidak diperbaiki melalui migrasi ini. Full QA/DevSecOps dan Git delivery tidak dijalankan dalam pekerjaan lokal ini.
