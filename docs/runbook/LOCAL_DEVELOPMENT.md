# Runbook Menjalankan Portal PORPROV Depok di Lingkungan Lokal

> Diverifikasi untuk struktur repository per 15 Juli 2026. Jalankan perintah dari root repository `porprov-depok`, kecuali dinyatakan lain.

## 1. Pilih Satu Mode

| Mode | Kapan dipakai | Admin | API Gateway | Service domain |
|---|---|---:|---:|---|
| Docker Compose | Demo integrasi paling cepat dan stabil | `5173` | `8000` | Port internal Docker; diagnostik `18081/18082/18087` |
| Local development | Mengubah dan debug Go/React/Next.js | `5174` | `28000` | Namespace `28xxx` |

Jangan mengharapkan Admin dev terhubung ke Gateway Docker secara otomatis. `npm run dev` pada Admin memuat `.env.development` dan memakai `http://localhost:28000/api/v1`. Admin container Docker memakai Gateway Docker `http://localhost:8000/api/v1`.

## 2. Prasyarat

- Windows 10/11 dengan PowerShell.
- Docker Desktop dan Docker Compose v2.
- Go yang memenuhi versi tertinggi pada seluruh `go.mod` service; baseline repository saat ini adalah Go `1.26.4`.
- Node.js dan npm.
- Port pada registry di bagian berikut belum dipakai aplikasi lain.

Periksa versi:

```powershell
docker version
docker compose version
go version
node --version
npm.cmd --version
```

Jika Docker Desktop menolak `C:\Users\<user>\.docker\config.json`, gunakan helper dan Docker config lokal repository seperti contoh di bawah.

## 3. Registry Port

### Infrastruktur dan Web

| Komponen | URL/port host |
|---|---:|
| Public Web Next.js | `http://localhost:3000` |
| Admin Web Docker | `http://localhost:5173` |
| Admin Web local/Vite | `http://localhost:5174` |
| Keycloak | `http://localhost:8080` |
| PostgreSQL | `localhost:15432` |
| Redis | `localhost:16379` |
| NATS client/monitor | `localhost:14222` / `http://localhost:18222` |
| Prometheus | `http://localhost:19090` |
| Grafana | `http://localhost:13000` |

### Service Lokal (`go run`)

| Service | Port | Entry point |
|---|---:|---|
| API Gateway | `28000` | `services/api-gateway/main.go` |
| User Service | `28001` | `services/user-service/cmd/server` |
| Master Data Service | `28081` | `services/master-data-service/main.go` |
| Schedule Service | `28082` | `services/schedule-service/main.go` |
| LiveScore Service | `28083` | `services/livescore-service/main.go` |
| Audit Service | `28084` | `services/audit-service/cmd/server` |
| Realtime Gateway | `28085` | `services/realtime-gateway/main.go` |
| Medal Standing Service | `28086` | `services/medal-standing-service/main.go` |
| Venue Service | `28087` | `services/venue-service/cmd/api` |

## 4. Mode A — Seluruh Stack Core dengan Docker Compose

### 4.1 Siapkan environment

```powershell
Set-Location .\infra\docker

if (-not (Test-Path .\.env)) {
    Copy-Item .\.env.example .\.env
}
```

Nilai dalam `.env.example` hanya untuk development. Ganti seluruh password dan origin sebelum staging/production.

### 4.2 Jalankan Compose

```powershell
.\compose-up.ps1
```

Periksa container:

```powershell
docker --config .\.docker-cli compose ps
```

Compose menjalankan PostgreSQL, migrasi core, Redis, NATS, Keycloak, Master Data, Venue, Schedule, API Gateway, Admin Web, Nginx, Prometheus, dan Grafana.

### 4.3 Bootstrap Keycloak

Client bootstrap aman dijalankan berulang kali:

```powershell
Get-Content -Raw .\create_clients.sh | docker --config .\.docker-cli exec -i porprov_keycloak sh -c "tr -d '\r' | bash"
```

Untuk database development baru, buat role dan user contoh:

```powershell
Get-Content -Raw .\create_users.sh | docker --config .\.docker-cli exec -i porprov_keycloak sh -c "tr -d '\r' | bash"
```

Akun contoh hanya untuk lokal:

| Kegunaan | Username | Password |
|---|---|---|
| Admin aplikasi | `admin_depok` | `password` |
| Koresponden | `koresponden_1` | `password` |

### 4.4 Akses Docker stack

| Komponen | URL |
|---|---|
| Admin Web | `http://localhost:5173` |
| API Gateway health | `http://localhost:8000/health` |
| Keycloak | `http://localhost:8080` |
| Master diagnostik | `http://localhost:18081/health` |
| Schedule diagnostik | `http://localhost:18082/health` |
| Venue diagnostik | `http://localhost:18087/health` |

