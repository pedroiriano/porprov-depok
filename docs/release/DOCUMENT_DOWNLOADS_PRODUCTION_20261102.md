# Kandidat Deployment Dokumen dan Unduhan - 2 November 2026

Status: GATE_FINAL_PENDING - belum merge/deployment production.

Pengguna mengotorisasi Git delivery/gate keamanan, akses VPS, backup, migrasi additive yang dibutuhkan, deployment terkontrol dan verifikasi. Otorisasi tidak menurunkan TLS/SSH/JWT/CSP, tidak mengizinkan publikasi otomatis dokumen privat, penghapusan resource, penyalinan data lokal ke production atau bypass required CI.

## Kandidat

Dokumen Admin (MIME/ukuran dinamis, default PDF 50 MiB), Unduhan Public/tabel/ZIP dan satu sematan. Kontrak analitik berasal dari commit 3d66af9: input tidak sah 4xx deterministik/no-store. Perubahan dirty root yang mengembalikan payload ditolak sebagai 200 dan menaikkan rate limit analitik **dikecualikan**. Nginx mempertahankan analitik 10r/s burst 30; hanya lokasi exact dokumen mendapat envelope 101 MiB, sementara handler menegakkan policy dan hard cap. CSP/HSTS/COOP/COEP/CORP/issuer/PKCE/origin tetap.

CI mencakup test/build/lint, audit dependency Low, govulncheck, secret scan, CodeQL JavaScript/Go, dependency review, fixture SQL TEMP dan SBOM/Trivy semua severity pada image terdampak. Artefak production memakai origin canonical `/api/v1`, base Admin `/admin/`, serta source commit/tree dan checksum. Exception/ignore-unfixed/dismiss tidak ditambahkan.

## Gate dan urutan production

1. Semua required CI pada SHA final PASS; bukti browser/visual yang masih tertahan Work harus dilaporkan, bukan diasumsikan lulus.
2. SSH ketat menggunakan known_hosts yang disetujui; preflight read-only memastikan commit/worktree, Compose project/config, disk/RAM, health, schema, data/media dan environment requirement aktual.
3. Backup baru source/config/TLS, seluruh DB, Media/Document volume serta inspeksi/image rollback; checksum dan salinan terenkripsi off-host, serta rehearsal migrasi pada DB terisolasi harus PASS.
4. Verifikasi migration state aktual sebelum menjalankan hanya Master sampai v18 dan User sampai v6. Rencana dari baseline yang diketahui adalah Master v16â†’17â†’18 dan User v5â†’6; jangan menjalankan jika baseline aktual berbeda/dirty tanpa analisis. Tidak ada down migration, bootstrap Keycloak, pengubahan credential atau domain content.
5. Job server-side ber-flock, PID/status/log tersanitasi memverifikasi paket image/commit, memuat image tervalidasi, menjalankan migrasi forward additive, memperbarui source/marker commit dan recreate hanya pembaca registry terkait (Master/Gateway/Schedule/LiveScore/Medal/Venue/Realtime/Public/Admin). User tidak perlu recreate bila hanya seed izin additive. Jangan menjalankan one-shot/bootstrap lain.
6. `nginx -t`, reload Nginx dalam job yang sama, smoke HTTPS Public/Admin/API/OIDC/media/realtime/ACL; anonymous list hanya tayang, privat/arsip tidak dapat diakses, ZIP dibatasi dan input analitik invalid tetap 4xx. Pengaturan dokumen source lokal dan berkas lokal tidak disalin ke production.
7. Verifikasi schema bersih, data/domain existing dan checksum Media, header lengkap/nonce unik, no restart loop, ZAP pasif target-only. Bila aplikasi gagal, kembalikan image/source/config known-good tanpa schema down atau overwrite database yang menerima write baru. Backup dipertahankan.

## Akses dan preflight

SSH pulih setelah service ssh-agent lokal diaktifkan kembali; key tersimpan dapat digunakan tanpa perubahan credential atau konfigurasi production. Host key tetap strict. Preflight read-only membuktikan project `docker` dengan 19 layanan, Master v16/User v5/Schedule v6/Audit v3 clean. Disk tersedia sekitar 7,7 GB pada preflight. Patch Nginx existing diamankan; perbedaan semantik adalah analitik 60r/s/burst100, yang akan kembali ke baseline lebih ketat 10r/s/burst30. Tidak membuat project `porprov-depok` kedua di VPS.

Browser lokal Work dinonaktifkan; acceptance visual tahap Unduhan belum dilakukan. HTTP/source/SQL lokal PASS bukan bukti browser production atau go-live PASS.

Rujukan konfigurasi CodeQL Go manual: https://docs.github.com/en/code-security/reference/code-scanning/codeql/build-options-for-compiled-languages

## Gate dependency

Audit keempat aplikasi kini nol seluruh severity dengan engine matcher resmi patched dan adapter consumer privat, tanpa exception. Source/lockfile/build/export terarah PASS; hasil CI historis yang gagal tidak dipakai sebagai clearance. Bukti dan batas API: `docs/security/DEPENDENCY_RELEASE_GATE_20261102.md`. Artefak deployment wajib cocok dengan SHA final yang CI-nya PASS.
