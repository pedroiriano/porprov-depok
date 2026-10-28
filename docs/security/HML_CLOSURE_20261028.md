# Penutupan dependency/image High, Medium dan Low — 28 Oktober 2026

Status dokumen: kandidat source. Hasil source, image, CI, rehearsal dan aktivasi production dibuktikan terpisah; tidak boleh menganggap semua tahap selesai dari keberadaan dokumen ini.

## Scope perubahan kompatibel

| Komponen | Perbaikan | Kontrak yang dipertahankan |
|---|---|---|
| Public runtime dan builder Web | Node 24.22.1-alpine, digest indeks resmi sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53; zlib minimum 1.3.2-r1 | Next/React, API, nonce CSP, routes, konten dan media tidak berubah |
| PostgreSQL/gosu | moby/sys/user v0.4.1; tag porprov/postgres:15-3.5-porprov.2 | PostgreSQL major 15, PostGIS 3.5, init script, data volume dan schema aplikasi tetap |
| Prometheus | OTel sdk/otlptrace/grpc/http v1.45.0; tag 3.13.3-porprov.3 | Commit upstream Prometheus 3.13.3, scrape config, TSDB, dashboard dan endpoint tetap |
| Tooling Expo SDK 57 | Backport privat deepmerge 4.3.1 pada namespace @porprov/deepmerge-safe, MIT/provenance tersimpan | Tidak mengganti SDK/RN, Metro/app routes, state atau API aplikasi |
| Audit npm | Default/CI Low, ringkasan menyebut Low dan semua severity; unknown/prototype-named severity fail-closed | Exception yang sudah kedaluwarsa tetap kedaluwarsa; tidak ada exception atau dismiss baru |

Node 24.21.0 pada image awal diketahui dari binary aktual. Advisory Node Oktober 2026 mencakup CVE-2026-111497 dan perbaikan DNS/TLS/HTTP lain; pemindaian package container saja tidak cukup untuk mendeteksi seluruh advisory runtime Node. Binary runtime/build dan CI harus minimum 24.22.1; tidak mengganti versi Node global host/proyek lain secara diam-diam.

Advisory zlib adalah CVE-2026-85091. Gosu terkena GHSA-mjcv-p78q-w5fw/CVE-2026-61801. OTel terkena GHSA-8wmf-6v46-5gfg/CVE-2026-81870. Penggunaan aktual dapat membatasi exploitability, tetapi patch tersedia tetap diterapkan.

## Backport tanpa patch upstream

GHSA-gcqx-w48m-w2h4/CVE-2026-93753 belum mempunyai patched version upstream pada saat pemeriksaan. SDK Expo 57 terbaru masih memakai consumer yang bergantung pada deepmerge 4.3.1. Tidak menurunkan versi ke release lama yang rentan, mengganti major SDK, atau mengubah nomor versi upstream semata-mata untuk menghilangkan alert.

`packages/deepmerge-safe` menyimpan source CommonJS dan deklarasi tipe berlisensi MIT dengan provenance/hash upstream. Tiga assignment pada destination diganti menjadi own data properties sehingga setter __proto__ tidak terpanggil. Default merge semantics, simbol, clone, array/custom merge dan .all dipertahankan. Kedua aplikasi menggunakan override lokal; test membandingkan hash implementasi yang benar-benar di-resolve oleh @expo/config, menjalankan PoC returned-prototype serta modifikasi konfigurasi/plugin Expo aktual. Periksa README paket untuk pemeliharaan dan penghapusan backport setelah patch upstream tersedia.

`scripts/security/deepmerge-backport.test.mjs` dan `npm-audit-policy.test.mjs` adalah targeted regression. Instalasi npm ci harus dibuktikan dari lockfile bersih Linux, termasuk optional bindings; source map hasil export harus membuktikan deepmerge/backport tetap di luar runtime mobile. Jangan memasukkan node_modules, fixture, export atau cache ke Git.

## Audit image dan batas klaim

Audit baseline diperluas dari High/Critical fixable menjadi Critical/High/Medium/Low termasuk unfixed, dengan identitas image production/candidate dicocokkan. Catat CVE per package/target serta distinct advisory; jumlah instance dependency bukan jumlah celah yang terbukti dapat dieksploitasi.

21 image repository dan lima image vendor production merupakan dua scope berbeda. Audit tambahan menemukan dependency pada image vendor lama yang belum tercakup gate 21 image. Root image/tag/digest, raw report dan matriks terperinci berada di `.tmp/security-closure-20261028/`, bukan laporan berisi credential/data bisnis di Git. ZAP pasif anonymous yang nol High/Medium/Low tidak menggantikan dependency/runtime scan, authenticated authorization, atau pentest aktif.

Kandidat vendor disiapkan sebagai berikut: Keycloak 26.8.1; Grafana OSS 12.4.14 melalui repository resmi grafana/grafana (grafana-oss berhenti diperbarui sejak 12.4); NATS 2.15.2; Redis 7-alpine yang dipin digest; Umami 3.4.1. Ini kandidat audit/rehearsal, bukan izin menyalakan versi tersebut pada production. Release terbaru juga harus discan dan dianalisis; jangan menganggap latest otomatis nol temuan atau mengganti runtime sehat sebelum gate lulus.

## Gate delivery dan deployment

1. Review/stage hanya file scoped; secret/diff check, targeted regression, Web/mobile compatibility, artifact build serta protected CI/CodeQL/dependency review pada SHA final. Jangan mengulang full local suite yang sudah PASS tanpa perubahan terkait.
2. Image repo terdampak: build terpin dan SBOM, Trivy seluruh severity tanpa ignore-unfixed. Image/vendor yang unchanged dapat memakai bukti exact identity yang sudah lengkap; perubahan binary/base memerlukan scan baru.
3. Production: preflight read-only, source/dirty/health/capacity, backup/checksum/source/image/volume rollback, off-host terenkripsi dan restore/rehearsal. Pertahankan pilihan Portal dan data production; tidak menyalin draf/publikasi lokal.
4. Patch kompatibel yang sudah diotorisasi dapat diteruskan setelah seluruh gate terkait PASS. Upgrade major Keycloak/Grafana dan migrasi internal tambahan belum menjadi bagian dari dua migrasi Master v16/Schedule v6 yang telah selesai; siapkan kandidat/latihan terisolasi dan minta keputusan production yang spesifik.
5. Semua cutover memakai project/volume existing, server-side flock/PID/status/log tersanitasi, reload Nginx setelah upstream berubah, smoke HTTPS/API/SSO/RBAC/realtime/media, fingerprint data, dan rollback yang tidak menghapus volume. Tidak mengubah credential/IAM/SSH server atau schema/data secara destruktif tanpa persetujuan baru.
6. Temuan tanpa patch atau tindakan yang belum diotorisasi harus dilaporkan BLOCKED dengan bukti/mitigasi dan keputusan berikutnya. Tidak menyembunyikan finding, mengubah metadata scanner agar tampak nol, atau menjanjikan tidak ada vulnerability di luar scope.

## Sumber primer

- https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
- https://security.alpinelinux.org/vuln/CVE-2026-85091
- https://github.com/moby/sys/security/advisories/GHSA-mjcv-p78q-w5fw
- https://github.com/open-telemetry/opentelemetry-go/security/advisories/GHSA-8wmf-6v46-5gfg
- https://github.com/advisories/GHSA-gcqx-w48m-w2h4
- https://github.com/TehShrike/deepmerge/issues/273
- https://docs.expo.dev/versions/v57.0.0/
- https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/
