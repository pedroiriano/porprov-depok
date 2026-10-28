# ADR-0020 — Pengelolaan Portal dan kapabilitas publikasi

Status: diterapkan pada source; aktivasi hanya Docker lokal yang diotorisasi, bukan production.
Tanggal: 24 Oktober 2026.

Penyempurnaan lokal 27 Oktober 2026: ADR-0022 menambahkan fitur turunan Jadwal dan dua slot native mandiri, dengan adapter read-only bagi konfigurasi lama; keputusan lainnya tetap berlaku.

## Keputusan

Konfigurasi portal dimiliki Master Data, terpisah dari data pertandingan. Registry bertipe pada `packages/portal-config` menjadi kontrak Go/TypeScript bersama. Hanya Super Admin aktif dengan izin terbaru `role.update` yang dapat mengubahnya melalui Gateway. Service memerlukan bukti HMAC khusus beserta identitas aktor tepercaya; header klien tidak dipercaya.

Modul memiliki mode lokal, tautan resmi, atau nonaktif; kapabilitas Admin dan Public terpisah. Penonaktifan tidak menghapus data, mematikan kontainer, atau mengganti RBAC. Akun, peran, audit, SSO, dan pengelolaan portal tidak termasuk modul yang dapat dinonaktifkan. Referensi internal Cabor/Kontingen untuk Venue/Jadwal tetap tersedia melalui endpoint baca terotorisasi.

Halaman bawaan mempertahankan rute dan slot fungsional. Halaman informasi tambahan memakai `/informasi/slug`. Bagian dapat dinonaktifkan, disusun ulang, dan memakai varian standar/ringkas; blok tambahan hanya teks, gambar Pustaka Media aktif, dan CTA. Tidak ada editor HTML, JavaScript, CSS, iframe, atau kode template vendor. Menu mendukung satu tingkat submenu, posisi atas/bawah, urutan dan status tampil. Arsip bersifat logis melalui status, tanpa penghapusan fisik.

## Persistensi dan konsistensi

Migrasi Master Data `000016` hanya menambah singleton konfigurasi, riwayat immutable, dan outbox. Tidak ada migrasi turun destruktif. Draf bersama menggunakan versi optimistis dengan konflik `409`; draf perangkat/server per pengguna tetap memakai ModalForm canonical. Publikasi mengunci row dan menyimpan konfigurasi, snapshot dan outbox dalam satu transaksi. Pemulihan membuat draf baru yang harus dipublikasikan lagi. Audit membawa snapshot username.

Projection anonim mengecualikan halaman draf/arsip dan bagian nonaktif. Gateway memblokir API domain sesuai kapabilitas; service melindungi mutasi langsung. Stream Public memeriksa kebijakan saat replay maupun pengiriman langsung; stream Admin tetap terautentikasi. UI terbuka menyegarkan konfigurasi paling lambat 15 detik saat tab terlihat; kebijakan SSE diperbarui setiap 3 detik. Pemeriksaan API menggunakan publikasi terkini.

## Batas dan kegagalan

Konfigurasi gagal dibaca tidak mengaktifkan ulang default. Rute fitur yang dikelola menghasilkan recovery `503`; root memakai recovery presentasi, sedangkan health, aset dan pengelolaan pemulihan tetap di luar guard rute. Service tetap menyediakan GET internal agar dependensi referensi tidak rusak. Health HTTP sendiri tidak membuktikan kapabilitas domain siap.

Tautan eksternal hanya HTTPS domain resmi `depok.go.id`/`jabarprov.go.id` beserta subdomain, tanpa credential/port khusus. Integrasi data aplikasi Provinsi belum dibuat karena kontraknya belum tersedia. Baseline awal mempertahankan modul existing; lima modul kewenangan Provinsi tidak dinonaktifkan otomatis.

## Rollback

Pulihkan publikasi melalui riwayat lalu publikasikan sebagai versi baru. Rollback runtime memakai tag image lokal yang dicatat sebelum recreate, mempertahankan tabel v16 dan named volume. Pemulihan dump hanya opsi darurat terpisah yang memerlukan persetujuan karena dapat menimpa data sesudah snapshot. Aktivasi production memerlukan Git/release/deployment gate dan otorisasi baru.
