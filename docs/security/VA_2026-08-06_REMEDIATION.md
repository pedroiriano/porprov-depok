# Remediasi VA Public Web - 6 Agustus 2026

## Sumber dan Batas Verifikasi

Sumber adalah laporan ZAP `Porprov Pentest.pdf`, 14 halaman, yang memindai HTTP
dan HTTPS `porprov.depok.go.id`. Laporan mencatat 18 alert: tanpa High, dua
kategori Medium, empat Low, dan dua belas Informational. Analisis ini tidak
mengklaim penetration test manual atau active exploit validation.

## Pemetaan Temuan

| Temuan | Penyebab | Remediasi repository | Status |
|---|---|---|---|
| `script-src unsafe-inline` | CSP host mengizinkan seluruh inline script | Nonce per request dan `strict-dynamic`; production tidak memakai `script-src unsafe-inline` | Lulus smoke lokal; VA ulang pending |
| `style-src unsafe-inline` | CSP host mengizinkan seluruh inline style | `style-src`/`style-src-elem` memakai nonce; residual attribute dibatasi pada `style-src-attr` untuk Next/tema/Leaflet | Lulus build; browser CSP regression pending |
| HSTS hilang pada API | HSTS hanya berasal dari Next.js | HSTS dipindahkan ke blok HTTPS Nginx dengan `always` | Nginx/Compose lokal pending/lulus sesuai laporan quality gate; VPS pending |
| Versi Nginx terlihat | `server_tokens off` tidak ada | Tambahkan `server_tokens off` | VPS pending |
| `X-Powered-By: Next.js` | Default Next.js aktif | `poweredByHeader: false` dan `proxy_hide_header` | Lulus smoke lokal |
| Application Error Disclosure | ID Cabor malformed memicu dependency 400 lalu exception render 500 | Validasi UUID sebelum fetch; 400/404 menjadi not-found | Lulus smoke lokal 404 |
| Potential XSS City Guide | Scanner pasif melihat query pada atribut URL | Allowlist kategori, single-value parsing, integer page terbatas; JSX tetap escaped | Tidak terbukti exploitable; active validation pending |
| Cache directive | Sebagian HTML memperoleh cache sangat panjang | Nonce memaksa dynamic HTML dengan private/no-store | Lulus smoke lokal |

## Bukti Quality Gate Lokal

- `npm run lint`: lulus.
- `npm run build`: lulus pada Next.js 16.2.10; seluruh route HTML berstatus
  dynamic dan metadata statis tetap static.
- Dua request `/venue`: HTTP 200, nonce berbeda, tidak ada
  `script-src unsafe-inline`, tidak ada `X-Powered-By`, dan cache HTML
  `private, no-cache, no-store`.
- Script framework dan `next-themes` membawa nonce response.
- Request payload malformed yang sebelumnya 500 sekarang menghasilkan 404.

## Gate Sebelum Menutup Temuan

1. Review perubahan dan commit exact.
2. Ikuti backup, checksum, job tahan reconnect, serta rollback pada
   `DEPLOYMENT_VPS.md`.
3. Pastikan konfigurasi CSP lama di host tidak menghasilkan duplicate header.
4. Jalankan `nginx -t`, Compose config, dan smoke HTTPS untuk Public, Admin,
   API, OIDC, upload, serta response 4xx/5xx.
5. Jalankan browser regression pada light/dark, Leaflet, Theme toggle, PWA,
   console CSP, dan mobile/desktop.
6. Jalankan ZAP ulang dengan scope dan context yang terdokumentasi.
7. Jangan menandai temuan selesai di production sebelum bukti deployment dan
   scan ulang tersedia.

## ZAP Ulang Setelah Hardening Pertama

Laporan `2026-08-06-ZAP-Report-.pdf` mencatat 0 High, 1 Medium, 3 Low, dan
11 Informational. Dua Medium lama `script-src unsafe-inline` dan
`style-src unsafe-inline` tidak muncul lagi. Medium residual plugin `10038`
hanya mengenai `robots.txt` dan `sitemap.xml` yang masih berupa HTML 404 tanpa
CSP. Low residual berasal dari server HTTP yang belum membawa `nosniff` serta
URL asset encoded/double-slash yang menghasilkan 500 dan memicu alert error dan
timestamp.

Remediasi lanjutan menambahkan route metadata SEO resmi, menjadikan port HTTP
redirect-only dengan header defensif, dan menolak pola URL asset malformed di
Nginx sebagai text/plain 404. Penutupan formal tetap memerlukan build, deployment
VPS, smoke HTTP/HTTPS, dan ZAP konfirmasi baru.

## Bukti Deployment Remediasi Residual

- Commit aplikasi/metadata/edge `e3f9876` dan koreksi raw URI `ca6ba5a` telah
  dideploy ke VPS production.
- HTTP `robots.txt`/`sitemap.xml` memberi 308 dengan CSP restriktif dan
  `X-Content-Type-Options: nosniff`; HTTPS keduanya memberi 200 dengan tipe
  `text/plain` dan `application/xml`.
- Dua URL malformed pada laporan memberi 404 `text/plain`, bukan 500.
- Public, Admin, OIDC, seluruh migrasi, nonce CSP, log kritis, dan checksum
  rollback lulus smoke pascadeploy.
- Penutupan formal alert tetap menunggu ZAP konfirmasi baru dan browser
  regression dengan CSP enforcement.
