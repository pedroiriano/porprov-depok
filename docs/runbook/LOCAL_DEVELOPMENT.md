# Runbook Menjalankan Portal PORPROV Depok

> Baseline canonical per 16 Juli 2026. Jalankan perintah dari root repository `porprov-depok`, kecuali dinyatakan lain.

## 1. Prinsip Runtime

Full stack hanya dijalankan dengan Docker Compose. Jangan menyalakan rangkaian service `go run`, Vite pada port alternatif, atau launcher campuran bersamaan dengan stack Docker.

| Komponen | Endpoint canonical |
|---|---|
| Public Web | `http://localhost:3000` |
| Admin Web | `http://localhost:5173` |
| API Gateway | `http://localhost:8000` |
| Keycloak | `http://localhost:8080` |
| Master/Schedule/Venue diagnostik | `18081` / `18082` / `18087` |
| PostgreSQL | `localhost:15432` |
| Redis | `localhost:16379` |
| NATS client/monitor | `localhost:14222` / `http://localhost:18222` |
| Prometheus/Grafana | `http://localhost:19090` / `http://localhost:13000` |

Browser hanya boleh membaca API melalui Gateway `8000`, bukan port diagnostik.

## 2. Prasyarat

- Windows 10/11 dan PowerShell.
- Docker Desktop dengan Docker Compose v2.
- Node.js/npm dan Go hanya diperlukan untuk lint, build, test, atau debug komponen.
- Port pada tabel di atas tidak sedang digunakan proses lain.

Periksa:

```powershell
docker version
docker compose version
node --version
npm.cmd --version
go version
```

## 3. Menyiapkan Environment

```powershell
Set-Location .\infra\docker

if (-not (Test-Path .\.env)) {
    Copy-Item .\.env.example .\.env
}
```

`.env.example` hanya berisi default development. File `.env` aktual diabaikan Git. Ganti password, internal token, issuer, origin, dan secret lain sebelum staging/production.

Konfigurasi service/frontend terpusat di Compose. File berikut sengaja tidak lagi dipakai:

- root `start_all.sh`;
- `apps/admin-web-react/.env.development`;
- `.env` per service sebagai cara menjalankan full stack;
- callback Admin port `5174`.

## 4. Menjalankan Seluruh Stack

Masih dari `infra/docker`:

```powershell
.\compose-up.ps1
```

Script menjalankan `docker compose up -d --build` dengan Docker config lokal `.docker-cli`. Stack mencakup:

- PostgreSQL dan seluruh migration job;
- Redis dan NATS JetStream;
- Keycloak serta bootstrap realm/client/role/user;
- Master Data, Venue, Schedule, LiveScore, Medal Standing, Audit, dan Realtime Gateway;
- API Gateway;
- Public Web dan Admin Web;
- Nginx, Prometheus, dan Grafana.

Untuk startup tanpa rebuild image yang sudah tersedia:

```powershell
.\compose-up.ps1 -NoBuild
```

Periksa container dan migration job:

```powershell
docker --config .\.docker-cli compose ps -a
```

Status `Exited (0)` pada service `migrate-*` dan `keycloak-bootstrap` adalah normal: keduanya one-shot job yang sudah selesai.

## 5. Login Admin dan Menu

Bootstrap development membuat akun berikut secara idempotent:

| Kegunaan | Username | Password | Role |
|---|---|---|---|
| Admin aplikasi | `admin_depok` | `password` | `super_admin` |
| Koresponden | `koresponden_1` | `password` | `koresponden` |

Nilai akun dapat dioverride melalui `.env`. Kredensial contoh tidak boleh digunakan pada staging/production.

Admin `super_admin` melihat:

- Dashboard;
- Master Data;
- LiveScore Center;
- Perolehan Medali;
- City Guide;
- Media Library;
- Verifikasi;
- Audit Log;
- Profil Akun.

Role lain hanya melihat menu operasional yang diizinkan. Admin membaca role dari ID token dan access token untuk navigasi; API Gateway tetap memvalidasi JWT dan role untuk otorisasi sesungguhnya. Setelah role berubah, logout lalu login kembali agar token diperbarui.

## 6. Media Library

Metadata Media Library berada di PostgreSQL Master Data dan file runtime berada di named volume Docker `master_data_uploads`. Jangan menjalankan Master Data lokal terhadap database Docker karena folder upload lokal bukan volume tersebut.

Periksa metadata dan delivery asset:

```powershell
curl.exe -f http://localhost:8000/api/v1/master-data/media
curl.exe -I http://localhost:8000/uploads/<nama-file>
```

