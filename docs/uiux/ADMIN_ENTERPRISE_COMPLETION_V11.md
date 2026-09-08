# Penerimaan Web Admin Enterprise Tahap 11

## Ruang Lingkup

Tahap 11 melengkapi draf lintas perangkat, riwayat perubahan, RBAC, alur skor
dan medali, media, Bahasa Indonesia, tabel operasional, reliability,
observability, accessibility, kontrak API, serta quality gate Admin Cuba
clean-room. Source/aset vendor tidak dimasukkan.

## Backup dan Migrasi Lokal

Backup berada di lokasi ignored yang tidak masuk Git:

`C:\Datas\Proyek\Aplikasi\porprov-depok\.tmp\tahap11-runtime-backup-20260908T094900`

| Database | Berkas | SHA-256 | Validasi |
|---|---|---|---|
| Master Data | `master_data_db.dump` | `A1B7ADD2D735335A310E54A7DF5BB6AE24E5984CDA0594CA9941BF571BA89E1A` | `pg_restore --list` PASS, 61 entri |
| User Service | `user_service_db.dump` | `0A3C757C23F6C99FE9ABD3481B2BE5EFD767DAE7A140EAFE643E3FCDCBADC006` | `pg_restore --list` PASS, 25 entri |

Migrasi lokal User v3 (`form_drafts`) dan Master Data v14
(`media_derivatives`) PASS. Kedua tabel baru memiliki 0 baris sesudah migrasi;
tidak ada data operasional yang dibuat atau diubah untuk pengujian.

## Matriks Penerimaan

| Area | Kriteria | Status |
|---|---|---|
| Runtime | Layanan terdampak sehat, restart 0, tanpa error baru | PASS |
| Nginx | Sintaks valid dan hash header tidak memperingatkan | PASS |
| Draf | Scope, retensi, sanitasi, konflik optimistis, konkurensi | PASS unit; browser terautentikasi menunggu |
| Media | Signature/dimensi/bomb, checksum, derivative, kompensasi | PASS unit dan migrasi |
| RBAC | Matrix positif/negatif dan anonymous denial | PASS unit dan smoke anonim |
| Tabel | Lima domain server-side, maksimal 100, debounce/cancel/stale guard | PASS unit dan smoke API |
| Bahasa | AST guard user-facing dan whitelist terdokumentasi | PASS |
| OpenAPI | Kontrak JSON OpenAPI 3.1 dapat diparse dan endpoint wajib ada | PASS |
| Visual | 390/768/1440, terang/gelap, route representatif | PASS terautentikasi pada image final |
| CI/DevSecOps | Seluruh protected gate pada SHA final | Menunggu Git delivery |

Uji visual terautentikasi membuktikan tidak ada overflow horizontal pada
viewport 390, 768, dan 1440 piksel. Mode terang dan gelap diuji pada Dasbor,
Data Utama, Log Audit, dan Kesehatan Integrasi. Pemeriksaan visual menemukan
kolom Pelaku dan tombol Rincian pada Log Audit terlalu sempit; source telah
diperbaiki dengan lebar minimum kolom dan aturan tanpa pecah kata. Lint, build,
refresh image Docker, dan uji visual ulang mode terang/gelap kembali PASS.

Kesehatan Integrasi menampilkan 14 dari 14 layanan siap, termasuk Pembaruan
Langsung, tanpa restart loop pada pemeriksaan runtime terakhir.

## Rollback

1. Gunakan image/source baseline sebelum Tahap 11 untuk service terdampak.
2. Recreate Nginx bersama upstream agar resolusi DNS container tidak usang.
3. Bila skema lokal harus dikembalikan, hentikan mutasi lalu pulihkan dump exact
   di atas ke database terisolasi terlebih dahulu dan bandingkan sebelum
   mengganti database lokal.
4. Jangan menghapus volume, file original Pustaka Media, atau backup.

Production, VPS, volume, image, network, credential, dan data proyek lain tidak
disentuh pada penerimaan lokal ini.
