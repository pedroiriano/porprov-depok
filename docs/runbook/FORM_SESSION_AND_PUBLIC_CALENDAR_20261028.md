# Perbaikan form Admin dan kalender rentang Public — 28 Oktober 2026

Status source/CI, runtime lokal dan production dibuktikan terpisah pada evidence `.tmp/session-calendar-20261028/`. Tidak menjalankan migrasi, bootstrap, publikasi modul, atau perubahan data domain untuk fitur ini.

## Form dan pembaruan sesi

Provider otorisasi mempertahankan subtree yang telah terverifikasi hanya untuk identitas issuer/subject yang sama. Pergantian token langsung menyalakan penghalang interaksi global sebelum pemeriksaan selesai, termasuk modal yang berada di portal DOM. Subtree tidak dilepas selama silent renewal atau kegagalan jaringan yang dapat dicoba ulang; input, fokus/kursor dan draf tetap ada. Ini bukan izin menggunakan permission usang untuk mutasi: event pengguna diblokir sementara dan API Gateway/service tetap memeriksa JWT, status akun, serta izin terbaru.

Respons 401/403, akun tidak aktif dan pencabutan izin tetap fail-closed; identitas berbeda langsung dimask dan respons request lama dibatalkan/diabaikan. Pemeriksaan gagal tidak memberikan akses. Sesi yang benar-benar berakhir tetap meminta login. Modal tidak menginisialisasi ulang baseline/versi draf hanya karena token berubah; unmount sungguhan menyimpan salinan lokal actor-scoped yang telah disanitasi, tanpa password/token/file mentah. Draf tetap mempunyai masa berlaku dan kebijakan konflik existing.

Regression test memakai provider, ModalForm, focus hook dan sanitizer aktual dalam DOM, dengan network/storage terisolasi: renewal berulang, state/fokus/caret, submit saat pending, baseline/versi draf, network retry, revocation, akun nonaktif, pergantian actor, serta stale response. jsdom hanya devDependency pengujian dan tidak boleh masuk runtime bundle.

## Kalender Web Publik

Hanya bagian Rentang Pelaksanaan pada `/jadwal`; tabel/form pengelolaan Admin serta rincian pertandingan existing tidak diganti. Daftar Kartu tetap default. Pilihan Kalender menyediakan bulan sebelumnya/berikutnya, penanda hari ini, warna grup konsisten, title hover/ringkasan aksesibel, detail klik native dialog, Escape/penutupan luar, focus restoration dan penguncian scroll background dengan class tanpa inline style.

Grup adalah pasangan `cabor_id` dan Nama Khusus yang dinormalisasi. Nama Khusus terisi menjadi sub-Cabor berbeda; warna tidak menjadi satu-satunya pembeda. Teks/notes dirender sebagai teks React, bukan HTML mentah. Tanggal adalah tanggal inklusif Indonesia; overlap dua bulan/tahun dan tahun kabisat harus tepat.

API additive `GET /schedule/periods?month=YYYY-MM` (juga tersedia pada manage) memvalidasi tahun 2000–2100, memakai parameter SQL terikat, mempertahankan pagination maksimal 100, serta mengembalikan `calendar.month` dan `calendar.day_counts`. Count per tanggal mencakup semua hasil dengan filter yang sama pada snapshot SQL yang sama; detail kalender dibatasi 24 record per halaman. Tidak mengambil seluruh dataset ke browser. Tombol jumlah pada tanggal membuka Daftar Kartu terfilter tanggal, termasuk record dari halaman lain. Draf/arsip dan metadata privat tidak diterbitkan.

## Gate dan rollback

- Unit tanggal/grup, DOM session regression, lint/typecheck dan build Web terdampak.
- SQL integration menggunakan tabel TEMP dalam transaksi yang selalu rollback, menguji rentang lintas bulan/tahun, count lengkap lintas pagination, draft/arsip dan validasi query.
- Audit npm sampai Low, govulncheck Schedule, secret/diff check, image/SBOM/Trivy terdampak, protected CI/CodeQL/dependency review final SHA.
- Browser representatif kalender pada mobile/desktop dan light/dark; catat terpisah fixture terisolasi, browser runtime lokal dan runtime production.
- Sebelum deployment: preflight read-only, backup/checksum/off-host dan image/source rollback. Hanya Admin/Public/Schedule serta reload Nginx; tidak menjalankan compose start dependency, migrasi atau bootstrap. Volume, environment, credential, TLS, publikasi Portal, media dan data domain dipertahankan.
- Rollback image/source tidak membutuhkan schema down karena tidak ada perubahan skema. Tab lama harus memuat versi Admin baru secara wajar; jangan memaksa reload semua pengguna saat form sedang diisi.