Browser aplikasi harus memakai API Gateway, bukan port diagnostik service.

## 5. Mode B — Infrastructure Docker + Semua Service Go Lokal

### 5.1 Jalankan infrastructure saja

```powershell
Set-Location .\infra\docker

if (-not (Test-Path .\.env)) {
    Copy-Item .\.env.example .\.env
}

.\compose-up.ps1 postgres redis nats keycloak prometheus grafana
```

### 5.2 Jalankan migrasi service core

Masih dari `infra/docker`:

```powershell
docker --config .\.docker-cli compose run --rm migrate-master-data
docker --config .\.docker-cli compose run --rm migrate-venue
docker --config .\.docker-cli compose run --rm migrate-schedule
```

Jalankan bootstrap Keycloak seperti bagian 4.3, lalu kembali ke root repository:

```powershell
Set-Location ..\..
```

### 5.3 Siapkan Venue lokal

```powershell
if (-not (Test-Path .\services\venue-service\.env)) {
    Copy-Item .\services\venue-service\.env.example .\services\venue-service\.env
}
```

Pastikan file Venue lokal memakai PostgreSQL `15432`, NATS `14222`, Schedule `28082`, dan port service `28087`.

### 5.4 Jalankan lima service core

Buka terminal PowerShell terpisah untuk setiap command. Jalankan Gateway paling akhir.

Terminal 1 — Master Data:

```powershell
Set-Location .\services\master-data-service
go run main.go
```

Terminal 2 — Venue:

```powershell
Set-Location .\services\venue-service
go run ./cmd/api
```

Terminal 3 — Schedule:

```powershell
Set-Location .\services\schedule-service
go run main.go
```

Terminal 4 — Realtime Gateway:

```powershell
Set-Location .\services\realtime-gateway
go run main.go
```

Terminal 5 — API Gateway:

```powershell
Set-Location .\services\api-gateway
go run main.go
```

### 5.5 Migrasi service tambahan

User, Audit, dan Medal belum memiliki migration container di Compose. Dengan credential development default, jalankan dari root repository:

```powershell
Get-Content -Raw .\services\user-service\migrations\000001_create_users_table.up.sql | docker --config .\infra\docker\.docker-cli exec -i porprov_postgres psql -v ON_ERROR_STOP=1 -U porprov_admin -d user_service_db

Get-Content -Raw .\services\audit-service\migrations\000001_create_audit_logs.up.sql | docker --config .\infra\docker\.docker-cli exec -i porprov_postgres psql -v ON_ERROR_STOP=1 -U porprov_admin -d audit_db

Get-Content -Raw .\services\medal-standing-service\migrations\000001_create_medals_table.up.sql | docker --config .\infra\docker\.docker-cli exec -i porprov_postgres psql -v ON_ERROR_STOP=1 -U porprov_admin -d porprov_db
```

Migration SQL menggunakan operasi idempotent hanya pada bagian extension; pembuatan tabel dapat gagal bila dijalankan ulang. Error `relation already exists` berarti tabel sudah tersedia dan tidak perlu dibuat ulang.

### 5.6 Jalankan service tambahan yang mempunyai executable

Buka terminal terpisah.

User Service:

```powershell
Set-Location .\services\user-service
go run ./cmd/server
```

Audit Service:

```powershell
Set-Location .\services\audit-service
go run ./cmd/server
```

LiveScore Service membutuhkan override NATS karena fallback source-nya masih port internal `4222`:

```powershell
Set-Location .\services\livescore-service
$env:NATS_URL = "nats://localhost:14222"
go run main.go
```

Medal Standing Service:

```powershell
Set-Location .\services\medal-standing-service
go run main.go
```

Status implementasi service tambahan masih mengikuti `FEATURES.md`. Dapat dijalankan bukan berarti fiturnya sudah production-ready.

Realtime Gateway saat ini belum membaca password Redis dari environment. Koneksi NATS dan endpoint SSE tetap dapat berjalan, tetapi penulisan cache initial-state akan mencatat error autentikasi ketika memakai Redis Compose yang dilindungi password. Ini adalah gap hardening yang harus diselesaikan sebelum Realtime dinyatakan production-ready.

### 5.7 Folder service yang belum dapat dijalankan

Folder berikut belum mempunyai `go.mod` dan entrypoint executable:

- `services/auth-adapter-service`
- `services/file-service`
- `services/notification-service`

Jangan membuat command startup fiktif untuk ketiganya. Implementasinya masih tahap berikutnya.

## 6. Menjalankan Web Publik

Buka terminal baru dari root repository:

