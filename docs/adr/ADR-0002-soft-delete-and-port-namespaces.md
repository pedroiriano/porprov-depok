# ADR-0002: Soft Delete dan Namespace Port Portabel

- Status: Accepted
- Tanggal: 2026-07-14
- Konteks: PORPROV XV Jawa Barat 2026 Kota Depok

## Konteks

Master Data, Media Library, Venue, dan Schedule sebelumnya menggunakan hard delete. File media juga langsung dihapus dari storage, sehingga restore dan audit lengkap tidak mungkin dilakukan. Pada sisi runtime, default port `go run` sama dengan host port Docker dan menyebabkan bind conflict saat kedua mode digunakan bersamaan.

## Keputusan Soft Delete

- Cabor, Nomor Pertandingan, Kontingen, City Guide, Media, Venue, Jadwal, dan tabel legacy terkait memiliki `deleted_at`, `deleted_by`, dan `delete_reason`. Domain baru wajib mengadopsi kontrak yang sama.
- Query normal, get, dan update hanya memproses record dengan `deleted_at IS NULL`.
- Endpoint `DELETE` menulis tombstone secara idempotent; SQL hard delete tidak digunakan pada handler aplikasi.
- Restore tersedia melalui endpoint terautentikasi dan menulis event audit; pembatasan role granular diputuskan pada tahap hardening RBAC.
- Recycle Bin Admin menggabungkan tombstone Master Data, Media, Venue, dan Schedule.
- Media yang diarsipkan tetap berada di storage tetapi delivery publik mengembalikan `404` sampai media dipulihkan.
- Cabor, Nomor Pertandingan, Venue, dan Jadwal memakai pemeriksaan referensi aktif untuk mencegah arsip/restore yang merusak integritas lintas service.
- API Gateway membuang header `X-Actor-ID` dari klien, menurunkannya dari claim JWT `sub`, lalu meneruskan actor dan request ID ke service. Akses langsung endpoint recycle/restore tanpa actor ditolak.
- Service menerbitkan event audit NATS best-effort untuk perubahan state. Durable outbox, event versioning, dan penyimpanan audit immutable tetap pekerjaan lanjutan dan tidak diklaim selesai oleh ADR ini.
- Purge fisik ditunda sampai kebijakan retensi dan otorisasi khusus disetujui.

## Keputusan Port

- Production hanya mengekspos Nginx pada `80/443`.
- Public development memakai Admin `5173`, Gateway `8000`, dan Keycloak `8080`.
- Diagnostik Docker memakai `18081/18082/18087` untuk Master/Schedule/Venue.
- Local Go debug memakai namespace `28xxx` sehingga dapat berjalan berdampingan dengan Docker.
- Infrastruktur host memakai port high-range configurable: PostgreSQL `15432`, Redis `16379`, NATS `14222/18222`, Prometheus `19090`, Grafana `13000`.
- Semua mapping host Compose memakai environment variable. Komunikasi container tetap memakai DNS service dan internal port.

## Konsekuensi

- Data yang diarsipkan tidak hilang dan dapat diaudit/dipulihkan.
- Unique name aktif dapat dipakai kembali melalui partial unique index; restore dapat menghasilkan konflik `409` bila nama telah digunakan record baru.
- Penyimpanan media bertambah sampai purge retention dijalankan.
- Pemeriksaan referensi lintas service menambah satu request internal pada operasi arsip tertentu dan memilih fail-closed ketika service referensi tidak tersedia.
- Recycle Bin untuk sementara dapat dipakai seluruh pengguna Admin yang lolos autentikasi; matrix permission yang lebih sempit harus ditambahkan saat hardening RBAC.
- Operator dapat menjalankan Docker dan binary Go lokal tanpa bind conflict, tetapi concurrent write terhadap database yang sama tetap harus dihindari.

## Verifikasi Wajib

- Migration up berhasil dengan state `master=5`, `venue=2`, `schedule=4`, seluruhnya `dirty=false`.
- Delete menyembunyikan record dari list/get, tetap menyimpan row/file, dan bersifat idempotent; media delivery berubah `200 → 404 → 200` pada delete/restore.
- Dependency guard menghasilkan `409` saat Cabor/Nomor/Venue masih memiliki referensi aktif, dan restore Jadwal ditolak sampai parent aktif kembali.
- Endpoint internal recycle tanpa actor menghasilkan `401`, sedangkan request dengan actor tepercaya menghasilkan `200`. Unit test Gateway membuktikan header actor klien dibuang dan diganti claim JWT.
- `go test ./...` lulus pada Master Data, Venue, Schedule, dan API Gateway. Admin lint selesai tanpa error, production build lulus, Compose config valid, dan seluruh container sehat saat verifikasi runtime. Record QA akhir tetap diarsipkan sebagai tombstone beralasan; purge tidak dijalankan tanpa kebijakan retensi dan otorisasi khusus.
