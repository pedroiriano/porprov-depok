# Release Manifest Tahap 17

## Status dan batas

Dokumen ini menetapkan kontrak kandidat production readiness yang dimulai dari
`origin/main` commit `7681ef3fdfec618b73ac6f16aa49ae546b5caafa` pada branch
`codex/production-readiness-v17`. Commit release immutable adalah commit hasil
merge PR Tahap 17B dan harus direkam bersama digest image pada manifest
operasional ber-checksum sebelum transfer ke VPS.

Tahap 17B hanya mengizinkan remediasi, Git delivery, pembuatan artefak, backup,
staging sibling directory, konfigurasi staged, dan latihan migrasi terisolasi.
Tahap ini tidak mengizinkan load image, pergantian source aktif, Compose up,
restart, migrasi/bootstrap production, reload Nginx, atau perubahan data.

## Target build dan migrasi

| Area | Target |
|---|---|
| Admin production | Cuba clean-room, `VITE_ADMIN_CUBA_PHASE_1=true` |
| Rollback Admin | Build ulang dengan `VITE_ADMIN_CUBA_PHASE_1=false` |
| Platform image | `linux/amd64` |
| User migration | 2 → 5 |
| Master Data migration | 11 → 15 |
| Audit migration | 2 → 3 |
| Venue/Schedule/LiveScore/Medal | Tetap 3/5/1/3 |

## Gate wajib sebelum cutover

- GitHub required checks, CodeQL, dependency review, secret scan, dependency
  audit, container gate, dan quality gate relevan PASS pada commit final.
- Tepat 21 image buatan repository memiliki digest, SBOM CycloneDX, dan hasil
  Trivy tanpa High/Critical fixable; arsip dan manifest SHA-256 tervalidasi.
- Backup baru mencakup source aktif beserta dirty diff/untracked, delapan
  database, Media Library, NATS, Redis, `.env`, TLS, Nginx, Prometheus, dan
  Grafana; validasi checksum lokal target dan salinan terenkripsi off-host PASS.
- Environment staged memiliki secret backend/Redis kuat, release SHA, URL
  same-origin, serta credential Berita Depok server-only tanpa membocorkan nilai.
- Source staged berada pada sibling directory dan Compose project `docker`
  tervalidasi tanpa mengubah checkout/runtime aktif.
- Latihan restore/migrasi terisolasi membuktikan jumlah data, pin City Guide,
  Media Library, serta role Keycloak tetap benar.

Kegagalan salah satu gate menghasilkan `BLOCKED_PRE_CUTOVER`; cutover hanya
dapat dibuka oleh persetujuan eksplisit baru.

## Rollback yang dipertahankan

- Source aktif VPS dan seluruh perubahan lokalnya disimpan dalam backup baru.
- Database, volume/data service, konfigurasi, TLS, serta observability tidak
  dihapus dan tidak dimutasi pada tahap staging.
- Admin Techwind dapat dipulihkan melalui build flag `false` tanpa membuat
  full-stack kedua.
