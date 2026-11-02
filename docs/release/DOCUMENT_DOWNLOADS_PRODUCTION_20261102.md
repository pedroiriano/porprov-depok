# Kandidat Deployment Dokumen dan Unduhan â€” 2 November 2026

Status: PREPARED â€” belum deployment production.

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

## Blocker akses yang sudah terbukti

2 November: SSH key `porprov_deploy` ditolak; satu percobaan credential DPAPI tersimpan melalui OpenSSH askpass juga ditolak. Status helper membuktikan credential terkirim sebagai UTF-8 tanpa nilai credential dicetak. Tidak ada perubahan production yang telah dilakukan. Tidak ada percobaan password berulang/brute force atau pelonggaran host key. Deployment menunggu akses autentik yang dipulihkan operator.

Browser lokal Work dinonaktifkan; acceptance visual tahap Unduhan belum dilakukan. HTTP/source/SQL lokal PASS bukan bukti browser production atau go-live PASS.

Rujukan konfigurasi CodeQL Go manual: https://docs.github.com/en/code-security/reference/code-scanning/codeql/build-options-for-compiled-languages

## Gate dependency

Hasil awal PR #60 pada `a891687c4b57e8cffb2f99094a03c72672ca3bf3`: 29 check PASS dan empat job Web/mobile FAIL pada audit npm. Remediasi berikutnya memakai follow-redirects 1.16.2, glob 14.0.2 serta matcher modern patched; matcher legacy 3.1.5 masih diblokir GHSA-g3hv-75wg-m249. Tidak ada exception, downgrade, atau pengubahan API legacy secara buta. Bukti dan batas kompatibilitas: `docs/security/DEPENDENCY_RELEASE_GATE_20261102.md`. Artefak awal tidak boleh dipakai untuk source yang sudah berubah; gate wajib pada SHA final.
