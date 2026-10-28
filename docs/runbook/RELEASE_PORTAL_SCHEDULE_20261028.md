# Kandidat rilis Pengelolaan Portal, Jadwal dan keamanan — 28 Oktober 2026

Status: persiapan rilis. Tidak menyatakan production telah berubah. Pedoman canonical tetap DEPLOYMENT_VPS.md.

## Scope dan persetujuan

125 file perubahan awal mencakup Pengelolaan Portal, Rentang Jadwal Cabor, fitur/section Jadwal mandiri, guard UI/Gateway/service/realtime, serta hotfix fokus modal. Working tree existing dipertahankan. Pengguna mengotorisasi remediasi dependency terkait, commit/push/PR/merge setelah CI PASS, deployment, dan dua migrasi additive production setelah backup/checksum. Tidak mengotorisasi hard delete, force push/history rewrite, rotasi credential, perubahan IAM/firewall/DNS, penyalinan data lokal, atau publikasi otomatis pilihan modul.

## Perbaikan security yang wajib dibuktikan

- Public: Next.js/eslint-config-next 16.4.3; Serwist 9.5.13; Zod 4.6.6, follow-redirects 1.16.1 dan source-map-js 1.2.2. Sharp mengikuti persyaratan patched Next.
- Admin: Vite 8.1.6; follow-redirects 1.16.1 dan source-map-js 1.2.2.
- Runtime Admin/edge Nginx: curl dan libcurl minimum 8.23.0-r0 untuk CVE-2026-92392; persyaratan versi mematahkan reuse layer apk upgrade yang sudah usang. Admin memakai npm ci dari lockfile yang diverifikasi pada Linux.
- Prometheus 3.13.3-porprov.2 mempertahankan source upstream yang dipin dan menambah patch golang.org/x/net v0.60.0 untuk CVE-2026-78669. Tidak mengganti konfigurasi, fungsi dashboard, atau major Prometheus.
- User service juga memperbarui x/net ke v0.60.0 beserta dependency pendukung yang dipilih Go MVS. Unit test dan govulncheck dijalankan dengan GOWORK=off; matriks CI memakai isolasi yang sama agar versi dari workspace tidak menutupi graph dependency container. Tidak mengubah role, realm atau data akun.
- Pemeriksaan Dependabot sesudah merge PR #54 menemukan delapan alert Medium GHSA-j6qf-3m9c-vwj3 pada chi. Delapan service pemakai chi memperbarui github.com/go-chi/chi/v5 ke v5.4.0. Pencarian source tidak menemukan pemanggilan ClientIPFromXFF/GetClientIP yang menjadi prasyarat advisory; patch tetap diterapkan tanpa mengubah middleware/otorisasi aplikasi. Verifikasi mencakup test dan govulncheck graph service terisolasi, CI final SHA, serta rebuild/Trivy/SBOM delapan image runtime terdampak. Migrator tidak memakai chi dan tidak memerlukan rebuild karena patch ini.
- Mobile/tooling CI: tetap Expo SDK 57 patch, node-forge 1.4.2, shell-quote 1.12.0, source-map-js 1.2.2, follow-redirects 1.16.1 dan postcss-selector-parser 6.1.5. Override Zod 4.6.6 pada CLI dibuktikan terhadap schema plugin/output/MCP aktual melalui scripts/security/expo-zod-compat.test.mjs; bukan penggantian major SDK.
- Source/CI/builder Go minimum 1.26.10. Digest indeks resmi golang:1.26.10-alpine dan alpine3.24: sha256:a2012b4a1d1f9f7e9f44e0d39b805a901e856b1dd80b4e6ee4338db547050308. Menggantikan minimum operasional 1.26.6 pada baseline sebelumnya.
- Tidak memakai npm audit fix --force, tidak menurunkan threshold, tidak memperpanjang exception lama, dan tidak dismiss alert manual.
- Low deepmerge GHSA-gcqx-w48m-w2h4 pada tooling Expo perlu dicatat bila masih ada: versi/integrity sama dengan baseline dan belum ada versi patched upstream saat audit awal. Paket ini tidak menjadi dependency image VPS. Status/eksposur aktual harus dilaporkan; jangan mengklaim nol vulnerability seluruh mobile hanya dari PASS threshold High.

## Sumber advisory resmi

- https://github.com/advisories/GHSA-2464-fhr4-w9xw
- https://github.com/advisories/GHSA-673q-mjm6-r5xr
- https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
- https://pkg.go.dev/vuln/GO-2026-6809
- https://curl.se/docs/CVE-2026-92392.html
- https://go.dev/doc/devel/release
- https://github.com/advisories/GHSA-gcqx-w48m-w2h4
- https://github.com/advisories/GHSA-j6qf-3m9c-vwj3

