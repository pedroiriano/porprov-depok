# Exception npm audit `image-size` — 7 September 2026

## Keputusan

Dua advisory High berikut diotorisasi sebagai exception kontingensi hanya untuk aplikasi React Native PORPROV sampai 7 Oktober 2026:

- `GHSA-5p2g-fcmc-qvqq`
- `GHSA-w3rx-r6r6-pgpr`

Exception dibatasi pada package `image-size` di `apps/mobile-public-react-native` dan `apps/mobile-admin-react-native`. Tidak ada advisory Critical atau High lain yang diizinkan.

Lockfile final memakai Metro 0.84.5 dan tidak lagi memuat `image-size`, sehingga exception tidak sedang dikonsumsi: audit aktif kedua aplikasi adalah 0 Critical, 0 High, dan 14 Moderate. Allowlist bertanggal tetap dipertahankan sesuai persetujuan eksplisit sebagai proteksi kontingensi terhadap variasi resolver selama periode transisi.

## Alasan dan ruang lingkup

Pada audit awal 7 September 2026, registry npm hanya menyediakan `image-size` sampai 2.0.2 dan advisory GitHub belum mencantumkan versi yang telah diperbaiki. Dependency hadir transitif melalui Metro 0.84.4 pada Expo SDK 57 dan digunakan ketika membangun asset yang berada di repository; regenerasi lockfile bersih memilih Metro 0.84.5 yang menghapus jalur aktif tersebut. Hasil export aplikasi tidak memuat package itu sebagai dependency runtime.

Risiko utamanya adalah denial of service pada proses build jika parser menerima file ICNS, JXL, atau HEIF berbahaya. Repository membatasi mitigasi dengan source review, secret scan, lockfile, input asset terkontrol, serta exception exact-ID yang otomatis gagal setelah tanggal kedaluwarsa.

## Enforcement

`scripts/security/check-npm-audit.mjs` menjalankan audit penuh dan hanya menerima dua advisory exact di atas untuk dua project exact. Semua temuan Critical/High lain, exception salah scope, dan exception kedaluwarsa menggagalkan CI.

Exception wajib dihapus paling lambat 7 Oktober 2026. Removal lebih awal dilakukan apabila baseline Metro 0.84.5 telah stabil pada protected CI dan pengguna menyetujui penutupan kontingensi. Exception juga langsung menjadi tidak sah apabila salah satu kondisi berikut terpenuhi:

1. `image-size` menerbitkan versi aman yang kompatibel.
2. Package terbukti masuk ke bundle runtime.
3. Scope input asset tidak lagi terbatas pada source tepercaya.
4. Enforcement exact-ID, exact-package, exact-project, atau expiry tidak dapat dipertahankan.

Tidak diizinkan memakai `npm audit fix --force`, downgrade Expo, canary, atau fork tidak resmi untuk menutup exception ini.