Soft delete media hanya menonaktifkan metadata/delivery. File fisik tidak dihapus sampai purge terkontrol berdasarkan kebijakan retensi.

Backup migrasi upload lokal 15 Juli 2026 berada di `runtime-backups/master-data-uploads-local-20260716` dan sengaja diabaikan Git/Docker build. Jangan menghapus backup sampai backup volume resmi diverifikasi.

## 7. Health Check

```powershell
curl.exe -f http://localhost:3000
curl.exe -f http://localhost:5173
curl.exe -f http://localhost:8000/health
curl.exe -f http://localhost:8080/realms/porprov/.well-known/openid-configuration
curl.exe -f http://localhost:18081/health
curl.exe -f http://localhost:18082/health
curl.exe -f http://localhost:18087/health
curl.exe -f http://localhost:8000/api/v1/master-data/cabors
curl.exe -f http://localhost:8000/api/v1/venues
curl.exe -f http://localhost:8000/api/v1/schedule/matches/enriched
curl.exe -f http://localhost:8000/api/v1/livescore/public
curl.exe -f http://localhost:8000/api/v1/medals/standings
curl.exe -f http://localhost:18222/healthz
curl.exe -f http://localhost:19090/-/ready
curl.exe -f http://localhost:13000/api/health
```

## 8. Debug Satu Komponen

Namespace `28xxx` tetap tersedia hanya untuk debugging terisolasi:

| Service | Port debug |
|---|---:|
| API Gateway | `28000` |
| User | `28001` |
| Master Data | `28081` |
| Schedule | `28082` |
| LiveScore | `28083` |
| Audit | `28084` |
| Realtime Gateway | `28085` |
| Medal Standing | `28086` |
| Venue | `28087` |

Sebelum debug, hentikan container domain yang sama. Contoh Venue:

```powershell
Set-Location .\infra\docker
docker --config .\.docker-cli compose stop venue-service
Set-Location ..\..\services\venue-service
$env:PORT = "28087"
$env:DATABASE_URL = "postgres://porprov_admin:porprov_secret@localhost:15432/venue_db?sslmode=disable"
$env:NATS_URL = "nats://localhost:14222"
$env:SCHEDULE_SERVICE_URL = "http://localhost:28082/api/v1"
go run .\cmd\api
```

Jangan menjadikan rangkaian debug ini sebagai full-stack kedua. Setelah selesai, hapus environment terminal atau tutup terminal, lalu hidupkan kembali container.

## 9. Menghentikan Stack

```powershell
Set-Location .\infra\docker
docker --config .\.docker-cli compose down
```

Jangan memakai `down -v`. Opsi tersebut menghapus database, state Redis/NATS, Grafana/Prometheus, dan file Media Library.

## 10. Troubleshooting

### Docker permission denied

Buka Docker Desktop sampai engine aktif. Bila user Windows belum menjadi anggota grup Docker:

```powershell
net localgroup docker-users $env:USERNAME /add
```

Logout atau restart Windows sesudahnya.

### Admin berbeda atau menu hilang

1. Pastikan URL Admin adalah `http://localhost:5173`, bukan port Vite lain.
2. Pastikan `keycloak-bootstrap` berstatus `Exited (0)`.
3. Logout lalu login sebagai `admin_depok` agar token membawa `super_admin`.
4. Hard refresh browser bila service worker/cache lama masih aktif.

### Media Library menampilkan gambar rusak

1. Periksa metadata melalui Gateway.
2. Pastikan URL `/uploads/*` merespons `200`.
3. Pastikan container `porprov_master_data` memasang volume `master_data_uploads` pada `/app/uploads`.
4. Jangan mengunggah melalui Master Data `go run` ketika database Docker digunakan.

### Keycloak `Invalid parameter: redirect_uri`

Periksa bahwa URL Admin adalah port `5173`, lalu jalankan ulang stack. Bootstrap client otomatis menyelaraskan callback `localhost`/`127.0.0.1:5173` dengan PKCE S256.

### Realtime `stream not found`

Pastikan NATS sehat dan `porprov_realtime` memakai source terbaru. Realtime Gateway membuat stream `LIVESCORE` dan `MEDALS` secara idempotent sebelum durable consumer dibuat.

### Gateway `502 Bad Gateway`

Periksa `docker compose ps` dan log upstream terkait. Gateway sehat tidak berarti seluruh upstream sehat.

Keputusan penyatuan runtime dan storage dicatat pada [`ADR-0005`](../adr/ADR-0005-canonical-compose-runtime-and-media-storage.md).