Temuan dependency tidak otomatis membuktikan eksploitasi di production. Contoh Next SVG advisory bergantung pada glibc dan use-cache advisory pada pola fungsi tertentu; audit/build runtime dan patch tetap wajib, tanpa exception untuk melewati gate.

## Urutan pra-deployment

1. Verifikasi branch/HEAD/origin dan manifest exact source; lindungi .env, Postman collection, private key, dump, backup, fixture serta artefak build.
2. Audit source, dependency dan targeted tests; CI final SHA meliputi secret check, Web/mobile, seluruh Go, CodeQL dan dependency review. Jangan merge bila required check gagal.
3. Build image release dari exact source, dengan build args production yang telah diverifikasi; rekam image ID/digest, SBOM CycloneDX dan Trivy. Artefak berada di .tmp/ atau backup terproteksi, bukan Git.
4. SSH wajib memakai known_hosts/RejectPolicy ketat. Akses gagal tidak boleh diselesaikan dengan mematikan verifikasi, mengubah password/SSH daemon, atau mencetak credential. Credential SSH tersimpan boleh digunakan hanya melalui kanal in-memory yang aman.
5. Audit VPS read-only: exact source/Compose/project, kesehatan 19 layanan, versi/dirty seluruh database, konfigurasi nama/panjang secret, upload volume, TLS/header, kapasitas, backup dan rollback. Jangan mengasumsikan versi berdasarkan catatan lama.
6. Siapkan backup lengkap production ber-checksum dan listing/validasi restore sebelum mutasi. Pertahankan source/image/env/TLS/volume rollback dan data terbaru. Jangan restore database lama untuk rollback image secara rutin.
7. Rehearsal migrasi terhadap salinan terisolasi; buktikan row bisnis/media tidak berubah, schema dirty=false, dan hak akses baru tidak melemah.

## Dua migrasi yang diotorisasi

| Database | Target | Perubahan |
|---|---|---|
| master_data_db | v16 | portal_configuration, portal_revisions immutable, portal_outbox |
| schedule_db | v6 | schedule_periods, revisi immutable, outbox; tidak mengubah pertandingan/peserta |

Jika versi awal tidak sesuai preflight, tabel sudah ada secara tidak konsisten, dirty=true, atau checksum migrasi/source berbeda: berhenti. Tidak boleh force version, DROP/cascade, down migration atau menimpa data. Data periode dan publikasi konfigurasi lokal tidak dibawa sebagai seed. Baseline production mempertahankan perilaku existing sampai Super Admin mempublikasikan pilihan sendiri.

## Cutover dan verifikasi

Operasi persisten berjalan melalui job server-side ber-flock dengan status, PID, log tersanitasi dan manifest. Bekukan commit, verifikasi checksum artefak/source, jalankan migrasi berurutan lalu recreate layanan terdampak dengan project/volume canonical. Reload Nginx sesudah upstream sehat dalam job sama. Pertahankan layanan proyek lain. Jangan bootstrap/ubah IAM tanpa kebutuhan dan otorisasi spesifik.

Verifikasi Public/Admin/API/OIDC/Media/realtime, portal draft/publish/permission guards, periode tayang, berita/gambar, nonce CSP unik, HSTS tunggal, COOP/COEP/CORP, malformed ID 404, asset dan browser console. Endpoint privat anonim harus ditolak, service internal tidak diekspos. ZAP pasif dibatasi origin canonical; jangan menjalankan attack scan tanpa scope baru. Tidak mengubah data bisnis untuk smoke tanpa fixture teridentifikasi dan rollback.

Rollback image/source/config menjaga volume dan tabel additive. Jika kegagalan memerlukan restore schema/data atau tindakan destruktif lain, hentikan dan minta keputusan eksplisit. Tidak menghapus backup/image/volume/source. Laporkan downtime terukur, exact commit/image/schema, checksum backup, hasil gate, risiko dan pekerjaan tersisa.

## Evidence aktual

Snapshot dan log persiapan berada di .tmp/release-20261028/. Hanya hasil yang sudah dijalankan boleh ditandai PASS. Tiga dokumen referensi DOCX governance masih tidak ditemukan pada audit awal; Markdown canonical menjadi baseline yang dapat diverifikasi. Status Git/CI/SSH/deployment final harus dicatat dalam handoff aktual, tanpa menyamakan build lokal dengan aktivasi production.
