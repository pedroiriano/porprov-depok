# Pengelolaan skor dan daftar hasil — lokal

Tanggal: 3 November 2026. Scope source dan Docker lokal; tanpa Git delivery/VPS, migrasi, fixture atau mutasi data domain oleh agent. Working tree existing dipertahankan. Pointer snapshot: `.tmp/results-workspace-active.txt`.

## Alur operator dan pengunjung

- Admin: tabel Skor tercatat memakai AdminDataTable Cuba, pencarian, sorting, 10/25/50/100 baris, pagination server, pemilihan baris dan ekspor pilihan halaman aktif. CSV menetralkan awalan formula; tidak mengekspor metadata privat actor.
- Aksi Perbarui/Koreksi memilih jadwal yang sama dan versi saat dibuka. Riwayat bersifat baca-saja. Pertandingan tanpa jadwal aktif masih tercantum sebagai Jadwal tidak tersedia, dengan akses riwayat dan tanpa edit.
- Tambah skor memakai SearchableSelect React canonical, tanpa jQuery/dependency baru, pencarian keyboard, Escape, penutupan klik luar, paging opsi dan pengabaian respons stale. Pertandingan yang sudah mempunyai skor dikeluarkan di server sebelum count/pagination. Jadwal masa depan masih dapat dilihat tetapi input tetap terkunci sampai tanggal WIB, dengan validasi server existing.
- Realtime memperbarui tabel/pilihan tanpa menimpa form dan expectedRevision saat dibuka. Konflik tetap ditolak oleh service. Koreksi tetap append-only dengan alasan; transaksi/outbox dan riwayat tidak diubah.
- Public: daftar baris ringkas berkelompok Cabor/tanggal, peserta A/B dan afiliasi utuh, skor nol nyata, jam WIB, nomor/babak, venue dan status. Klik seluruh baris membuka dialog native bersama dengan kartu hasil lengkap. Tidak membuat angka skor untuk pertandingan yang belum mempunyai hasil.
- Awal menampilkan hari ini WIB, termasuk perpindahan hari selama halaman terbuka. Pergantian bulan menampilkan seluruh bulan; pemilih tanggal/Hari ini/Semua tanggal memakai ScheduleDayStrip yang sama dengan Jadwal. Pencarian dan pagination 20 hasil/halaman dilakukan server. Tautan match dari Jadwal memilih hasil exact-match tanpa dibatasi bulan awal.

## Kontrak dan keamanan

Gateway menambah GET `/api/v1/livescore/workspace` (JWT, izin terbaru `livescore.view`, kapabilitas Admin) dan GET `/api/v1/livescore/results` (projection anonim, kapabilitas Public LiveScore). Tidak mengubah endpoint lama atau skema.

Gateway menggabungkan projection Schedule/LiveScore existing secara internal, lalu memfilter, menghitung dan memotong halaman sebelum data sampai browser. Projection upstream legacy masih tidak berpaginasi; setiap body dibatasi 16 MiB dan timeout gabungan 8 detik. Beban besar yang melampaui batas gagal 503 secara jujur; migrasi ke read-model terpersisten/incremental merupakan pekerjaan skala berikutnya, bukan klaim unlimited scale. Tidak ada cross-database join atau browser mengakses port service.

Actor berasal dari context JWT tervalidasi; header browser palsu diabaikan. Public tidak meneruskan identity/Authorization dan memakai endpoint skor Public. Redirect upstream tidak diikuti agar token tidak dikirim ke tujuan lain. JSON output Public hanya field tayang eksplisit, tanpa actor, revision ID, alasan koreksi atau field peserta privat. Jadwal hilang, tanggal masa depan/invalid dan peserta tidak lengkap tidak menghasilkan skor Public. Query berulang, parameter asing, q >80, per_page >100, tanggal/UUID invalid ditolak sebelum upstream. Pencarian literal tanpa SQL/HTML dinamis. Error dependency generik dan no-store tetap berlaku.

Tidak mengaktifkan atau mempublikasikan pilihan Portal otomatis. Status runtime lokal tidak membuktikan penerimaan production atau Git/CI.

