# Kandidat rilis Babak dan Kalender Jadwal — 2 November 2026

## Otorisasi dan baseline

Pengguna mengotorisasi kandidat terisolasi, Git delivery melalui PR/required CI PASS, serta deployment **hanya Admin Web, Public Web dan Schedule Service**, diikuti validasi/reload Nginx. Tidak menjalankan migrasi/bootstrap, publikasi modul, penyalinan data lokal, perubahan credential/TLS, atau penghapusan resource.

- Baseline kandidat dan production saat preflight: `0c438c76db5bb8816c53f7f8ebaa552696505814`.
- Branch kandidat: `codex/schedule-rounds-calendar`; working tree/index root dipertahankan.
- Source slice dan kontrak: [SCHEDULE_ROUNDS_CALENDAR_LOCAL.md](SCHEDULE_ROUNDS_CALENDAR_LOCAL.md). Enam dokumen root hanya mendapat catatan slice, tanpa menimpa perubahan rilis keamanan main.
- Dependency, lockfile, konfigurasi production dan image infrastruktur main dipertahankan. CI existing ditambah pemanggilan regresi babak JS; test PostgreSQL memakai tabel TEMP di transaksi rollback, tanpa fixture pertandingan.

## Gate dan bukti

Status source, visual, CI dan aktivasi production wajib dibuktikan terpisah. Bukti lokal tersanitasi berada di `.tmp/schedule-release-20261102/`, bukan di Git.

| Gate | Status checkpoint |
|---|---|
| Fetch/compare origin main dan audit VPS read-only | PASS; baseline cocok, 19 layanan running, Git production bersih |
| Ruang disk saat audit | Sekitar 4,9 GiB bebas (90% terpakai); ukur ulang kebutuhan backup/image sebelum mutasi |
| Regresi handler Go dan empat regresi JS babak/kalender | PASS |
| Persistence PostgreSQL TEMP | PASS; custom, canonical, 50 karakter Unicode dan SQL-looking tersimpan literal, transaksi rollback |
| Lint/typecheck/build kandidat | PASS Admin; PASS Public lint/typecheck dan build image Linux. Standalone Windows sempat EPERM, tanpa mengubah konfigurasi untuk melewatinya |
| Diff/secret/exclusion serta root source/index | PASS; 24 file kandidat, dependency/lockfile tidak berubah, perubahan existing root tetap utuh |
| Visual 390px/1440px light/dark | PASS setelah akses browser pulih: ukuran aktual 390×844 dan 1440×1000 diverifikasi dari DOM, kedua tema tanpa overflow; modal detail dan kartu dua pertandingan existing, console error kosong |
| Commit/push/PR/required CI/merge | Gate source/visual lokal selesai; hasil delivery mengikuti bukti GitHub final SHA |
| Backup baru/off-host/deployment/smoke production | Belum dijalankan; menunggu seluruh gate pradeployment |

## Rencana deployment dan rollback

1. Bukti visual pada ukuran **aktual** tersimpan di direktori evidence `visual/`. Pengaturan viewport dilakukan pada satu panggilan tersendiri sebelum verifikasi DOM; batas tooling sebelumnya telah terselesaikan tanpa melewati pengamanan browser. Pertahankan smoke Admin untuk preset/custom round, draf/fokus dan API untuk count sebelum pagination serta batas hari WIB. Tidak menambah fixture production.
2. Stage hanya file slice tervalidasi, cek diff/secret/exclusion, commit dan push branch; PR ke main harus memiliki semua required check PASS pada SHA final, termasuk CodeQL, dependency review dan image scan/SBOM.
3. Verifikasi ulang SSH known-host ketat, Git production, kapasitas, environment, TLS dan target Compose. Buat backup source/config, database read-only dan Media, checksum, image rollback tiga service, serta salinan off-host terenkripsi. Jangan mencetak secret atau menghapus resource untuk menyediakan ruang.
4. Deploy artifact exact-source linux/amd64 dari CI melalui job server-side dengan `flock`, PID/status/log, dan `up --no-deps` untuk tiga service saja. Jangan menjalankan migrator/bootstrap atau layanan dependency. Validasi `nginx -t`, reload Nginx setelah upstream siap, dan smoke HTTPS dalam job yang sama.
5. Verifikasi 19 layanan, SSO/RBAC, kalender/kartu/API/detail pertandingan, Portal flags dan header/CSP tetap aman. Nama Cabor/lokasi tetap terbaca ketika modul tujuan nonaktif, tanpa membuka akses modul tersebut. Record pertandingan, versi skema, konfigurasi Portal, credential/TLS dan Media tetap dipertahankan.
6. Jika health/smoke gagal, kembalikan source/config dan image **tiga service terdampak**, reload Nginx lalu ulang smoke. Tidak menjalankan schema down atau restore database karena rilis ini tidak memigrasikan/mengubah data.

Commit/PR/image aktif, backup/checksum/off-host, hasil smoke dan rollback aktual hanya boleh dicatat dari bukti setelah eksekusi; checkpoint ini bukan klaim release production selesai.
