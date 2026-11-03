# Rombak kalender dan kartu Jadwal — lokal 2 November 2026

## Arah desain

Referensi baca-saja:

- https://porprov.konijabar.or.id/jadwal?tampilan=kalender — matriks Cabor × tanggal, ringkasan jumlah dan penghubung agenda harian.
- https://porprov.konijabar.or.id/jadwal?tgl=2026-11-02 — pemilih hari dan agenda per Cabor.

Pola diadaptasi menjadi komponen React clean-room dalam Techwind/PORPROV; tidak menyalin source, aset, branding atau data pertandingan pihak ketiga. Tidak menambahkan status medali, skor, venue rentang atau klaster yang belum tersedia pada kontrak data Depok. Kualitas visual manusia tetap memerlukan browser acceptance, bukan klaim dari build.

## Implementasi

- `ScheduleCalendarBoard.tsx`: satu matriks bersama untuk rentang dan rincian pertandingan. Cabor/sub-Cabor menjadi baris, tanggal menjadi kolom; kolom Cabor dan kepala tanggal melekat dalam area scroll terbatas. Pengguna keyboard dapat memfokuskan area scroll. Hari ini, akhir pekan, warna kelompok dan legenda membantu pembacaan.
- Klik agenda tunggal membuka dialog native existing; beberapa laga/rentang dalam sel membuka daftar lengkap pada tanggal tersebut. Hover/label aksesibel memuat identitas agenda. Tombol kepala tanggal memakai count **seluruh hasil server**, tidak menghitung hanya record halaman.
- `ScheduleDayStrip.tsx`: pemilih tanggal mendatar, bulan sebelumnya/berikutnya, Hari Ini dan Semua Tanggal. State tetap dikendalikan consumer; perubahan filter mereset pagination, request lama dibatalkan.
- Kartu rentang: Cabor/nama khusus, status, tanggal awal menonjol, rentang lengkap, durasi inklusif dan keterangan. Kartu rincian: jam WIB, status Indonesia, nomor/babak, peserta A/B, tanggal dan lokasi; referensi tetap terlihat jika modul tujuan tidak aktif. Shared card juga dipakai halaman detail Cabor/Venue. Kartu tunggal memakai lebar penuh agar tidak menyisakan setengah kolom kosong.
- `SchedulePresentation.module.css`: gaya scoped yang memakai palet slate/blue dan identitas PORPROV existing, enam warna kelompok, dark melalui `.dark`, fokus keyboard, target klik minimal44px, kartu satu kolom mobile, dan scroll hanya di matriks/pemilih tanggal. Tidak mengimpor CSS tema vendor atau membentuk sistem tema global lain.
- Nomor halaman rentang mengikuti hasil server ketika dataset berubah dan server melakukan clamp halaman.

## Kontrak dan keamanan yang dipertahankan

API dan skema tidak berubah. Rentang/rincian tetap memakai pagination24record kalender/12kartu; grouping detail sesuai Cabor dan grouping rentang memakai Cabor+NamaKhusus. Browser tidak mengambil seluruh dataset. Count total lengkap tidak disamakan dengan detail baris yang hanya mengikuti halaman aktif; batas tersebut dijelaskan di UI.

Tidak mengubah JWT/RBAC, konfigurasi Portal, publikasi fitur, outbox, audit, soft delete, sesi/form Admin atau data pertandingan. Tidak memakai HTML mentah, style attribute dinamis, dependency baru, URL eksternal baru atau perubahan Nginx/security header. CSS module masuk stylesheet build existing sehingga CSP tetap berlaku.

## Verifikasi dan batas

