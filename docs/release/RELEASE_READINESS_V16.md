# Release Readiness Tahap 16

## Status

**READY untuk review dan Git delivery terpisah; BLOCKED untuk deployment.**
Source lokal sudah memperoleh perbaikan scoped dan seluruh image yang terdampak
telah dibangun serta dipindai ulang. CodeQL lokal tidak tersedia; CodeQL,
dependency review, status Dependabot, dan required checks wajib diverifikasi
pada PR setelah ada izin Git delivery.

Tidak ada deploy, akses VPS, migrasi database, perubahan data production,
commit, push, PR, merge, force push, atau history rewrite pada tahap ini.

## Identitas source

| Atribut | Nilai |
|---|---|
| Branch | `main` |
| Base lokal dan `origin/main` | `a3bc7037d8f1065544910a15194f203c990b54ce` |
| Working tree | Kotor secara disengaja oleh perubahan Tahap 16 |
| Release commit final | Belum tersedia |

## Perubahan source

Kandidat terdiri dari tepat 24 file berikut:

- Governance root: `AGENTS.md`, `AI.md`, `DEPLOYMENT_VPS.md`,
  `DOCUMENTATION.md`, `FEATURES.md`, `README.md`, dan `RULES.md`.
- Mobile: `apps/mobile-admin-react-native/package.json`,
  `apps/mobile-admin-react-native/package-lock.json`,
  `apps/mobile-public-react-native/package.json`, dan
  `apps/mobile-public-react-native/package-lock.json`.
- Admin: `apps/admin-web-react/index.html`.
- Infrastruktur: `infra/docker/docker-compose.yml`,
  `infra/docker/postgres/Dockerfile`, dan
  `infra/docker/prometheus/Dockerfile`.
- Migrator: `services/audit-service/Dockerfile.migrations`,
  `services/livescore-service/Dockerfile.migrations`,
  `services/master-data-service/Dockerfile.migrations`,
  `services/medal-standing-service/Dockerfile.migrations`,
  `services/schedule-service/Dockerfile.migrations`,
  `services/user-service/Dockerfile.migrations`, dan
  `services/venue-service/Dockerfile.migrations`.
- Runbook/release: `docs/runbook/VPS_UBUNTU_INTRANET.md` dan dokumen ini.

## Empat alert Dependabot

