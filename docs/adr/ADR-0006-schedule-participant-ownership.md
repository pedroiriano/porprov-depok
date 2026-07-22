# ADR-0006 — Kepemilikan Peserta Pertandingan pada Schedule Service

- Status: Accepted
- Tanggal: 22 Juli 2026
- Lingkup: Schedule Service, Admin Web, Public Web, LiveScore Service

## Konteks

Jadwal dan LiveScore sebelumnya dapat berjalan tanpa susunan peserta yang lengkap. Tabel `match_participants` sudah ada, tetapi tidak mempunyai kontrak jenis peserta, slot A/B, endpoint operasional, ataupun form Admin. Akibatnya read-model publik menampilkan “Peserta menunggu konfirmasi” sementara skor tetap dapat diperbarui.

Identitas peserta juga berpotensi dimasukkan ulang pada LiveScore. Hal itu menciptakan dua sumber kebenaran dan membuka risiko nama peserta, kontingen, serta urutan skor A/B tidak konsisten.

## Keputusan

1. Master Data Service tetap menjadi pemilik referensi Kontingen.
2. Schedule Service menjadi pemilik susunan peserta per pertandingan.
3. LiveScore Service hanya menjadi pemilik revisi skor/status dan mereferensikan `match_id`; LiveScore tidak menyimpan identitas peserta kedua.
4. Kontrak LiveScore saat ini adalah dua sisi. Jadwal yang siap dinilai harus memiliki tepat dua peserta dengan jenis yang sama serta `slot` 1 (A) dan 2 (B).
5. Jenis peserta adalah:
   - `individual`: wajib `athlete_name` dan Kontingen aktif;
   - `team`: wajib `team_name` dan Kontingen aktif;
   - `contingent`: nama tayang berasal dari Kontingen aktif.
6. Create/update Jadwal dan susunan peserta dilakukan dalam satu transaksi database.
7. Saat susunan diganti, peserta lama di-soft-delete dengan actor serta alasan. Record lama tidak di-hard-delete.
8. Read-model enriched mengembalikan peserta menurut slot beserta `participant_type`, identitas, Kontingen, dan `display_name`.
9. Admin LiveScore mengunci input skor bila susunan A/B belum lengkap.

## Konsekuensi

- Operator mempunyai satu alur: buat Master Data Kontingen, buat Jadwal beserta Peserta A/B, lalu input skor di LiveScore Center.
- Public Web dan Admin menggunakan nama yang sama dari read-model Schedule.
- Audit historis susunan peserta dipertahankan melalui soft delete.
- Format beregu yang membutuhkan lebih dari dua sisi atau roster detail belum dicakup oleh kontrak ini dan memerlukan ADR lanjutan sebelum mengubah model skor A/B.

## Kontrak API

Create/update Jadwal menerima `participants` berisi tepat dua item:

```json
{
  "participants": [
    {
      "participant_type": "individual",
      "kontingen_id": "uuid-kontingen",
      "athlete_name": "Nama Atlet",
      "team_name": "",
      "slot": 1
    },
    {
      "participant_type": "team",
      "kontingen_id": "uuid-kontingen",
      "athlete_name": "",
      "team_name": "Nama Tim",
      "slot": 2
    }
  ]
}
```

Endpoint baca peserta aktif adalah `GET /api/v1/schedule/matches/{id}/participants`; konsumsi layar lintas domain tetap memakai `GET /api/v1/schedule/matches/enriched` melalui API Gateway.