```powershell
Set-Location .\apps\public-web-nextjs
npm.cmd ci
npm.cmd run dev -- --port 3000
```

Akses `http://localhost:3000`.

Public Web membaca seluruh data melalui API Gateway `28000`. Jadwal, LiveScore, dan Klasemen sudah terhubung pada tahap v0.2, tetapi event versioning, autentikasi stream, workflow verifikasi skor/medali, dan scale-out tetap mengikuti status in-progress di `FEATURES.md`.

## 7. Menjalankan Web Admin

Mode local development membutuhkan API Gateway lokal `28000` dan Keycloak `8080`.

```powershell
Set-Location .\apps\admin-web-react
npm.cmd ci
npm.cmd run dev -- --host 0.0.0.0 --port 5174 --strictPort
```

Akses `http://localhost:5174` dan login melalui Keycloak. `.env.development` sudah berisi:

```dotenv
VITE_API_URL=http://localhost:28000/api/v1
VITE_OIDC_AUTHORITY=http://localhost:8080/realms/porprov
VITE_OIDC_CLIENT_ID=porprov-admin-web
```

Untuk mode Docker, jangan jalankan Vite; gunakan Admin container pada `http://localhost:5173`.

## 8. Pemeriksaan Kesehatan

### 8.1 Core lokal

```powershell
curl.exe -f http://localhost:28000/health
curl.exe -f http://localhost:28081/health
curl.exe -f http://localhost:28082/health
curl.exe -f http://localhost:28087/health
curl.exe -f http://localhost:8080/realms/porprov/.well-known/openid-configuration
```

Realtime Gateway belum mempunyai `/health`. Periksa listener dan koneksi SSE:

```powershell
netstat -ano | findstr ":28085"
curl.exe -N --max-time 5 http://localhost:28085/api/v1/stream/events
```

### 8.2 Service tambahan

```powershell
curl.exe -f http://localhost:28001/health
curl.exe -f http://localhost:28084/health
curl.exe -f http://localhost:28086/api/v1/medals/standings
```

LiveScore dapat diuji dengan event nonpersisten:

```powershell
curl.exe -f -X POST http://localhost:28083/api/v1/livescore/update `
  -H "Content-Type: application/json" `
  -d '{"matchId":"smoke-test","scoreA":0,"scoreB":0,"status":"Uji"}'
```

### 8.3 Web

```powershell
curl.exe -f http://localhost:3000
curl.exe -f http://localhost:5174
```

## 9. Menghentikan Aplikasi

- Service/web yang dijalankan di foreground: tekan `Ctrl+C` pada terminal masing-masing.
- Docker Compose:

```powershell
Set-Location .\infra\docker
docker --config .\.docker-cli compose down
```

Jangan memakai `docker compose down -v` kecuali memang berniat menghapus seluruh database, Redis, NATS, dan file Media Library lokal.

## 10. Troubleshooting

### Port already in use

```powershell
netstat -ano | findstr ":5174 :28000 :28081 :28082 :28085 :28087"
```

Hentikan proses lama melalui terminal asalnya. Jangan menjalankan dua instance service pada port yang sama.

### Admin menampilkan “Tidak dapat terhubung ke API”

1. Pastikan Admin dev memuat Gateway `28000`.
2. Pastikan `http://localhost:28000/health` merespons `200`.
3. Restart `go run main.go` API Gateway setelah perubahan kode; Go tidak hot reload.
4. Pastikan Master `28081`, Schedule `28082`, dan Venue `28087` aktif.

### Keycloak `Invalid parameter: redirect_uri`

Jalankan ulang bootstrap client pada bagian 4.3. Client development mengizinkan `localhost`/`127.0.0.1` port `5173` dan `5174`.

### Realtime gagal dengan `stream not found`

Gunakan source terbaru dan jalankan `go run main.go`. Realtime Gateway membuat/menyelaraskan stream `LIVESCORE` dan `MEDALS` sebelum consumer dibuat. Pastikan NATS host `14222` aktif.

### Gateway mengembalikan `502 Bad Gateway`

Gateway sehat tidak berarti upstream sehat. Cocokkan endpoint dengan service berikut:

| Route Gateway | Upstream lokal |
|---|---|
| `/api/v1/master-data/*` | `28081` |
| `/api/v1/schedule/*` | `28082` |
| `/api/v1/stream/*` | `28085` |
| `/api/v1/medals/*` | `28086` |
| `/api/v1/venues/*` | `28087` |

### Docker permission denied

Pastikan Docker Desktop aktif. Jika user belum tergabung dalam grup Docker:

```powershell
net localgroup docker-users $env:USERNAME /add
```

Logout atau restart Windows setelah perubahan grup.