- PASS: empat regresi tanggal/babak existing; empat regresi interaksi presentasi nyata React pada DOM terisolasi, termasuk countlintaspagination, kliksel, pemilihhari/bulan, dan kontras12pasangan warna ≥4,5:1.
- PASS: TypeScript Public dan lint file terdampak. Build Docker Public lokal final PASS; Nginx-t/reload PASS;19container running dan available health checks healthy.
- PASS smoke lokal pertama: `/jadwal`200, lima assetCSS200, APIrentang200 dengan0rentang tayang, APIrincian200 dengan2pertandingan existing. Tidak membuat fixture domain.
- PASS visual browser lokal pada viewport aktual 390×844 dan 1440×1000, terang/gelap: kalender rincian, kartu, pemilih tanggal, serta dialog detail dapat dibaca tanpa overflow halaman. Matriks bergulir secara internal; posisi kolom Cabor tetap saat scroll mendatar. Klik agenda membuka detail; Escape menutup dialog dan mengembalikan fokus, dengan scroll belakang dikunci selama dialog terbuka. Filter 4/12 November menghasilkan masing-masing satu pertandingan existing dan jam WIB yang sesuai. Console error kosong pada sesi verifikasi.
- Batas data visual: belum ada rentang tayang lokal. Keadaan kosong rentang diperiksa melalui browser; baris rentang terisi/sub-Cabor memakai regresi DOM komponen bersama dan belum mempunyai acceptance visual dengan data domain nyata. Tidak membuat fixture atau menerbitkan data untuk mengisi kalender. Screenshot kedua ukuran/tema dan hasil interaksi tersimpan dalam snapshot `visual-results.json`; bukti ini bukan klaim seluruh kombinasi dataset atau verifikasi production.
- Tiga dokumen DOCX referensi root tidak tersedia; baseline tetap Markdown governance yang sudah tersedia.

## Runtime dan rollback

Hanya Public Web lokal dibangun/recreate menggunakan `infra/docker/compose-up.ps1 -NoDeps public-web`, diikuti Nginx-t/reload lokal. Tidak Git delivery, akses VPS, migrasi, penyalinan data production, atau mutasi data domain.

Snapshot sebelum perubahan ber-checksum dan image/container sebelumnya: `.tmp/schedule-visual-20261102T131645Z/`; pointer `.tmp/schedule-visual-active.txt`. Evidence build, smoke dan diff disimpan di snapshot tersebut dan tidak dilacak Git. Rollback memulihkan hanya file slice setelah perbandingan, rebuild Public atau gunakan image sebelumnya, lalu reload Nginx lokal. Tidak perlu schema-down atau restore database.

## Data dummy lokal atas permintaan pemilik — 2 November 2026

Setelah penerimaan visual awal, pemilik mengotorisasi pengisian rentang dummy 31 Oktober–12 November 2026. Batch `schedule-dummy-20261102` menambah 12 record tayang pada 11 Cabor aktif existing, termasuk Basket 5x5/3x3 dengan rentang berturutan. Masing-masing record bertanggal inklusif tanpa jeda dalam rentangnya dan berketerangan **DUMMY LOKAL, bukan jadwal resmi**. Tidak mengubah pertandingan, peserta, publikasi Portal, atau VPS.

Backup Schedule sebelum pengisian: `.tmp/schedule-dummy-20261102/schedule_db.before.dump`, SHA256 `967e37d47ed2e0e4ca8a552933ffbf75ca1a8afcd3a4cd20509f223fd31cafe1`; checksum dan listing archive tervalidasi, bukan klaim drill restore penuh. Pengisian administratif fixture lokal memakai transaksi state + 12 revisi CREATE immutable + 12 audit outbox dengan aktor eksplisit `local-dummy-seeder`; tidak meniru akun pengguna atau mengubah kontrol akses. API Gateway Oktober/November serta jumlah per hari PASS; hash pertandingan/peserta tetap identik. Browser desktop memverifikasi matriks terisi, detail Golf dan kartu rentang. Tidak mengulang full suite source yang tidak berubah.

