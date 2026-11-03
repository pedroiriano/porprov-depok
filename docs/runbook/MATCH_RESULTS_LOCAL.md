# Hasil pertandingan — lokal 3 November 2026

Scope: UI Cuba input skor, Public Techwind hasil/navigasi/kartu, serta validasi Schedule/LiveScore. Tanpa migrasi, data domain/fixture, publikasi Portal, Git delivery, atau VPS.

## Kontrak

- Hari pertandingan memakai WIB, bukan timezone browser/host. Input dan koreksi dibuka sejak 00.00 tanggal pertandingan; belum membatasi ke jam mulai karena permintaan menyebut tanggal. Tanggal hilang/tidak sah/upstream gagal menolak penulisan (503); sebelum tanggal menolak 422 sebelum persistence. JWT/role/proof internal, dua peserta A/B, expectedRevision, revisi append-only dan transactional outbox tetap berlaku.
- Admin menonaktifkan input skor/status/koreksi dan tombol simpan untuk tanggal mendatang; pemeriksaan ulang saat submit serta jam UI diperbarui berkala. Server tetap otoritas walau jam perangkat dimanipulasi.
- Hasil memakai route/modul existing `/livescore`. Tidak menambah modul/izin atau mempublikasikan pilihan Portal otomatis. Label header Hasil dan shortcut mengikuti halaman/modul yang diizinkan. Ikon shortcut LiveScore duplikat dihapus agar Navbar lebih lapang; menu mobile/submenu/tema dipertahankan.
- Detail Jadwal menautkan `/livescore?match=<UUID>`; pembacaan memakai optional `match_id` pada projection Schedule yang sama. UUID wajib tunggal/valid, filter dilakukan sebelum pagination; error/record tidak tersedia tidak dialihkan diam-diam ke pertandingan lain. Query invalid tidak memicu fetch. Pagination/filter normal tetap server-side, 12 record/halaman.
- Kartu hasil bersama dipakai Beranda/Hasil; identitas A/B dan afiliasi dari projection Schedule yang sama. Skor kosong berupa “–” dengan penjelasan, bukan angka nol; status selesai pada Jadwal saja tidak dianggap skor resmi. Angka nol hanya ditampilkan bila record skor ada. Skor legacy yang sudah terlanjur tersimpan untuk tanggal mendatang tidak dihapus; Public menunggu tanggal pertandingan sebelum menampilkannya. SSE dan refresh ringan dipertahankan; revisi lebih lama tidak menimpa event terbaru.
- Grid kartu bersama menyesuaikan 1/2/3/4 kartu sesuai batas konteks, tanpa kolom kosong yang dicadangkan untuk modul Medali nonaktif. Dipakai pada hasil, Beranda, Cabor, Venue, Panduan Kota, rekomendasi tempat dan podium Medali. Grid statis editorial/statistik/countdown yang mempunyai isi tetap tidak diubah menjadi grid data.
- Tidak ada raw HTML, secret, dependency baru, inline style dinamis atau pelemahan CSP/JWT/Portal. Pencarian maksimum 80 karakter, error publik natural, request dibatalkan saat berganti filter/unmount dan timeout mempunyai recovery UI.

## Verifikasi dan pemulihan

Snapshot before/checksum dan image runtime sebelumnya: pointer `.tmp/results-local-active.txt`. Test Go meliputi batas WIB, update/correction ditolak sebelum database, tanggal invalid serta filter exact-match/invalid/duplicate. Regresi React mencakup grid 1/2 kartu, nol vs skor kosong, urutan/afiliasi, escaping dan interaksi Jadwal. Typecheck/lint/build serta browser representative dipakai sesuai risiko; status final ditambahkan setelah runtime tersedia.

Rollback source harus membandingkan perubahan existing, memulihkan hanya slice dari before, lalu rebuild layanan lokal terdampak melalui launcher canonical dan reload Nginx lokal. Tidak perlu restore database atau migration down. Tiga DOCX referensi governance belum tersedia, sehingga Markdown canonical menjadi baseline tanpa mengarang isi dokumen.


## Hasil verifikasi lokal

- PASS Go test dua modul terdampak (LiveScore dan handler Schedule), termasuk 6 batas waktu/invalid-date dan kedua handler mutasi menolak future sebelum pool database digunakan. Koneksi loopback sempat ditolak sandbox; retest host PASS tanpa melemahkan kontrol aplikasi.
- PASS 12 regresi React/presentasi (termasuk grid 1/2 kartu, skor kosong vs nol), 2 test helper WIB/tautan UUID, TypeScript Public dan Admin `tsc -b`, ESLint Public scoped, oxlint Admin scoped, OpenAPI dan pemeriksaan bahasa. Admin menggunakan oxlint sesuai package.json; tidak ada instalasi dependency baru.
- Build lokal: Public/Admin/Schedule/LiveScore PASS melalui launcher canonical --no-deps, tanpa one-shot migration/bootstrap. Nginx -t/reload lokal PASS. Rebuild Public/Admin berikutnya hanya untuk temuan visual/source yang berubah, bukan pengulangan full suite tanpa perubahan.
- API Gateway exact-match projection PASS; UUID kosong/invalid/berulang menghasilkan 400. Projection konfigurasi Portal, jadwal dan skor identik terhadap snapshot baca-saja sebelum smoke; tidak ada fixture atau mutasi domain oleh agent.
- Super Admin asli: pertandingan 12 November memiliki input skor/status/koreksi serta tombol simpan disabled. Memilih pertandingan tanpa hasil tidak mewarisi skor match sebelumnya; nilai awal 0 belum disimpan. Match hari ini tetap dapat dipilih; agent tidak menekan tombol simpan.
- Browser Public: Jadwal → dialog → Hasil membuka tepat satu match Floorball dengan peserta dan skor 1–0 yang sama; Navbar Hasil dan pencarian server-side bekerja. Tiga kartu desktop mengisi tiga kolom, kolom Medali nonaktif tidak menyisakan ruang, menu ponsel menampilkan Hasil dan hasil tidak overflow.
- Temuan visual dituntaskan: breakpoint grid, lebar kartu tunggal, label hasil resmi, skor future legacy ditahan tanpa penghapusan, dan field pencarian/tanggal pada ponsel. Bukti final tema/viewport, console dan batas scope ada pada visual-results.json pada snapshot.

Risiko/batas: jam perangkat memengaruhi petunjuk UI, tetapi penolakan penulisan menggunakan jam server. Rule saat ini tanggal WIB 00.00, bukan jam mulai pertandingan. Endpoint skor existing belum mempunyai pagination sehingga tetap memakai kontrak existing; daftar pertandingan telah berpaginasi server-side. Full DevSecOps/CI, browser semua peran, stress test, Git delivery dan aktivasi production tidak dilakukan pada pekerjaan lokal ini.
