# Provenance Cuba Admin Dashboard

Status: **LICENSE_PURCHASE_VERIFIED — satu lisensi untuk satu end product PORPROV**

Tanggal audit: **7 September 2026**

## Artefak yang Diperiksa

| Artefak sumber | SHA-256 | Kesimpulan |
|---|---|---|
| `C:\Datas\Master\Cuba Admin Dashboard\changelog.txt` | `AC2298B46BF11D84F3D12A6FB7EA42AF094F0E9F0F0B8F945EABBB4D7ACCE49A` | Riwayat perubahan berbagai varian Cuba; bukan sertifikat lisensi |
| `C:\Datas\Master\Cuba Admin Dashboard\documentation-readme.txt` | `0F7702FDB8A01439557069CA8ADC2150E75143D731F4C7A865DB5ACC4EBC2719` | Daftar tautan dokumentasi Pixelstrap; bukan sertifikat lisensi |
| Screenshot halaman item ThemeForest milik pembeli | `EBD21B1F858D726665DBEF0FEDDE17BB1FD27C51687C5D0446BA66FC699D570D` | Menampilkan item Cuba oleh PixelStrap dan status “You have 1 license for this item”; jenis lisensi dan purchase code tidak ditampilkan |

Kedua file dan screenshot hanya dibaca dari lokasi sumber dan tidak disalin ke repository. Pernyataan pengguna mengonfirmasi bahwa tangkapan layar berasal dari akun pembeli proyek.

## Batas Penggunaan

- Implementasi Admin berjalan secara clean-room dari kontrak visual repository menggunakan React, TypeScript, Tailwind CSS, token dan aset PORPROV.
- Source, stylesheet, JavaScript, brand, demo content, dan aset vendor Cuba tidak boleh dimasukkan ke repository GitHub yang publik karena tindakan itu dapat mendistribusikan source item kepada pihak lain.
- Build, Docker, test, dan runtime tidak boleh bergantung pada lokasi sumber di luar repository.
- Purchase code, invoice, dan data akun tidak boleh disimpan di Git, prompt, log, atau screenshot.

## Bukti Lisensi Envato

Envato menyediakan sertifikat secara terpisah dari paket utama melalui halaman **Downloads → Download → Licence certificate & purchase code** dalam format PDF atau teks. Sertifikat tersebut biasanya memuat nama item, jenis lisensi, tanggal pembelian, dan purchase code. Dokumen itu tidak diperlukan di repository dan, bila diunduh, wajib disimpan privat. Implementasi tetap clean-room karena repository `pedroiriano/porprov-depok` bersifat publik dan lisensi Envato tidak mengizinkan redistribusi item/source sebagai stock atau template.
