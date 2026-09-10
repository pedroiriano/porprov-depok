# Release Manifest v15 — Kandidat Lokal

## Identitas source

| Atribut | Nilai |
|---|---|
| Branch kerja | `codex/release-candidate-uat-v15` |
| Base commit dan `origin/main` | `28a669f42efad23a8d9774687aae8249c255f941` |
| Commit implementasi release candidate | `b832bd0` |
| Bentuk kandidat saat ini | Base commit di atas ditambah diff terverifikasi pada User Service, Medal Standing Service, bootstrap Keycloak, test, dan dokumentasi Tahap 15. |
| Status delivery saat manifest difinalkan | Commit implementasi lokal telah dibuat; commit dokumentasi, PR, CI, dan merge dicatat oleh GitHub serta handoff Tahap 15.1. |

## Versi migrasi lokal

| Domain | Versi | Dirty |
|---|---:|---|
| User | 5 | false |
| Master Data | 15 | false |
| Venue | 3 | false |
| Schedule | 5 | false |
| LiveScore | 1 | false |
| Medal | 3 | false |
| Audit | 3 | false |

Tahap 15 tidak menjalankan migrasi. Database `porprov_db` masih dipakai bersama oleh Medal dan Keycloak; pemisahan database tetap risiko arsitektural yang harus direncanakan, bukan dilakukan pada release ini.

## Digest image lokal

| Komponen | Image | Digest |
|---|---|---|
| Nginx | `porprov-depok-nginx` | `sha256:9b38e7f2bbf1fd95dd211901c613ae4f861fc879836e7c366bda1d3bef55f836` |
| Admin Web | `porprov-depok-admin-web` | `sha256:3b263d90164e1996714e216015cc9ec3d1f2c7fa44351c0c1dede8d55aef42c4` |
| Public Web | `porprov-depok-public-web` | `sha256:6e494f32507343bc6b60773ff527124e786748824dae4f13fcd88b1b4df44553` |
| API Gateway | `porprov-depok-api-gateway` | `sha256:b66c036e1104abe4b9f3fcc958317cfb6e09b937dfaee9079598c3998cb1acdf` |
| Audit | `porprov-depok-audit-service` | `sha256:49313615a1575478ef0a2e6dfb987885743c8314a4fd47c54e107f947a5c6748` |
| User | `porprov-depok-user-service` | `sha256:798883eeee32deff236186f82770fc22c8b19db72954dfd8e854d9d98c2ede09` |
| Master Data | `porprov-depok-master-data-service` | `sha256:9b9d0248cb8bece9dc7fabe91fe37fdba97ca727b3958ea945789fbccaaf537e` |
| Schedule | `porprov-depok-schedule-service` | `sha256:4e246676148215b78f6239b3180d70c2715368e1e01ccf0e3383354ea2f8c98f` |
| LiveScore | `porprov-depok-livescore-service` | `sha256:0720c2fbecfb1383e469424d920ccf4c62ddc688bcf4688f41eac4747b7cf9e0` |
| Medal | `porprov-depok-medal-standing-service` | `sha256:1afe68ebca4614c6425ea83bf82b1f6993a55b3f6e541915b4ed8c9cc9bf9602` |
| Realtime | `porprov-depok-realtime-gateway` | `sha256:3932787a12214d42e39e07077bd286d09475ee6a37c0f5ea091825e5b6ce4e36` |
| Venue | `porprov-depok-venue-service` | `sha256:2f4d72de45f8f6c50ec6f7c4554b0404fb7dd7d8198629798eff3cd204ffc216` |
| PostgreSQL/PostGIS | `porprov/postgres:15-postgis` | `sha256:702a750c66d612b79e376fe5d8d75e249886d8b1bfe842d1132656c60d4ccd10` |
| Redis | `redis:7-alpine` | `sha256:e7723ff73d963f5cc6d9c4643ea3d989527a402a319239054e9472a7fb9219a2` |
| NATS | `nats:2.10-alpine` | `sha256:b83efabe3e7def1e0a4a31ec6e078999bb17c80363f881df35edc70fcb6bb927` |
| Keycloak | `quay.io/keycloak/keycloak:24.0.0` | `sha256:9cb0e385fb5889befbd2ec5db3905ec2a7953669e34cbfdc460ea217a38458bc` |
| Umami | `docker.umami.is/umami-software/umami:3.2.0` | `sha256:8edfe4beaef13f9d1300619fa264ef250a3688df9cc54d24ca830ca31cb475ec` |
| Prometheus | `porprov/prometheus:v2.45.0` | `sha256:b831855963a2168aa542a3b75b4f79e703947d5ca7045ea4a137a4e11933895c` |
| Grafana | `grafana/grafana-oss:10.0.3` | `sha256:423040d62678074111e4e72d7dcef23480a94eb4f21b9173204d1a5ee972ec59` |

