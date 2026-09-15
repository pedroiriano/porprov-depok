# Remediasi VA ZAP High - 15 September 2026

## Ruang Lingkup

Laporan ZAP eksternal mencatat satu alert High `Path Traversal` (`CWE-22`) pada
`POST /analytics/api/collect`, parameter JSON `payload.title`, dengan nilai uji
`/collect`. Bukti respons pada laporan kosong dan tidak menunjukkan nama file,
isi file, stack trace, maupun operasi filesystem yang berhasil.

## Analisis Akar Masalah

Endpoint sebelumnya meneruskan payload browser langsung ke kolektor internal
Umami. Pada Umami 3.2.0, `title` diperlakukan sebagai judul halaman dan disimpan
sebagai metadata analitik; field tersebut tidak dipakai sebagai path filesystem.
Karena tidak ada eksploitasi file yang terbukti, klasifikasi ZAP merupakan
false positive secara teknis. Meskipun demikian, proxy langsung membuat boundary
validasi PORPROV kurang tegas dan memungkinkan input yang tidak sesuai kontrak
mencapai dependency internal.

## Kontrol Penutupan

1. Nginx meneruskan hanya endpoint koleksi exact ke API Gateway; panel dan API
   Umami lain tetap tidak dipublikasikan.
2. API Gateway mewajibkan POST JSON, Origin/hostname/website allowlist, body
   maksimal 16 KiB, tipe event yang dikenal, serta URL halaman tanpa query,
   fragmen, credential, atau traversal.
3. Judul halaman dibatasi 300 karakter, bebas karakter kontrol, dan menolak
   nilai path/traversal termasuk `/collect`, `../`, backslash, serta encoding
   berlapis.
4. Referrer hanya menerima HTTP(S), membuang query/fragmen, dan field JSON yang
   tidak dikenal ditolak.
5. Request ke Umami dibuat ulang dari field tervalidasi dengan timeout empat
   detik, header minimal, response JSON maksimal 16 KiB, dan error upstream
   tersanitasi. Body request tidak dicatat ke log.
6. Event `event`, `identify`, dan `performance` yang sah tetap diteruskan agar
   fungsi statistik pengunjung tidak berkurang.

## Bukti Verifikasi Lokal

- Unit/regression test seluruh API Gateway: PASS.
- `go vet ./...`: PASS.
- `govulncheck ./...`: PASS, tidak ada vulnerability reachable.
- Secret scan source tracked: PASS.
- Build image API Gateway dan Nginx lokal: PASS.
- `nginx -t`: PASS.
- Payload analitik normal melalui HTTPS lokal: `200`.
- Payload laporan dengan `title=/collect`: `400` dan tidak diteruskan ke Umami.

## Batas Status

Implementasi source dan runtime lokal telah tervalidasi. Aktivasi production
harus tetap melalui commit ter-review, backup/checksum, job server-side ber-lock,
smoke HTTPS, dan scan konfirmasi sesuai `DEPLOYMENT_VPS.md`; laporan sumber tidak
disalin ke repository.
