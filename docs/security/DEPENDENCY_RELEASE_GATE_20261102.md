# Gate Dependency Rilis Dokumen - 2 November 2026

Status: BLOCKED. Tidak ada exception baru, dismiss, penurunan threshold Low, atau deployment production.

## Temuan dan remediasi kandidat

| Advisory | Graph terdampak | Remediasi | Batas bukti |
|---|---|---|---|
| GHSA-mrwp-f3q8-3g9p | follow-redirects 1.16.1, empat aplikasi | Override/lock 1.16.2 resmi | Regresi header sensitif lintas realm dan redirect lintas origin pada loopback PASS; audit Admin nol seluruh severity |
| GHSA-3g3m-2fjr-6pw4 | glob 13.0.6 pada Public/mobile tooling | Override range terpasang ke 14.0.2 resmi | Pembatalan saat readdir pertama tidak memulai traversal anak; direktori fixture lokal terisolasi |
| GHSA-g3hv-75wg-m249 | minimatch modern 10.2.x dan legacy 3.1.5 pada Public/mobile tooling | Consumer modern 10.2.2 diarahkan ke 11.0.1; glob baru memakai 11.0.4 dari lockfile | Worker bermemori/waktu terbatas untuk amplification PASS; **legacy tetap FAIL** |

Rilis minimatch 11 menghapus `makeRe` serta mengganti export CommonJS callable menjadi object. Plugin ESLint saat ini masih memakai callable dan `makeRe` (misalnya eslint-plugin-import/no-internal-modules). Override global ke 11 akan merusak kontrak tersebut. Advisory mencantumkan seluruh versi sebelum 11.0.1; tidak dibuat pengecualian berdasarkan dugaan tidak terpakainya jalur tertentu pada legacy. Solusi lanjutan harus mempunyai backport resmi atau adapter yang mempertahankan seluruh kontrak consumer dan membuktikan keamanan, bukan mengganti nama/version untuk menghindari scanner.

Lockfile mempertahankan dependency opsional lintas platform dan metadata yang tidak terkait; tidak memakai audit fix --force, memperbarui framework, atau menjalankan hook install untuk remediasi lokal. Source/runtimes root existing dipertahankan; kandidat berada pada checkout Git terisolasi.

## Verifikasi terarah

- `scripts/security/release-dependency-compat.test.mjs`: tiga regresi melalui dependency terpasang Public dan mobile Admin, enam PASS. CI menjalankannya pada empat aplikasi sebelum audit.
- Public lint/typecheck dan mobile Admin lint/Expo compatibility PASS pada kandidat patch. Bukti ini tidak menggantikan build/export, image/SBOM/Trivy dan required CI pada SHA final.
- Audit Admin: nol Critical/High/Moderate/Low. Audit Public dan dua mobile: masih FAIL GHSA-g3hv-75wg-m249 legacy; gate tetap fail-closed.
- CI awal commit a891687: 29 check PASS, empat job audit FAIL. Hasil awal bukan clearance untuk commit berikutnya atau production.
- SSH key dan satu credential tersimpan ditolak; tidak ada perubahan Nginx/config/database production. Acceptance browser lokal terblokir pengaturan Work; tidak diklaim PASS.

## Sumber primer

- https://github.com/advisories/GHSA-mrwp-f3q8-3g9p
- https://github.com/advisories/GHSA-3g3m-2fjr-6pw4
- https://github.com/advisories/GHSA-g3hv-75wg-m249
- Paket resmi registry.npmjs.org: follow-redirects 1.16.2, glob 14.0.2, minimatch 11.0.1/11.0.4; integritas tarball tercatat pada lockfile.