Digest di atas adalah image lokal yang diuji, bukan bukti image telah dipublikasikan atau dideploy.

## Backup dan rollback

- Snapshot lokal: `C:\Datas\Proyek\Aplikasi\porprov-depok\.tmp\uat-v15-20260910T015545Z`.
- Manifest checksum SHA-256: `d7e5054f29eb859c02136824440a515c84c6977e35cacd572f5dfae6a14921ef`.
- Snapshot pra-UAT Peran kustom: `C:\Datas\Proyek\Aplikasi\porprov-depok\.tmp\keycloak-manage-realm-20260910T050044Z\pre-uat`; manifest SHA-256 `7f417c948bf8513f647053e75b356a39c124bd2d86247c1c1ae8ec9c129f610d`.
- Restore drill: PASS; RPO 0 detik terhadap baseline fixture dan RTO 80,93 detik.
- Reconnect Realtime: PASS; RTO 15,04 detik.
- Rollback source sebelum commit: buang hanya diff Tahap 15 melalui patch terarah setelah persetujuan eksplisit; dilarang memakai `git reset --hard`.
- Rollback runtime: restore sembilan dump dan tiga arsip volume exact, lalu mulai ulang 19 kontainer tanpa menghapus volume.

## Risiko dan keputusan terbuka

1. `manage-realm` adalah hak administratif luas, tetapi telah dibatasi hanya pada `service-account-porprov-backend-service`; klien Admin/mobile tidak memilikinya. Production belum berubah dan tetap memerlukan secret kuat serta otorisasi deployment terpisah.
2. Bundle ApexCharts Admin menghasilkan chunk sekitar 532 kB terkompresi-minify sebelum gzip; sudah lazy-loaded sebagai chunk terpisah, tetapi perlu dipantau pada Core Web Vitals Admin.
3. `porprov_db` masih dipakai Medal dan Keycloak.
4. Commit final, CI SHA, registry digest, deployment window, pemilik persetujuan, dan target production masih TBD.

## Checklist deployment masa depan

- [x] Terapkan hak minimum Keycloak lokal, buktikan UAT Peran kustom, dan rollback seluruh fixture.
- [x] Lakukan penerimaan visual representatif Public/Admin terautentikasi; matriks penuh tetap mengacu pada gate Tahap 14 karena frontend tidak berubah.
- [x] Review diff dan pastikan hanya file Tahap 15 yang distage.
- [x] Pastikan `.env`, koleksi Postman, dump, private key, backup, dan artefak build tidak dilacak.
- [x] Buat commit implementasi kandidat dan catat SHA exact `b832bd0`.
- [ ] Jalankan protected CI/DevSecOps pada SHA final sampai seluruh required check PASS.
- [ ] Buat persetujuan deploy, backup target, verifikasi kapasitas, dan jendela perubahan terpisah.
- [ ] Terapkan migrasi production hanya bila versi target membutuhkan dan persetujuan migrasi diberikan.
- [ ] Deploy secara rolling/terkendali, lalu smoke HTTPS, header, SSO, API, realtime, Media, dan rollback readiness.
- [ ] Catat image registry digest, waktu deploy, RPO/RTO aktual, hasil observability, dan penutupan risiko.
