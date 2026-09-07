# ADR-0009 — Security Hardening dan Production Gates

- Status: Accepted
- Tanggal: 4 Agustus 2026

## Konteks

Laporan ZAP 29 Juli 2026 dan validasi pasif production menemukan CSP belum
tersedia, header HSTS tidak konsisten, versi Nginx/Next.js terekspos, cache
LiveScore terlalu panjang, serta error upstream yang berpotensi membocorkan
detail. Audit dependency menemukan advisory reachable pada JavaScript dan Go.
Sebuah helper SSH berkredensial juga pernah masuk histori Git.

Baseline ulang 10 Agustus 2026 kemudian menemukan residu satu Medium pada
`style-src 'unsafe-inline'` Admin dan empat Low: COOP/COEP/CORP belum memenuhi
site isolation serta error disclosure dari ID Venue malformed.

VA lanjutan 10 Agustus 2026 pukul 14.18 menemukan satu jenis Medium dengan dua
instance Cross-Domain Misconfiguration serta satu Low HSTS. Ketiganya berasal
dari `fonts.googleapis.com`/`fonts.gstatic.com` yang dirayapi karena CSS
Techwind masih memuat Google Fonts, bukan dari header origin PORPROV.

## Keputusan

1. Nginx production menjadi normalizer header keamanan untuk Public, Admin,
   API, Upload, dan OIDC. Edge menyembunyikan CSP upstream lalu menerbitkan
   tepat satu kebijakan: CSP nonce Next.js dipertahankan hanya bila lengkap,
   sedangkan Admin/API/Upload/Keycloak dan upstream tidak lengkap memakai
   fallback edge.
   Redirect HTTP juga mendapat CSP deny-all lengkap. `base-uri`, `form-action`,
   dan `frame-ancestors` selalu eksplisit karena tidak fallback ke
   `default-src`.
2. Public membentuk nonce kriptografis unik per response di `src/proxy.ts`,
   memakai `strict-dynamic`, dan melarang script attribute. Public/Admin
   development menerapkan header ekuivalen agar regresi CSP dapat ditemukan
   sebelum deployment. Next.js tidak menerbitkan `X-Powered-By` maupun HSTS;
   HSTS production hanya dimiliki edge.
3. LiveScore, Admin, dan API memakai `Cache-Control: no-store`; file upload
   publik dapat di-cache singkat sebagai konten pasif.
4. API Gateway mengganti seluruh body error upstream `5xx` dengan kontrak JSON
   stabil tanpa detail database atau jaringan internal.
5. Production Compose memakai secret wajib, origin canonical, container
   read-only/no-new-privileges/capability minimum, dan commit exact.
6. Deployment wajib membuat backup database, Media Library, TLS, konfigurasi,
   dan checksum sebelum rebuild serta menjalankan smoke test HTTPS sesudahnya.
7. Git memakai CODEOWNERS, Dependabot, CodeQL, dependency audit, govulncheck,
   dan pemeriksaan credential literal. GitHub Actions dipin ke commit SHA.
8. Runtime Go dipin ke 1.26.6 dan `golang.org/x/text` minimal 0.39.0. Audit npm
   production harus menghasilkan nol vulnerability sebelum release.
9. CSP Admin production melarang `'unsafe-inline'` pada `style-src`. Edge
   menetapkan COOP `same-origin`, COEP `require-corp`, dan CORP `same-origin`
   pada seluruh HTTPS. Tile/icon Leaflet dimuat dengan CORS eksplisit agar
   isolasi tidak mematikan peta.
10. Route detail Public memvalidasi UUID canonical sebelum request API; ID
    malformed wajib `404`, bukan `500`. Regression probe dan ZAP baseline pasif
    wajib dijalankan ulang setelah deploy.
11. Font UI Public/Admin di-self-host dari package exact
    `@fontsource-variable/nunito` 5.3.0, mencakup normal dan italic. Import CSS,
    HTML, bundle, network runtime, dan CSP production tidak boleh bergantung
    pada Google Fonts. Perubahan stylesheet statis memakai versioned URL untuk
    memutus cache lama.

## Konsekuensi

- Public production memakai CSP nonce Next.js bila tersedia; fallback edge
  tetap kompatibel dengan bootstrap/hydration dan hanya dipakai bila upstream
  tidak menerbitkan CSP. Style attribute Public yang dibutuhkan tetap dibatasi
  terpisah oleh `style-src-attr`, sedangkan Admin tidak lagi memperlebar
  `style-src` dan script inline dibatasi nonce per response.
- Deployment `external-font-hardening-20260810T075510Z` menyimpan source backup
  dan rollback image Public/Admin/Nginx serta merekreasi Nginx setelah frontend
  untuk mencegah stale Docker upstream. ZAP baseline 2.17.0 job
  `zap-font-rescan-20260810T075753Z` pada 10 Agustus 2026 memeriksa 292 endpoint
  dan mengonfirmasi `0 High / 0 Medium / 0 Low`; tujuh jenis Informational tetap
  dicatat.
  Hasil pasif anonim ini tidak menggantikan active/authenticated scan.
- `.htaccess` tidak dipakai karena runtime canonical adalah Nginx. Menambah
  kebijakan Apache yang tidak pernah dieksekusi akan menciptakan sumber
  kebenaran palsu.
- Secret yang sudah pernah masuk Git tetap harus dirotasi dan histori perlu
  direwrite secara terkoordinasi. Penghapusan file dari branch aktif tidak
  membatalkan credential lama.
- Container read-only dan rate limit wajib diuji di staging/production dengan
  rollback; perubahan tidak boleh diklaim aktif hanya karena source tersedia.
