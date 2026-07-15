# ADR-0003 — Public Schedule Read-Model dan Versioned Realtime Events

- Status: Accepted
- Tanggal: 15 Juli 2026

## Konteks

Record Jadwal menyimpan UUID domain Nomor Tanding, Venue, dan peserta. Public Web membutuhkan nama, ikon, alamat, serta identitas Kontingen tanpa mengakses port diagnostik atau menjalankan orkestrasi lintas service dari browser. LiveScore dan Medali juga berbagi stream SSE sehingga event harus dapat dibedakan dan diurutkan.

## Keputusan

1. Schedule Service menjadi pemilik read-model `GET /api/v1/matches/enriched` dan memublikasikannya melalui API Gateway sebagai `GET /api/v1/schedule/matches/enriched`.
2. Peserta aktif dibaca dengan satu batch query; referensi Cabor, Nomor Tanding, Kontingen, dan Venue aktif diambil dari service pemilik. Endpoint mengembalikan `503` bila dependency tidak tersedia dan tidak mengembalikan tombstone.
3. Public Web menggunakan read-model tersebut untuk Jadwal, detail Cabor/Venue, dan LiveScore. Browser tidak mengakses service domain secara langsung.
4. Event LiveScore dan Medali memakai envelope versi `1.0`: `eventVersion`, `eventId`, `eventType`, `sequence`, `timestamp`, `actor`, dan payload domain. Consumer mengabaikan event type lain. Medali memakai polling 30 detik sebagai fallback SSE.
5. Enrichment ini adalah read projection; tidak ada duplikasi kepemilikan database lintas service.

## Konsekuensi

- Presentasi publik tidak lagi bergantung pada UUID mentah dan konsisten pada semua layar.
- Schedule Service mempunyai dependency baca ke Master Data dan Venue; timeout/failure terlihat eksplisit sebagai `503` alih-alih data parsial yang menyesatkan.
- Sequence saat ini lokal per proses. Durable global sequence, outbox, replay, koreksi, audit immutable, dan scale-out tetap menjadi pekerjaan hardening.