Manifest exact ID, rentang, snapshot/hash baseline, hasil API dan bukti berada pada `.tmp/schedule-dummy-20261102/`. Rollback scoped tersedia sebagai `rollback-soft-archive.sql`: hanya 12 ID batch, memeriksa versi awal agar tidak menimpa edit berikutnya, kemudian soft archive + batal tayang dengan revisi/outbox baru. Jangan restore seluruh database di atas pekerjaan pengguna yang lebih baru. File fixture/backup tidak dilacak Git dan tidak boleh disalin ke production.

## Penyempurnaan alur baca dan klik — lokal 2 November 2026

Keluhan pemilik setelah melihat data dummy: kalender terkesan teknis, rentang pecah menjadi kotak berulang dan kartu belum membuka detail. Adaptasi berikut tetap memakai otoritas Techwind dan dua referensi di atas:

- Pintasan berdasarkan tujuan: tanggal pelaksanaan Cabor atau jam/peserta/lokasi laga; hanya bagian yang diizinkan konfigurasi Portal mendapat pintasan.
- Satu batang kalender menyambungkan seluruh tanggal berkesinambungan yang tampak pada bulan aktif. Label tetap menampilkan tanggal mulai/selesai asli, termasuk lintas bulan. Rentang tumpang tindih tidak digabung diam-diam; tanggal dengan lebih dari satu record membuka daftar harian berpaginasi.
- Tanggal kalender mengarahkan fokus/tampilan ke agenda hari tersebut. Ringkasan memakai count lengkap server; kartu agenda hanya memakai record halaman aktif, dengan tautan hasil lengkap jika jumlahnya lebih besar. Tidak mengambil seluruh dataset.
- Batang, agenda harian dan seluruh bidang non-tautan kartu membuka dialog detail yang sama. Tombol judul menggunakan stretched hit area; tautan Cabor/Venue canonical tetap terpisah dan dilindungi konfigurasi Portal. Tidak ada nested button/link atau handler klik global.
- Detail periode memuat Cabor/sub-Cabor, rentang, durasi inklusif, status dan keterangan; menjelaskan bahwa jam/peserta/lokasi berada pada rincian laga. Detail laga memakai seluruh informasi projection yang tersedia, termasuk alamat Venue jika tersedia. Tidak mengarang lokasi, medali, klaster atau skor.
- Filter lanjutan Cabor/lokasi/status dapat dibuka saat diperlukan; pencarian dan tanggal/bulan tetap langsung tersedia. Dialog native mempertahankan Escape, fokus, inert background dan penguncian scroll melalui class yang aman untuk CSP.

Snapshot slice: pointer `.tmp/schedule-ux-active.txt`, backup SHA, runtime sebelum rebuild serta log build. Tidak ada migrasi, dependency, perubahan header/CSP, publikasi Portal, mutasi dummy/existing, Git delivery atau VPS pada slice penyempurnaan ini. Hasil gate final dicatat setelah browser dan runtime diverifikasi.

Hasil final slice penyempurnaan:

- PASS tujuh regresi DOM/presentasi: batang utuh lintas bulan, rentang overlap, pemisahan sub-Cabor, count lengkap lintas halaman, navigasi agenda/detail, kartu keyboard, pemilih hari/bulan, default agenda terdekat dan 12 pasangan kontras warna. Satu test dapat mencakup beberapa acceptance criteria; bukan klaim seluruh dataset.
- PASS TypeScript, lint seluruh file aplikasi terdampak dan build Public Linux final. Nginx test/reload PASS, 19 layanan lokal running dengan available health checks healthy. Launcher mengubah cwd shell; post-check data dijalankan dengan path absolut setelah satu percobaan path relatif tidak menemukan script. Tidak mengulang build untuk kegagalan path post-check tersebut.
- PASS browser representative 390×844/1440×1000, light/dark: kalender/kartu/dialog/agenda, klik bidang kartu, fokus ke agenda setelah pemilihan tanggal, Escape/fokus kembali, serta filter Cabor. Default rincian memilih pertandingan terdekat ketika tidak ada laga hari ini. Console error kosong; tidak ada overflow halaman. Screenshot dan `visual-results.json` berada pada snapshot slice.
- PASS API count Oktober/November dan integritas data: tetap 12 rentang dummy/12 revisi CREATE, hash pertandingan/peserta identik dengan baseline sebelum fixture. Tidak menambah/mengubah fixture saat penyempurnaan UI. Snapshot dump/checksum pada bagian dummy tetap berlaku; source rollback memakai backup slice.
- Diff/secret check scoped PASS; tidak menambah dependency, HTML mentah, inline style dinamis, public endpoint, header atau exception keamanan. Ini bukan audit keamanan menyeluruh/DevSecOps, CI atau bukti runtime production.

