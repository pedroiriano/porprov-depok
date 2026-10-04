# Exception terbatas braces — 4 Oktober 2026

## Persetujuan dan batas

Pengguna menyetujui `GHSA-vfj7-8cjw-p6xm` pada `braces` 3.0.3 hanya untuk
`apps/public-web-nextjs`, `apps/mobile-public-react-native`, dan
`apps/mobile-admin-react-native`, setelah bukti build/lint-only PASS.
Exception berakhir **7 Oktober 2026 pukul 23:59:59 WIB**; CI otomatis gagal
mulai 8 Oktober 00:00 WIB. Admin Web tidak mendapat exception ini.

[Advisory resmi](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
mencatat stack exhaustion dari pola brace bersarang, versi terdampak
`<=3.0.3`, dan belum ada versi patched pada verifikasi 4 Oktober.
Ini penerimaan risiko sementara, bukan klaim vulnerability telah ditambal.

## Bukti terbatas pada tooling

- Public: lockfile menandai rantai `@next/eslint-plugin-next` → `fast-glob`
  → `micromatch` → `braces` sebagai development dependency. Source aplikasi
  tidak mengimpor paket tersebut. Pemeriksaan rekursif `/app/node_modules`
  pada image standalone lokal tidak menemukan direktori `braces`.
- Kedua mobile: rantai Metro file-map, Chokidar, dan Tailwind menjalankan
  glob file build/lint. Tailwind hanya memakai pola source tetap
  `./src/**/*.{js,jsx,ts,tsx}`; tidak menerima pola dari API/upload/pengguna.
- Ekspor aktual Android, iOS, dan Web dengan source map pada kedua mobile
  selesai PASS 4 Oktober. Enam source map diperiksa dan **nol** sumber
  `node_modules/braces`, `micromatch`, atau `fast-glob` masuk artifact runtime.
  Bukti lokal berada pada `.tmp/ui-theme-20261004/mobile-{public,admin}-build-proof`
  (ignored; bukan file release/repository).
- CI memeriksa artifact Public standalone serta source map ekspor mobile
  melalui `scripts/security/check-build-only-dependencies.mjs`. Perubahan
  yang membawa dependency tooling tersebut ke runtime langsung gagal.

## Enforcement dan mitigasi

- Audit tetap mencakup development/build dependencies; hasil High tidak
  dihapus dari laporan dan tidak memakai `--omit=dev` atau `audit fix --force`.
- Web mempertahankan threshold **Moderate**, mobile **High**. Setiap advisory
  diperiksa sendiri dengan ID, package, project, severity, dan expiry exact.
  Advisory lain pada package/tree yang sama tetap memblokir CI.
- Unit test menguji scope tiga aplikasi, penolakan Admin, expiry WIB,
  severity Critical, advisory lain, Moderate Web, alias transitif,
  bukti tidak lengkap, dan input policy invalid.
- Build/release hanya memakai source review dan input repository tepercaya;
  jangan memasukkan pola glob dari request HTTP, upload, atau dataset eksternal.
  CI tidak boleh memberi secret production kepada checkout tidak tepercaya.
- Exception langsung tidak sah jika runtime proof gagal, input menjadi tidak
  tepercaya, atau patched release kompatibel tersedia. Evaluasi upstream dan
  tutup exception sebelum expiry; jangan memperpanjang tanpa persetujuan baru.
- Exception mobile `node-forge` existing sampai 16 Oktober dan kontingensi
  `image-size` sampai 7 Oktober tetap terpisah; persetujuan ini tidak
  mengubah ID, expiry, atau scope keduanya.

## Status delivery

Source policy dan bukti lokal bukan bukti CI/merge/deployment. PR #52 wajib
seluruh check PASS pada SHA final sebelum merge; deployment tetap hanya
Public Web dan reload Nginx dengan backup/checksum/smoke/rollback.