| GHSA | Package | Manifest | Sebelum | Patched | Eksploitabilitas | Exception |
|---|---|---|---:|---:|---|---|
| [`GHSA-vcc3-ghjq-m6fr`](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | `decode-uri-component` | Dua `package-lock.json` mobile | 0.2.2 | 0.5.0 | DoS melalui input jaringan yang dibuat khusus; kompleksitas rendah, tanpa hak/aksi pengguna; dampak availability | Tidak ada |
| [`GHSA-w5hq-g745-h8pq`](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | `uuid` | Dua `package-lock.json` mobile | 7.0.3 | 11.1.1 | Penulisan parsial pada buffer eksternal untuk API v3/v5/v6; serangan jaringan memerlukan aplikasi mengekspos ukuran/offset secara tidak langsung; integrity rendah | Tidak ada |

Setiap kombinasi advisory dan lockfile adalah satu alert, sehingga totalnya
empat. Override sudah diterapkan pada:

- `apps/mobile-admin-react-native/package.json` dan lockfile-nya;
- `apps/mobile-public-react-native/package.json` dan lockfile-nya.

`npm audit`, lint, typecheck, pemeriksaan Expo, dan export web kedua mobile
lulus. Exception `image-size` tidak dipakai. GitHub Security UI tidak dapat
memberi status alert default branch karena sesi GitHub lokal tidak
terautentikasi; penutupan alert baru dapat diverifikasi setelah Git delivery.

## Hardening image

- Migrator dibangun dari `golang-migrate` v4.20.1 commit
  `504568a3cbd23b8754760f55a3d89aec1b0c4963`, memakai Go 1.26.6 dan dependency
  patched; version binary `4.20.1-porprov.1`.
- PostgreSQL memakai `postgis/postgis:15-3.5-alpine`; `gosu` 1.19 dibangun dari
  commit `6456aaa0f3c854d199d0f037f068eb97515b7513` dengan Go 1.26.6.
- Prometheus memakai v3.13.3 dengan tag object
  `b48aa66338a457726cfb7db6455fbbe175d27ba9` dan commit
  `b273ae3adeb64ad630d65ef7f16440df95658410`, Go 1.26.6, serta gRPC 1.83.2.
- Compose memakai `porprov/postgres:15-3.5-porprov.1` dan
  `porprov/prometheus:v3.13.3-porprov.1`.

## Artefak keamanan lokal

Direktori artefak:

`C:\Datas\Proyek\Aplikasi\porprov-depok\.tmp\release-readiness-v16-a3bc703`

Tersedia 21 SBOM CycloneDX dan 21 laporan Trivy final untuk seluruh image
buatan repository. Semua laporan mencatat **0 High/Critical fixable**.
Tersedia pula `zap-v16.json` dan `zap-v16.html`; ZAP pasif memeriksa 527 URL,
hasil 0 FAIL dan 6 kategori warning non-blocking. Warning SRI pada preload image
same-origin bukan script eksternal; query React tervalidasi/di-escape; cache
warning sesuai kebijakan `no-store`; komentar HTML Admin telah dibersihkan.
Checksum 42 artefak SBOM/Trivy terpilih dan dua laporan ZAP dicatat dalam
`SHA256SUMS-v16-final.txt` pada direktori artefak yang sama; 44 checksum telah
diverifikasi tanpa mismatch.

Image kandidat release lokal berikut sudah dipindai. Content digest-nya exact,
tetapi belum menjadi artifact release immutable karena belum memiliki commit
final dan registry digest:

| Image | Content digest kandidat final lokal |
|---|---|
| `porprov-depok-nginx:latest` | `sha256:5f309c467cf16862601cad2ccc7a69b005eb5b1a5ed871e37550cb4aff08941d` |
| `porprov-depok-admin-web:latest` | `sha256:cc4ba299758bc8250e4a52cce484407bc74fe9df2184f23827bfed15ea47a1f0` |
| `porprov-depok-public-web:latest` | `sha256:f3aff7a0106993935142fffdcdd74fc1b442a739fe31664e2bc529563ba1756a` |
| `porprov-depok-api-gateway:latest` | `sha256:60521e4e587eb3c86497d5a6d06515af867842193efda64b06f524d4d18ec23d` |
| `porprov-depok-audit-service:latest` | `sha256:072c48bbcc86549da1b18c6e269831c7db6b1b5cd5e12964c23d694d5879d1d1` |
| `porprov-depok-user-service:latest` | `sha256:1a63fd11bdb5a7a0f1b2302325e81326f61e1179eeca80988c2e6429c7561e26` |
| `porprov-depok-master-data-service:latest` | `sha256:719c7c927b32ded6b70b5a078f00ed901bda8139d391e85df53d56fa59a10ca4` |
| `porprov-depok-schedule-service:latest` | `sha256:273d9f816882bb5529e6b9e4a76c327abaf77c623fec5e6a529f8f23497831ff` |
| `porprov-depok-livescore-service:latest` | `sha256:3fa13710eae09bd726b40548e9e1877f23460ed1b79b59107f237d17b928fc14` |
| `porprov-depok-medal-standing-service:latest` | `sha256:11a9f022f0f44c2d2943e2ca18c9766d697748f22711b514910b2d6f607e97e7` |
| `porprov-depok-realtime-gateway:latest` | `sha256:7fe3e708494ec9f237c4503f6f3ed05b925e0c072971b7079e8b6460db460a89` |
| `porprov-depok-venue-service:latest` | `sha256:cf2eece1a10daced5a7a34ece2a254b703f307825d696ac0a38f2dff3676aa6c` |
| `porprov/postgres:15-3.5-porprov.1` | `sha256:82fa45565f733bd3d61c8d6d1141e3cc762af9b303d80a499a729e2c6682a285` |
| `porprov/prometheus:v3.13.3-porprov.1` | `sha256:a010721fc1864362ea5780e03569eaf23a19950b777ea703a91ec8622bfb43f7` |
| `porprov-depok-migrate-audit:latest` | `sha256:75d1608f11a5682938f5b48a7131d9bc0624cdecd841e6be2b740245620369af` |
| `porprov-depok-migrate-user:latest` | `sha256:3ad4e1e0a70adcffb09de3d300f273c6467f2bfafe7f9bffaffb8c98d8d8753d` |
| `porprov-depok-migrate-master-data:latest` | `sha256:82dd236097f2b3f90b2eccd9e7920ab25f29776b1ce6fa11f1d6e855a719bbb1` |
| `porprov-depok-migrate-schedule:latest` | `sha256:d6714c6f41218486abd6cff19e4d66fd738436c965f1786634cc16bd841e24cd` |
| `porprov-depok-migrate-livescore:latest` | `sha256:60f8a966072e52c5642fd42c705a8d75acce946ae34d9dc5b28996eb28fc07d4` |
| `porprov-depok-migrate-medals:latest` | `sha256:3ad0b1e198c19dc31315ed0402ca443fdb4a798c9b5d4904ea6afb45ab904ec1` |
| `porprov-depok-migrate-venue:latest` | `sha256:5d62d11d0b8361ef6de3ae64aada3873493164f98bba1c71aeb4e3bb6926e990` |

## Gate yang sudah lulus

- npm audit policy kedua mobile: 0 vulnerability;
- lint, typecheck, Expo dependency check, dan export web kedua mobile;
- `govulncheck` pada 10 modul Go: tidak ada jalur rentan;
- secret scan tracked source;
- Compose base + lokal serta base + VPS `config --quiet` pada source final;
- build, smoke test, 21 SBOM, dan 21 Trivy image final: 0 High/Critical fixable;
- smoke migrator, PostgreSQL/PostGIS, gosu, Prometheus, dan promtool;
- `nginx -t`, redirect HTTPS, HSTS, CSP, COOP/COEP/CORP, no-store Admin;
- ZAP pasif: 527 URL, 0 FAIL;
- snapshot rollback lokal Tahap 15: 13 file, 0 checksum gagal.

## Dry-run deployment

Urutan migrasi canonical adalah User 5, Master Data 15, Venue 3, Schedule 5,
LiveScore 1, Medal 3, dan Audit 3. Migration bersifat forward-only melalui job
Compose one-shot; `down` tidak dijalankan otomatis.

Precondition production yang belum dapat diverifikasi tanpa akses/otorisasi VPS:

- kapasitas CPU, RAM, swap, disk, inode, dan headroom build target;
- fingerprint SSH dan TLS resmi target;
- secret production unik, kuat, dan tersedia di secret store target;
- `PORPROV_DEPLOY_COMMIT` sesuai release SHA yang belum ada;
- backup database/Media/config target beserta checksum;
- maintenance window, rollback owner, monitoring, dan registry digest.

File `.env` lokal adalah konfigurasi development: origin production tidak exact,
satu client secret masih placeholder, dan `PORPROV_DEPLOY_COMMIT` belum ada.
Folder TLS root tidak memuat sertifikat/key runtime. Keduanya merupakan hasil
audit yang diharapkan dan tidak diubah pada tahap dry-run.

## Gate untuk membuka deployment

1. Review diff dan lakukan Git delivery terpisah; CodeQL, dependency review,
   Dependabot, serta seluruh required check harus PASS pada SHA final.
2. Bila source image berubah saat Git delivery, rebuild hanya image terdampak,
   lalu ulang smoke, SBOM, Trivy, dan checksum pada SHA final.
3. Publikasikan image immutable dan rekam registry digest/provenance.
4. Dengan izin VPS terpisah, lakukan preflight read-only, backup/checksum, dan
   konfirmasi kapasitas/TLS/secret/rollback.
5. Minta persetujuan eksplisit deployment dan migrasi production bila versi
   schema target tertinggal.
