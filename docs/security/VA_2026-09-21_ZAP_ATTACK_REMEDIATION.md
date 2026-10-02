# Remediasi VA ZAP Attack - 21 September 2026

## Ringkasan

Laporan ZAP Attack 21 September 2026 mencatat 2 High, 2 Medium, 3 Low, dan
7 Informational. Triage ulang memisahkan temuan origin PORPROV dari respons
pihak ketiga yang ikut tertangkap browser agar hardening tetap akurat dan tidak
mengorbankan fitur.

| Risiko laporan | Triage | Remediasi |
|---|---|---|
| High Path Traversal pada `payload.url` kolektor analitik | Tidak ada bukti akses filesystem; `/collect` sebelumnya masih lolos sebagai URL halaman yang valid | Path internal `/collect`, `/api`, dan `/analytics` beserta turunannya ditolak deterministik sebelum request diteruskan ke Umami |
| High SQL Injection pada `payload.screen` | Nilai SQL sudah ditolak regex resolusi layar; perbedaan body error dinamis memicu pembandingan boolean scanner | Seluruh error validasi kolektor kini memakai body deterministik tanpa timestamp/request ID; regresi membuktikan varian true/false sama-sama `400` dan tidak mencapai upstream |
| Medium Cross-Domain Misconfiguration | Seluruh instance berasal dari OpenStreetMap dan `unpkg`, bukan response origin PORPROV | Ikon Leaflet dipin dan dilayani same-origin; OpenStreetMap tetap dependency peta yang disengaja dengan CORS publik |
| Medium SRI Missing | Instance adalah preload gambar dinamis same-origin, bukan script/style pihak ketiga | Gambar grid Cabang Olahraga memakai lazy loading sehingga preload spekulatif tidak dibuat tanpa menghilangkan konten |
| Low server disclosure, HSTS, dan `nosniff` | Seluruh instance berasal dari endpoint Google/OpenStreetMap | Header origin PORPROV tetap diverifikasi terpisah: HSTS, `nosniff`, CSP, COOP, COEP, dan CORP aktif |

Informational local storage hanya menyimpan preferensi tema `light`/`dark` dan
tidak menyimpan token atau identitas pengguna.

## Kontrol yang Diterapkan

- Kolektor analitik hanya menerima path halaman publik, bukan endpoint internal.
- Error validasi kolektor stabil, `no-store`, dan tidak membocorkan detail.
- Payload mirip SQL pada `screen` ditolak sebelum upstream dengan respons identik.
- Aset marker Leaflet dilayani same-origin dan `unpkg.com` dihapus dari CSP.
- Gambar Cabang Olahraga tetap tersedia dengan lazy loading dan decoding async.
- Gate dependency menaikkan Next.js ke `16.3.8`, Axios ke `1.20.0`, dan
  transitive `brace-expansion` ke versi patched; runtime API Gateway juga
  menjalankan pembaruan paket keamanan Alpine saat image dibangun.
- Advisory `GHSA-86w9-cpqp-85rv` pada `node-forge` belum mempunyai rilis
  patched. Dependency hanya berada pada Expo CLI code-signing tooling, tidak
  masuk runtime Web/VPS maupun bundle mobile, dan diberi exception terbatas
  sampai 16 Oktober 2026 agar upstream wajib dievaluasi ulang.

## Kriteria Verifikasi

- Event analitik normal tetap `200`.
- `payload.url=/collect` dan path internal lain menghasilkan `400`.
- Dua varian payload boolean SQL menghasilkan status dan body identik.
- Tidak ada request marker Leaflet ke `unpkg.com`.
- Tidak ada preload dinamis `/uploads/` pada halaman Cabang Olahraga.
- Pemindaian ulang harus dibatasi pada origin PORPROV; respons pihak ketiga
  dilaporkan terpisah dan tidak boleh dinyatakan sebagai celah server PORPROV.

Status deployment harus dilaporkan terpisah dari status source dan hanya boleh
dianggap selesai setelah CI, backup, deployment terkontrol, smoke test, dan
rescan origin production lulus.
