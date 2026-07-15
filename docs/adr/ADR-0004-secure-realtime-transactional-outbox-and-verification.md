# ADR-0004 — Secure Realtime, Transactional Outbox, dan Workflow Verifikasi

- Status: Accepted
- Tanggal: 15 Juli 2026
- Ruang lingkup: API Gateway, LiveScore, Medal Standing, Audit Service, Realtime Gateway, Admin Web, dan Public Web

## Konteks

LiveScore sebelumnya hanya menerbitkan event dari memori, koreksi tidak memiliki revision history, dan restart service menghilangkan state. Perubahan Medali langsung menambah klasemen tanpa pemisahan pengaju, verifikator, dan publisher. Stream SSE publik/admin berbagi endpoint anonim, sedangkan audit lama belum immutable, belum idempotent, dan event penting belum memakai transactional outbox.

## Keputusan

1. API Gateway memvalidasi tanda tangan JWT sekaligus issuer, expiry wajib, subject, serta `azp`/audience client yang diizinkan. Realm role membatasi LiveScore, workflow Medali, private stream, dan Audit Log.
2. Stream dipisahkan menjadi public SSE anonim dan private SSE terautentikasi. JWT hanya diperiksa di edge; Gateway menyuntikkan secret internal pada hop ke Realtime Gateway. Secret development dilarang pada staging/production, origin CORS harus HTTPS eksplisit, dan stream publik membuang actor, request ID, serta alasan koreksi.
3. LiveScore menyimpan revision log append-only dan projection current di PostgreSQL. Setiap update/koreksi memvalidasi Jadwal aktif, memakai sequence database, dan dapat membawa `expectedRevision` untuk mencegah lost update. Koreksi membuat revisi baru; revision lama tidak diubah.
4. LiveScore dan Medal Standing menulis state domain serta outbox pada transaksi PostgreSQL yang sama. Worker memublikasikan event ke NATS JetStream dengan retry/backoff. Delivery bersifat at-least-once; consumer wajib deduplikasi memakai `eventId`.
5. Medali mengikuti `PENDING → VERIFIED → OFFICIAL`; `PENDING/VERIFIED → REJECTED` juga diizinkan. Hanya publisher `super_admin` yang dapat membuat submission VERIFIED menjadi OFFICIAL dan menambah klasemen. `submitted_by`, `verified_by`, `rejected_by`, dan `published_by` dipertahankan terpisah.
6. Audit Service menyimpan event secara append-only, menolak SQL UPDATE/DELETE melalui trigger, membuat deduplication key dari `eventId`, dan menyimpan SHA-256 payload. Event legacy tanpa UUID memperoleh ID deterministik; poison message dihentikan agar tidak memblokir durable consumer.
7. Public Web hanya membaca projection LiveScore dan standings OFFICIAL. Admin Web memakai private SSE dengan bearer token serta menyediakan history/koreksi skor, antrean verifikasi Medali, Audit Log, dan export CSV.

## Konsekuensi

- Restart service tidak menghilangkan skor atau workflow Medali yang sudah committed.
- NATS yang sementara gagal tidak menghilangkan perubahan LiveScore/Medali; outbox mengirim ulang dan dapat menghasilkan duplicate delivery yang aman karena `eventId`.
- Koreksi skor dan keputusan Medali mempunyai jejak actor yang tidak dapat ditimpa oleh tahap berikutnya.
- Mutasi gagal tertutup ketika Jadwal/Kontingen referensi tidak aktif atau service pemilik referensi tidak tersedia.
- Private SSE tetap bergantung pada satu secret internal antara Gateway dan Realtime; production harus memasok secret manager/network policy. Public SSE sengaja anonim karena data skor resmi adalah data tayang publik.

## Batas Implementasi

- Transactional outbox saat ini diterapkan pada LiveScore dan workflow Medali. Event Master Data, Media, Venue, dan Jadwal yang masih best-effort tetap technical debt dan tidak boleh disebut durable.
- Audit immutability berbasis trigger dan hash bukan external/WORM ledger. Retensi, signing eksternal, SIEM, serta legal hold masih perlu keputusan operasional.
- MFA Admin, RBAC granular seluruh domain lama, distributed SSE fanout, rate limit terdistribusi, observability lengkap, load/stress/security scan, dan production deployment belum diklaim selesai.

## Verifikasi

- Unit/regression test Gateway, Audit, LiveScore, Medal Standing, Realtime, dan Schedule lulus.
- Migration LiveScore v1, Medal v3, dan Audit v2 berhasil; trigger Audit menolak UPDATE dan jumlah row tidak berubah.
- Admin/Public lint dan production build lulus; Compose config serta image application/migration tervalidasi.
- Runtime memverifikasi health, public projection kosong yang faktual, private stream tanpa credential `401`, role guard, validasi payload/reference, dan tidak memasukkan skor atau Medali fiktif.
