# Exception npm audit `image-size` — 7 September 2026

## Keputusan

Dua advisory High berikut diterima sementara hanya untuk aplikasi React Native PORPROV sampai 7 Oktober 2026:

- `GHSA-5p2g-fcmc-qvqq`
- `GHSA-w3rx-r6r6-pgpr`

Exception dibatasi pada package `image-size` di `apps/mobile-public-react-native` dan `apps/mobile-admin-react-native`. Tidak ada advisory Critical atau High lain yang diizinkan.

## Alasan dan ruang lingkup

Pada 7 September 2026, registry npm hanya menyediakan `image-size` sampai 2.0.2 dan advisory GitHub belum mencantumkan versi yang telah diperbaiki. Dependency hadir transitif melalui Metro pada Expo SDK 57 dan digunakan ketika membangun asset yang berada di repository; hasil export aplikasi tidak memuat package tersebut sebagai dependency runtime.

Risiko utamanya adalah denial of service pada proses build jika parser menerima file ICNS, JXL, atau HEIF berbahaya. Repository membatasi mitigasi dengan source review, secret scan, lockfile, input asset terkontrol, serta exception exact-ID yang otomatis gagal setelah tanggal kedaluwarsa.

## Enforcement

`scripts/security/check-npm-audit.mjs` menjalankan audit penuh dan hanya menerima dua advisory exact di atas untuk dua project exact. Semua temuan Critical/High lain, exception salah scope, dan exception kedaluwarsa menggagalkan CI.

Exception harus dihapus lebih awal apabila salah satu kondisi berikut terpenuhi:

1. `image-size` menerbitkan versi aman yang kompatibel.
2. Expo/Metro menghapus jalur dependency tersebut.
3. Package terbukti masuk ke bundle runtime.
4. Scope input asset tidak lagi terbatas pada source tepercaya.

Tidak diizinkan memakai `npm audit fix --force`, downgrade Expo, canary, atau fork tidak resmi untuk menutup exception ini.