Image Public lokal final `sha256:4c7f1eacf858a516ba62be0142468aec46753e531fc2fad3062dd6b836de027b`. Rollback: bandingkan lalu pulihkan hanya file slice dari snapshot, singkirkan file baru `ScheduleDetails.tsx` hanya jika masih identik dengan kandidat ini, build Public melalui launcher canonical dan reload Nginx. Database tidak perlu di-restore untuk rollback UI; dummy memiliki soft-archive rollback tersendiri.


## Identitas pihak bertanding — lokal 3 November 2026

Perbaikan terarah pada agenda harian kalender: sebelumnya ringkasan hanya memuat Cabor, nomor, waktu/babak/lokasi meskipun API sudah memberikan peserta. `ScheduleParticipants.tsx` kini dipakai oleh agenda, daftar kartu dan dialog detail. Nama Kontingen, Tim atau Individu tampil langsung, disertai afiliasi Kontingen untuk tim/atlet apabila tersedia dan berbeda dari nama utama. Urutan slot A/B dipertahankan tanpa memutasi array API; sisi belum tersedia ditampilkan menunggu konfirmasi. Jenis lain memakai label Peserta dan display_name yang tersedia; tidak menambah jenis peserta baru pada kontrak backend. Tidak memakai UUID sebagai nama atau membuat lawan/data baru.

Komponen hanya merender teks React (termasuk input berkarakter HTML), tanpa innerHTML, inline style, request tambahan atau endpoint baru. Nama panjang dapat membungkus, tidak dipotong. Tombol agenda mempunyai nama aksesibel berisi kedua pihak dan tetap membuka dialog; tautan Cabor/Venue canonical, pagination, count, filter, WIB, Portal dan guard izin dipertahankan.

Verifikasi proporsional: 10 regresi presentasi/DOM PASS, meliputi urutan, tipe peserta, afiliasi, sisi kosong, escaping dan integrasi agenda/kartu; TypeScript, lint komponen terdampak, pemeriksaan bahasa dan build Public Linux PASS. Public lokal direcreate melalui launcher canonical `infra/docker/compose-up.ps1 -NoDeps public-web`, disusul `nginx -t` dan reload lokal. Snapshot projection API sebelum/sesudah identik, tanpa fixture atau mutasi database.

Browser lokal representative 1440px/390px light/dark memverifikasi Kontingen Kota Depok dan Kabupaten Bandung langsung terlihat pada agenda. Klik membuka detail; Escape mengembalikan fokus; tidak ada overflow halaman. Variasi Tim/Individu, nama panjang dan data belum lengkap dibuktikan regresi in-memory, tanpa memasukkan fixture ke database. Screenshot, log serta manifest checksum berada di snapshot yang ditunjuk `.tmp/schedule-participants-active.txt`. Source rollback: bandingkan dan pulihkan hanya slice dari folder before; runtime rollback memakai image Public sebelumnya yang tercatat, kemudian Nginx-t/reload lokal. Tidak perlu restore database.

Tidak Git delivery, akses VPS, migrasi, perubahan data domain atau publikasi Portal. Enam dokumen root disinkronkan tanpa membuang perubahan existing. Tiga DOCX referensi yang tercantum pada AGENTS.md tidak tersedia di docs/reference saat pemeriksaan; baseline Markdown dan kontrak UI existing digunakan, tanpa mengarang isi DOCX.