## Verifikasi dan rollback

Status final serta screenshot/checksum disimpan pada snapshot pointer di atas. Pemeriksaan minimum: Go read-model + permission/privacy/query regression, Admin table/picker dan Public day/row interaction, lint/typecheck/build tiga layanan terdampak, OpenAPI, bahasa dan diff/secret scan. Browser representatif memperlihatkan tabel, opsi yang menyaring hasil existing, aksi Riwayat tanpa menyimpan skor, daftar hari ini serta tema/responsif.

Rollback: bandingkan perubahan existing lalu pulihkan hanya slice source dari before snapshot; rebuild Public/Admin/Gateway lokal melalui `infra/docker/compose-up.ps1` dengan --no-deps dan reload Nginx lokal. Tidak memerlukan restore DB atau migration down. Tiga DOCX referensi governance belum tersedia; Markdown canonical menjadi baseline tanpa mengarang isinya.

## Hasil akhir lokal

- PASS Go test modul router Gateway terdampak; regresi khusus mencakup query/UUID/tanggal WIB, pagination lebih dari satu halaman, skor orphan tetap di Admin, skor nol, pencarian literal, izin dicabut, modul Public nonaktif, privasi field, dua slot/jenis peserta, dan redirect upstream tidak diikuti.
- PASS 17 regresi presentasi/interaksi terkait (12 baseline Jadwal + 5 workspace): keyboard/Escape/fokus/klik luar picker, paging opsi, peserta/afiliasi/escaping/skor nol/baris klik, CSV formula injection dan date strip compact. Ini pengujian DOM, bukan pengganti pemeriksaan visual.
- PASS lint/typecheck Admin dan Public, OpenAPI, pemeriksaan copy Public 70 file, build Public/Admin/Gateway melalui launcher canonical --no-deps, Nginx -t dan reload lokal. Rebuild berikutnya hanya untuk temuan visual/source yang berubah, bukan pengulangan full suite.
- Super Admin browser: dua skor existing tampil dalam tabel; pilihan input baru hanya memuat Sepakbola Putri tanpa skor; mengetik “Sepakbola” mempertahankan fokus dan seluruh karakter. Pemilihan jadwal 12 November mengunci input. Aksi Riwayat menampilkan dua revisi Floorball dengan form disabled. Koreksi dibuka tanpa disimpan; isian percobaan bertahan saat tombol Perbarui ditekan, lalu dibersihkan melalui Tambah skor. Sorting, 25 baris, pemilihan seluruh halaman dan kesiapan tombol ekspor diperiksa tanpa menekan simpan atau membuat domain fixture.
- Public browser: hari ini WIB terpilih, Floorball 1–0 tampil sebagai daftar ringkas; tanggal 4 November tidak menampilkan skor legacy masa depan. Klik baris membuka rincian yang sama, Escape menutup dialog. Pemilih bulan native melalui keyboard berpindah ke Oktober dan Hari ini mengembalikan November. Public 390px dark/light dan 1440px light tidak overflow; Admin 1440px dark dan ukuran layar sempit yang tersedia tidak overflow. Lebar Status desktop diperbaiki menjadi minimal 96px setelah temuan visual huruf terpotong.
- Batas browser: akses Browser use dinonaktifkan di pengaturan Work menjelang penutupan. Verifikasi tambahan Admin tema terang, Admin tepat 390px serta Public 1440px dark/console akhir tidak selesai; tidak diklaim PASS. Bukti screenshot yang sudah tersimpan tetap valid untuk scope di atas. UAT seluruh peran, active security scan, CI/DevSecOps lengkap dan Git delivery tidak dijalankan.
- PASS 19 kontainer berjalan; healthcheck yang tersedia healthy. HTTP Public Hasil/Admin/Gateway 200. Fingerprint matches, participants, schedule_periods, livescore_current dan livescore_revisions identik sebelum/sesudah pemeriksaan; tidak ada penyimpanan skor, migrasi atau publikasi Portal oleh agent. Git index root existing tetap identik. Snapshot source/checksum, exact slice files, runtime images serta handover ada pada folder pointer.
