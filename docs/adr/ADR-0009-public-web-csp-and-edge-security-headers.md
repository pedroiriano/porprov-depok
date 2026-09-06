# ADR-0009: Public Web CSP Nonce dan Kepemilikan Header Security Edge

- Status: Accepted
- Tanggal: 6 Agustus 2026
- Tahap: 9 - Security Hardening

## Konteks

VA ZAP terhadap `porprov.depok.go.id` menemukan `script-src 'unsafe-inline'`,
`style-src 'unsafe-inline'`, HSTS yang tidak konsisten pada API, fingerprint
Next.js/Nginx, dan route Cabor malformed yang menghasilkan HTTP 500. Audit
repository menunjukkan HSTS sebelumnya dimiliki Next.js sehingga tidak pernah
diterapkan pada route yang langsung diproksikan Nginx ke API Gateway.

## Keputusan

1. Public Web membuat nonce acak per request melalui konvensi Next.js 16
   `src/proxy.ts`. Nonce diteruskan sebagai `x-nonce` dan menjadi bagian CSP
   request serta response.
2. Semua halaman HTML Public dirender dinamis agar framework dapat memasang
   nonce pada bootstrap, hydration, dan script `next-themes`.
3. Production `script-src` memakai nonce dan `strict-dynamic` tanpa
   `unsafe-inline`. Development boleh menambahkan `unsafe-eval` untuk tooling.
4. `style-src` dan `style-src-elem` memakai nonce. Kebutuhan style attribute
   dinamis Next Image, `next-themes`, dan Leaflet dibatasi pada
   `style-src-attr 'unsafe-inline'`, bukan `style-src 'unsafe-inline'` global.
5. HSTS dimiliki Nginx HTTPS edge dengan `always`. Nginx juga menonaktifkan
   version token, menyembunyikan `X-Powered-By`, dan menambahkan header edge
   konsisten. Next.js menonaktifkan `poweredByHeader` sebagai defense-in-depth.
6. Dynamic identifier divalidasi sebelum dependency call. UUID malformed pada
   detail Cabor menjadi 404 dan tidak boleh menghasilkan render exception 500.
7. Query kategori City Guide memakai allowlist dan page hanya menerima integer
   desimal terbatas sebelum dipakai untuk pagination dan URL.

## Konsekuensi

- HTML Public menjadi dynamic dan memakai `private, no-cache, no-store`; asset
  statis tetap dapat dicache.
- CSP nonce meningkatkan biaya render dan menghilangkan full-page static cache.
- Parallax Hero berbasis mutasi inline style diganti gambar responsif tanpa
  mutasi style agar sesuai CSP.
- Style attribute tetap merupakan residual terkontrol karena kebutuhan library.
  Penghapusannya memerlukan penggantian atau fork CSP-compatible atas Leaflet,
  Next Image behavior, dan theme runtime.
- Konfigurasi CSP ad-hoc pada host harus dihapus saat deployment agar tidak ada
  dua header CSP yang saling berkonflik; file Git canonical menjadi sumbernya.

## Quality Gate

- Public Web lint dan production build.
- Dua response HTML harus mempunyai nonce berbeda.
- Semua script bootstrap, termasuk `next-themes`, mempunyai nonce yang sama
  dengan CSP response.
- `script-src` tidak memuat `unsafe-inline`.
- `X-Powered-By` tidak ada.
- URL Cabor malformed menghasilkan 404, bukan 500.
- Nginx config test dan Compose merged config harus valid.
- Deployment VPS dan VA/ZAP ulang tetap wajib sebelum status production final.
