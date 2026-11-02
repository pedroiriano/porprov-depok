# Babak fleksibel dan kalender Jadwal — lokal 2 November 2026

## Cakupan

- Admin → Data Utama → Rincian Pertandingan: pilihan babak lama tetap canonical; tambahan kualifikasi, grup, 64/32/16 besar, perebutan juara ketiga, Putaran 1–4 dan putaran tambahan. Preset adalah saran, bukan penetapan aturan olahraga. Untuk Golf atau mekanisme Cabor lain yang berbeda, pilih **Babak lainnya — tulis sendiri**; nama khusus juga dipertahankan saat edit/pemulihan draf/revisi.
- Client dan server membatasi babak menjadi 1–50 karakter Unicode setelah trim, tanpa karakter kontrol/format. Database `round varchar(50)` tetap dipakai; tidak ada migrasi atau pengubahan data lama. Susunan peserta A/B dan kontrak LiveScore tidak diubah.
- Public `/jadwal`: Rentang Pelaksanaan dan Rincian Pertandingan membuka **Kalender** terlebih dahulu. Pengguna tetap dapat memilih **Daftar Kartu**. Kalender rincian berwarna per Cabor, memakai hari/jam WIB, ringkasan hover, detail klik/keyboard dengan modal native, dan tombol jumlah per tanggal untuk daftar lengkap.
- Kartu rentang menampilkan Cabor/nama khusus, status, tanggal dan durasi inklusif; kartu pertandingan merapikan judul/babak, label status Indonesia, peserta, WIB dan lokasi tanpa memotong nama panjang.

## Kontrak API dan keamanan

`GET /api/v1/schedule/matches/enriched` mempertahankan array tanpa parameter untuk consumer lama. Parameter additive `month=YYYY-MM`, `date=YYYY-MM-DD`, `cabor=<UUID>`, `venue=<UUID>` dan `status` mengaktifkan respons berhalaman. `q`, `sort`, `direction`, `page` dan batas `per_page<=100` tetap berlaku. Respons menambah:

- `calendar.month` dan `calendar.day_counts`: count seluruh hasil terfilter, **sebelum pagination**, berdasarkan WIB;
- `facets.cabors/venues/statuses`: pilihan filter dari projection aktif yang sama;
- urutan stabil dengan ID sebagai pembeda saat nilai sort sama.

Browser mengambil 24 record kalender atau 12 kartu per halaman, membatalkan request lama dan tidak mengambil seluruh dataset untuk pagination. Enrichment backend masih mengikuti read-model existing di memori; optimasi SQL untuk volume besar bukan klaim perubahan ini. Flag Portal, JWT/permission, projection, soft delete, outbox, peserta dan CSP tidak dilemahkan; teks dirender melalui React, bukan HTML mentah. Tidak ada dependency baru.

## Verifikasi dan runtime

- PASS: seluruh test handler Schedule; regresi babak Unicode/custom/legacy, invalid filter, WIB lintas bulan, count lintas pagination dan urutan stabil.
- PASS: empat test JS terarah kalender/babak, typecheck Admin/Public, lint file Web terdampak dan pemeriksaan kontrak OpenAPI.
- PASS: build image Admin/Public/Schedule, 19 container lokal running dan seluruh health check yang tersedia healthy; Nginx `-t` dan reload PASS. Hanya tiga container slice ini direcreate; tidak menjalankan dependency one-shot atau migrasi.
- PASS: HTTP Public Jadwal/Admin 200; kalender API November 2026 memakai dua pertandingan existing, `per_page=1` mengembalikan satu record tetapi total/count tetap dua; bulan tidak valid ditolak 400. Rentang API 200. Tidak ada data pertandingan baru disimpan.
- PASS browser Chrome lokal: kedua tampilan awal Kalender; detail klik, pergantian kartu, nama Cabor tetap terbaca ketika modul tujuan nonaktif, tema terang/gelap, tidak ada overflow pada viewport aktual 1280px, dan console error kosong. Form Admin terautentikasi menerima `Putaran 5 Golf` lengkap dengan fokus tetap; hanya draf smoke baru yang dibuang melalui UI, tanpa menyimpan pertandingan atau mengubah draf existing.
- PARTIAL: permintaan viewport 390px pada capability browser tidak mengubah ukuran aktual (tetap 1280px, termasuk tab baru). Override di-reset. Tidak mengklaim visual 390/1440px PASS. Kalender rentang/kartu rentang bulan ini kosong karena belum ada data tayang; tidak mengisi fixture domain hanya demi screenshot.
- PASS: pemeriksaan diff slice terhadap snapshot, checksum backup dan secret scan dasar atas baris tambahan. Full DevSecOps, CI/Git delivery dan production bukan cakupan pekerjaan ini.
- Test Go pertama dalam sandbox terhalang izin socket loopback pada test existing; pengulangan terarah pada host PASS. Ini bukan defect aplikasi.
- Tiga DOCX referensi governance tidak tersedia di `docs/reference`; tidak mengarang isinya. Baseline memakai Markdown root, standar engineering dan kontrak Cuba yang tersedia.

## Batas dan rollback

Hanya source dan Docker lokal. Tidak menjalankan Git delivery, akses VPS, migrasi, publikasi konfigurasi Portal, atau mutasi data pertandingan/fixture. Snapshot source ber-checksum dan image/container sebelum rebuild berada di `.tmp/schedule-flexible-20261102T104937Z/`; path checkpoint `.tmp/schedule-active-backup.txt`. Rollback memulihkan hanya file slice ini setelah perbandingan serta image lama pada tiga service terdampak, kemudian reload Nginx. Tidak ada schema down atau restore database.
