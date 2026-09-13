# Runbook VPS Ubuntu Intranet

> Ringkasan ini harus digunakan bersama
> [`DEPLOYMENT_VPS.md`](../../DEPLOYMENT_VPS.md) di root. Jika ada perbedaan,
> ikuti `RULES.md` dan `DEPLOYMENT_VPS.md`. Agent AI dilarang memulai
> deployment hanya dari ringkasan ini tanpa membaca gate keamanan, backup,
> rollback, dan handoff pada pedoman kanonis.

Credential, private key, `.env`, dump database, dan sertifikat privat dilarang
masuk Git.

## Endpoint

| Area | Endpoint |
|---|---|
| Public Web | `https://porprov.depok.go.id/` (`http://` hanya redirect) |
| Admin Web | `https://porprov.depok.go.id/admin/` |
| API browser | `https://porprov.depok.go.id/api/v1` |
| Keycloak browser | `https://porprov.depok.go.id/realms/porprov` |

Admin, Keycloak, dan token API wajib memakai origin HTTPS canonical yang sama.
Alamat IP hanya dipakai operator untuk koneksi SSH atau pemeriksaan SNI
loopback; alamat IP HTTP bukan origin aplikasi dan bukan secure context browser.

Jika Public/Admin/API/Keycloak direcreate, reload atau recreate Nginx setelah
upstream stabil lalu jalankan smoke HTTPS. Nginx dapat mempertahankan alamat IP
container lama dan mengembalikan 502 walaupun container baru sudah sehat.

## Job Tahan Reconnect

Build, restore, atau migrasi panjang tidak boleh bergantung pada sesi SSH.
Jalankan sebagai job Ubuntu:

```bash
cd ~/porprov-depok/infra/docker
mkdir -p ~/porprov-deploy-logs
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
nohup ./deploy-vps.sh \
  > "$HOME/porprov-deploy-logs/deploy-$stamp.log" 2>&1 \
  < /dev/null &
echo "$!" > "$HOME/porprov-deploy-logs/deploy-$stamp.pid"
```

Pantau tanpa mengambil alih proses:

```bash
tail -n 100 -f ~/porprov-deploy-logs/deploy-*.log
```

Client SSH operator memakai keepalive:

```sshconfig
Host porprov-intranet
    HostName <IP-VPS>
    User <USER-VPS>
    ServerAliveInterval 15
    ServerAliveCountMax 8
    TCPKeepAlive yes
```

`deploy-vps.sh` idempotent dan memakai `flock`, sehingga reconnect atau
pengulangan perintah tidak menjalankan dua deployment bersamaan.

## TLS

Gunakan sertifikat resmi yang mencakup `porprov.depok.go.id`. Pemasangan
canonical memakai installer dengan backup dan rollback otomatis:

```bash
cd ~/porprov-depok/infra/docker
./install-official-tls.sh <FULLCHAIN_PEM> <PRIVATE_KEY_PEM>
```

Private key tidak boleh masuk Git, prompt, log, atau dibagikan ke klien. Mode CA
lokal dari `generate-intranet-tls.sh` hanya untuk pengujian terisolasi dan bukan
identitas production.

## Environment VPS

Nilai non-secret minimum:

```dotenv
APP_ENV=production
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_SITE_URL=https://porprov.depok.go.id
VITE_API_URL=/api/v1
VITE_OIDC_AUTHORITY=https://porprov.depok.go.id/realms/porprov
VITE_OIDC_CLIENT_ID=porprov-admin-web
VITE_BASE_PATH=/admin/
KEYCLOAK_PUBLIC_HOST=porprov.depok.go.id
KEYCLOAK_ISSUER=https://porprov.depok.go.id/realms/porprov
CORS_ALLOWED_ORIGINS=https://porprov.depok.go.id
ADMIN_REDIRECT_URIS=["https://porprov.depok.go.id/admin/*"]
ADMIN_WEB_ORIGINS=["https://porprov.depok.go.id"]
PORPROV_DEPLOY_COMMIT=<full SHA commit yang disetujui>
```

Semua secret wajib acak, unik, dan hanya berada di `.env` VPS.

Setelah deployment, verifikasi bahwa Public mengirim satu CSP dengan nonce unik
tanpa `script-src unsafe-inline`, API dan Public sama-sama menerima HSTS,
`X-Powered-By` tidak tersedia, versi patch Nginx tidak terlihat, dan malformed
route Cabor menghasilkan 404. Perintah kanonis serta larangan duplicate CSP
berada di Bagian 16 `DEPLOYMENT_VPS.md`.

Schedule Service wajib menggunakan image yang memuat connection pool (`pgxpool`). Setelah restore database atau deploy image baru, verifikasi endpoint enriched secara konkuren; response `500` dengan log `conn busy` menandakan image lama masih aktif dan Schedule Service perlu dibangun ulang melalui job deploy canonical.

## Backup dan Restore

Sebelum restore, buat dump custom-format per database, arsip volume
`master_data_uploads`, salin `.env`, lalu tulis `SHA256SUMS`. Hentikan service
domain dan Keycloak selama restore. Pertahankan backup rollback sampai count
tabel, hash Media Library, health check, login OIDC, dan smoke test lulus.
