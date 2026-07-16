# ADR-0005 — Canonical Compose Runtime dan Penyatuan Media Storage

- Status: Accepted
- Tanggal: 16 Juli 2026
- Pemilik: Tim Portal PORPROV Depok

## Konteks

Repository sebelumnya menyediakan full-stack Docker sekaligus script `start_all.sh` yang menyalakan sebagian infrastruktur Docker dan sebagian service lokal. Admin lokal memakai port `5174`/Gateway `28000`, sedangkan Admin Docker memakai `5173`/Gateway `8000`. Kedua mode dapat menulis PostgreSQL yang sama, tetapi Master Data lokal menyimpan upload di folder workspace sementara container memakai named volume. Kombinasi tersebut membuat UI, role menu, dan file Media Library berbeda menurut proses yang kebetulan aktif.

## Keputusan

1. Full-stack development dan demo menggunakan satu baseline: `infra/docker/docker-compose.yml`.
2. Compose menjalankan Public Web `3000`, Admin Web `5173`, API Gateway `8000`, Keycloak `8080`, seluruh domain core, migration jobs, data/event infrastructure, Nginx, dan observability.
3. `infra/docker/compose-up.ps1` menjadi satu-satunya launcher full-stack yang didokumentasikan. Script campuran `start_all.sh` dan environment Admin yang mengarah diam-diam ke Gateway `28000` dihapus.
4. Keycloak client, realm roles, serta akun development di-bootstrap otomatis dan idempotent sebelum API Gateway dimulai.
5. Admin membaca realm role dari ID token dan access token untuk presentation-level navigation; API Gateway tetap menjadi pemilik otorisasi final.
6. Named volume `master_data_uploads` menjadi storage runtime Media Library. File lokal legacy dimigrasikan non-destruktif dan disimpan sebagai backup runtime di luar Git.
7. Namespace `28xxx` tetap tersedia hanya untuk debugging satu komponen yang eksplisit. Debug lokal tidak boleh dianggap sebagai cara menjalankan full stack dan tidak boleh menulis database yang sama bersamaan dengan service Docker domain yang sama.
8. Public Web memakai URL Gateway publik untuk browser dan DNS Gateway internal untuk Server Components dalam Compose.

## Konsekuensi

- Satu perintah membangun dan menjalankan seluruh stack serta menghasilkan endpoint konsisten.
- Port `5174` tidak lagi menjadi callback OIDC atau baseline Admin.
- File `.env` aktual tidak dilacak Git; `.env.example` adalah template tunggal.
- Build Public Web tidak bergantung pada pengambilan Google Fonts saat build.
- Debug komponen lokal tetap mungkin, tetapi operator harus menghentikan container domain yang sama dan mengatur environment secara eksplisit.

## Verifikasi

- `docker compose config --quiet`
- Admin lint dan production build
- Public lint dan production build
- Semua URL file Media Library aktif melalui API Gateway menghasilkan HTTP `200`
- Bootstrap Keycloak berakhir sukses dan token `admin_depok` membawa `super_admin`
