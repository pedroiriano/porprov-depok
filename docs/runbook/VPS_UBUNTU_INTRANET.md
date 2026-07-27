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
| Public Web intranet | `http://<IP-VPS>/` dan `https://<IP-VPS>/` |
| Admin Web | `https://<IP-VPS>/admin/` |
| API browser | `http(s)://<IP-VPS>/api/v1` |
| Keycloak browser | `https://<IP-VPS>/realms/porprov` |

Admin, Keycloak, dan token API wajib memakai HTTPS. Alamat IP HTTP bukan secure
context browser sehingga Authorization Code + PKCE gagal saat membentuk code
challenge melalui Web Crypto.

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

## TLS Intranet

Gunakan PKI resmi Diskominfo bila tersedia. Untuk tahap intranet tanpa PKI:

```bash
cd ~/porprov-depok/infra/docker
PORPROV_TLS_IP=<IP-VPS> ./generate-intranet-tls.sh
```

Distribusikan hanya `infra/docker/tls/ca.crt` ke trust store perangkat operator.
Jangan pernah menyalin `ca.key` atau `server.key` ke klien.

## Environment VPS

Nilai non-secret minimum:

```dotenv
APP_ENV=production
NEXT_PUBLIC_API_URL=http://<IP-VPS>/api/v1
NEXT_PUBLIC_SITE_URL=http://<IP-VPS>
VITE_API_URL=https://<IP-VPS>/api/v1
VITE_OIDC_AUTHORITY=https://<IP-VPS>/realms/porprov
VITE_OIDC_CLIENT_ID=porprov-admin-web
VITE_BASE_PATH=/admin/
KEYCLOAK_PUBLIC_HOST=<IP-VPS>
KEYCLOAK_ISSUER=https://<IP-VPS>/realms/porprov
CORS_ALLOWED_ORIGINS=https://<IP-VPS>
ADMIN_REDIRECT_URIS=["https://<IP-VPS>/admin/*"]
ADMIN_WEB_ORIGINS=["https://<IP-VPS>"]
```

Semua secret wajib acak, unik, dan hanya berada di `.env` VPS.

Schedule Service wajib menggunakan image yang memuat connection pool (`pgxpool`). Setelah restore database atau deploy image baru, verifikasi endpoint enriched secara konkuren; response `500` dengan log `conn busy` menandakan image lama masih aktif dan Schedule Service perlu dibangun ulang melalui job deploy canonical.

## Backup dan Restore

Sebelum restore, buat dump custom-format per database, arsip volume
`master_data_uploads`, salin `.env`, lalu tulis `SHA256SUMS`. Hentikan service
domain dan Keycloak selama restore. Pertahankan backup rollback sampai count
tabel, hash Media Library, health check, login OIDC, dan smoke test lulus.
