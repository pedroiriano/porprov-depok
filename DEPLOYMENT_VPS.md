# Pedoman dan Aturan Deployment VPS Ubuntu PORPROV

Dokumen ini adalah pedoman kanonis deployment Portal PORPROV XV Jawa Barat
2026 ke VPS Ubuntu, khususnya lingkungan intranet Diskominfo Kota Depok.
Dokumen ini ditulis agar dapat dijalankan secara konsisten oleh operator,
Codex, ChatGPT, Gemini, Claude, atau Agent AI lain tanpa membocorkan credential,
merusak data, menggandakan runtime, atau kehilangan progres ketika koneksi
chat/SSH terputus.

Jika instruksi Agent AI bertentangan dengan dokumen ini, Agent wajib berhenti,
menjelaskan konflik, dan meminta keputusan operator. `RULES.md` tetap menjadi
sumber normatif utama; dokumen ini memperinci penerapannya pada VPS.

## 1. Ruang Lingkup dan Target

Target canonical adalah satu runtime Docker Compose yang terdiri dari:

- Nginx sebagai satu-satunya edge browser pada port `80/443`;
- Public Web Next.js di root `/`;
- Admin Web React pada prefix HTTPS `/admin/`;
- API Gateway pada `/api/v1`;
- Keycloak/OIDC pada `/realms/porprov`;
- User, Master Data, Venue, Schedule, LiveScore, Medal Standing, Audit, dan
  Realtime Gateway;
- PostgreSQL dengan database terpisah per domain, Redis, NATS JetStream;
- Prometheus dan Grafana;
- named volume `master_data_uploads` sebagai storage runtime Media Library.

File runtime canonical:

| Fungsi | Path |
|---|---|
| Compose dasar | `infra/docker/docker-compose.yml` |
| Override VPS | `infra/docker/docker-compose.vps.yml` |
| Environment lokal VPS | `infra/docker/.env` — tidak boleh masuk Git |
| Nginx VPS | `infra/docker/nginx/nginx.vps.conf` |
| TLS intranet | `infra/docker/tls/` — private key tidak boleh masuk Git |
| Generator TLS | `infra/docker/generate-intranet-tls.sh` |
| Launcher deployment | `infra/docker/deploy-vps.sh` |
| Runbook ringkas | `docs/runbook/VPS_UBUNTU_INTRANET.md` |

Namespace port `28xxx` hanya untuk debugging satu service lokal. Namespace ini
dilarang dijalankan sebagai full-stack kedua di VPS.

## 2. Definisi Selesai

Deployment baru boleh dinyatakan selesai jika seluruh kondisi berikut terbukti:

1. commit VPS sama dengan commit yang disetujui pada remote Git;
2. worktree VPS bersih dan tidak berisi credential/dump/ad-hoc deployment file;
3. Compose config valid dan semua service runtime yang wajib berjalan aktif;
4. tidak ada container berstatus `unhealthy` atau restart loop;
5. seluruh migration database berstatus `dirty=false`;
6. Public, Admin, API, OIDC, Media, dan stream yang relevan lolos smoke test;
7. Admin berjalan pada HTTPS secure context dan PKCE tetap aktif;
8. callback, issuer, CORS, dan Web Origin mengarah ke origin canonical;
9. jumlah record penting dan checksum Media cocok dengan sumber migrasi;
10. backup rollback, manifest SHA-256, log job, PID, status, dan commit tersedia;
11. log pascadeploy tidak memuat `panic`, `fatal`, `conn busy`, OOM, atau loop
    error berulang;
12. hasil, risiko, rollback point, dan pekerjaan tersisa diserahkan kepada
    operator secara tertulis.

Response HTTP `200` dari halaman saja tidak cukup untuk menyatakan deployment
selesai. Empty state akibat data tidak termigrasi, issuer salah, asset `404`,
atau login gagal tetap berarti deployment belum selesai.

## 3. Kontrak Wajib untuk Agent AI

Sebelum menjalankan perintah apa pun, Agent AI wajib:

1. membaca `AI.md`, `RULES.md`, `FEATURES.md`, `DOCUMENTATION.md`, `README.md`,
   `AGENTS.md`, dan dokumen ini;
2. membaca `docs/runbook/VPS_UBUNTU_INTRANET.md` serta file Compose/deploy/TLS
   yang benar-benar akan dipakai;
3. menginventarisasi kondisi lokal dan VPS secara read-only;
4. menyusun rencana, rollback point, perubahan state, dan bukti keberhasilan;
5. meminta persetujuan eksplisit sebelum tindakan destruktif atau persisten;
6. memecah operasi menjadi langkah pendek, idempotent, dan dapat dilanjutkan;
7. menjalankan operasi panjang sebagai job server-side tahan putus;
8. tidak menganggap output Agent AI sebelumnya benar tanpa verifikasi.

### 3.1 Tindakan yang Wajib Meminta Persetujuan Eksplisit

- restore yang mengganti isi database atau volume;
- menghapus file, volume, image, database, backup, atau sertifikat;
- `git push --force`, rewrite history, rebase branch bersama, atau penggantian
  branch production;
- rotasi password, SSH key, token, client secret, atau private CA;
- memasang CA ke trust store perangkat;
- mengubah firewall, SSH daemon, sudoers, DNS, port, atau service systemd;
- menonaktifkan akun, role, sesi, atau akses operator;
- rollback yang mengubah schema/data;
- purge fisik data yang secara domain seharusnya soft delete.

Persetujuan umum seperti “perbaiki VPS” tidak otomatis mengizinkan seluruh
tindakan di atas. Agent harus menyebut tindakan, target, dampak, dan rollback.

### 3.2 Larangan Mutlak Agent AI

Agent dilarang:

- meminta atau menyalin password/private key ke prompt, source code, Markdown,
  shell history, log, issue, commit, atau chat publik;
- membuat `install_vps.sh`, `deploy*.js`, dump SQL, atau file sementara yang
  memuat credential di dalam repository;
- menampilkan nilai `.env`, JWT, password, cookie, session, private key, atau
  connection string pada output;
- memakai `StrictHostKeyChecking=no`, menerima fingerprint berubah secara
  otomatis, atau melemahkan verifikasi TLS;
- menonaktifkan PKCE, issuer validation, audience/client validation, atau HTTPS
  untuk menyelesaikan error login;
- memakai `git reset --hard`, `git clean -fdx`, `docker compose down -v`,
  `docker volume rm`, `DROP DATABASE`, atau recursive delete tanpa backup,
  verifikasi target absolut, dan persetujuan eksplisit;
- menjalankan dua deployment, restore, atau migration secara bersamaan;
- menjalankan Public/Admin dengan dev server sebagai pengganti image production;
- mengakses service domain langsung dari browser melalui port diagnostik;
- mengklaim sukses berdasarkan asumsi atau satu health endpoint;
- menghapus row/file bisnis secara hard delete untuk “menyamakan data”.

## 4. Klasifikasi Informasi dan Secret

| Kelas | Contoh | Boleh di Git | Boleh di log/chat |
|---|---|---:|---:|
| Publik | nama service, port internal, URL tanpa token | Ya | Ya |
| Internal | IP intranet, hostname, topologi | Hanya bila disetujui | Secukupnya |
| Rahasia | password, JWT, client secret, DB URL | Tidak | Tidak |
| Sangat rahasia | SSH private key, CA key, backup produksi | Tidak | Tidak |

Aturan penyimpanan:

- `.env` VPS harus `chmod 600` dan dimiliki akun deployment;
- private key TLS/CA harus `chmod 600`; direktori TLS `chmod 700`;
- backup harus berada di direktori non-web, permission ketat, dan memiliki
  checksum;
- secret production harus unik, acak, bukan nilai `.env.example`, dan lebih
  baik dikelola secret manager;
- credential yang pernah masuk Git/chat dianggap bocor dan wajib dirotasi;
- menghapus secret dari HEAD tidak menghapusnya dari history.

Sebelum commit/push, jalankan minimal:

```bash
git status --short
git diff --check
git grep -nEi '(password|secret|token|private.key)[[:space:]]*[:=][[:space:]]*[^<${]'
git ls-files | grep -Ei '(^|/)(\.env|.*\.key|.*\.pem|data.*\.sql|.*\.dump)$' || true
```

Hasil harus ditinjau manusia karena pemindaian pola dapat menghasilkan false
positive dan tidak menggantikan secret scanner CI.

## 5. Placeholder yang Digunakan

Semua contoh memakai placeholder berikut. Jangan menggantinya di file Git:

| Placeholder | Makna |
|---|---|
| `<VPS_HOST>` | IP/hostname VPS yang sudah diverifikasi |
| `<VPS_USER>` | akun deployment non-root |
| `<REPO_URL>` | URL repository resmi |
| `<DEPLOY_COMMIT>` | full SHA commit yang disetujui |
| `<KNOWN_GOOD_COMMIT>` | commit rollback terakhir yang sehat |
| `<BACKUP_DIR>` | direktori backup absolut di VPS |
| `<MIGRATION_DIR>` | paket migrasi non-Git yang sudah diverifikasi |

Contoh lingkungan aktif boleh memakai IP intranet resmi yang diberikan
operator, tetapi password tidak pernah ditulis di dokumen atau perintah.

## 6. Persiapan Akses SSH yang Aman

### 6.1 Verifikasi Fingerprint

Operator harus memperoleh fingerprint SSH melalui kanal tepercaya yang berbeda
dari sesi SSH. Saat koneksi pertama:

```bash
ssh-keygen -R <VPS_HOST>  # hanya jika pergantian host memang telah disahkan
ssh <VPS_USER>@<VPS_HOST>
```

Bandingkan fingerprint secara exact. Jika berubah, berhenti. Jangan menerima
fingerprint baru hanya karena Agent menyatakan aman.

### 6.2 Gunakan SSH Key

Gunakan key khusus deployment dengan passphrase dan permission lokal ketat.
Pemasangan public key ke `authorized_keys` adalah perubahan persisten dan harus
disetujui operator. Setelah key diuji pada sesi kedua, password login baru boleh
dirotasi atau dinonaktifkan sesuai kebijakan Diskominfo.

Konfigurasi client agar gangguan jaringan tidak mematikan sesi interaktif:

```sshconfig
Host porprov-intranet
    HostName <VPS_HOST>
    User <VPS_USER>
    IdentityFile ~/.ssh/porprov_deploy_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 15
    ServerAliveCountMax 8
    TCPKeepAlive yes
```

Keepalive hanya menjaga sesi SSH. Operasi panjang tetap harus menjadi job
server-side karena aplikasi chat/Codex dapat reconnect secara independen.

## 7. Preflight Lokal dan VPS

### 7.1 Preflight Repository Lokal

```bash
git fetch --all --prune
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git log -5 --oneline --decorate
```

Pastikan perubahan lokal milik operator tidak tertimpa. Test sesuai perubahan:

```bash
# Contoh; jalankan hanya service/app yang relevan dan seluruh gate wajib CI.
go test ./...
npm run lint
npm run build
docker compose -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.vps.yml config --quiet
```

### 7.2 Preflight VPS Read-only

```bash
uname -a
lsb_release -a 2>/dev/null || cat /etc/os-release
df -h
free -h
docker version
docker compose version
cd "$HOME/porprov-depok"
git status --short
git rev-parse HEAD
docker compose -f infra/docker/docker-compose.yml \
  -f infra/docker/docker-compose.vps.yml ps
docker ps --filter health=unhealthy
```

Jangan lanjut jika disk hampir penuh, memory/swap kritis, worktree kotor tidak
dikenali, ada restore lain berjalan, atau backup rollback belum tersedia.

## 8. Instalasi Baseline Ubuntu

Paket minimum adalah Git, Docker Engine dari sumber resmi, Docker Compose
plugin, OpenSSL, curl, `flock`/util-linux, dan alat monitoring dasar. Instalasi
paket serta perubahan group Docker membutuhkan persetujuan sudo operator.

Setelah pemasangan:

```bash
sudo systemctl enable --now docker
docker version
docker compose version
openssl version
command -v flock curl git
```

Hindari installer tidak terverifikasi dan jangan menjalankan script internet
langsung dengan pola `curl ... | sudo bash` tanpa audit sumber/checksum.

### 8.1 Network Exposure dan Firewall

Ingress aplikasi production hanya boleh mencapai Nginx `80/443`. SSH `22`
hanya boleh berasal dari jaringan/host manajemen yang disetujui. Port host
PostgreSQL, Redis, NATS, Keycloak, API Gateway, frontend, service diagnostik,
Prometheus, dan Grafana harus dibatasi ke localhost atau jaringan admin sesuai
kebutuhan; port tersebut bukan endpoint publik.

```bash
ss -lntp
docker ps --format 'table {{.Names}}\t{{.Ports}}'
sudo nft list ruleset 2>/dev/null || sudo iptables -S
```

Perubahan firewall harus dikoordinasikan dengan administrator Diskominfo.
Docker dapat memasang rule iptables sendiri, sehingga aturan UFW saja tidak
boleh diasumsikan cukup; verifikasi exposure dari host lain pada segmen yang
relevan. Jangan menutup SSH aktif sebelum sesi kedua berhasil diuji.

Sinkronisasi waktu wajib sehat karena JWT/OIDC dan log audit bergantung pada
clock yang benar:

```bash
timedatectl status
```

## 9. Checkout Kode yang Reproducible

Clone pertama:

```bash
cd "$HOME"
git clone <REPO_URL> porprov-depok
cd porprov-depok
git fetch origin main
git switch main
git pull --ff-only origin main
test "$(git rev-parse HEAD)" = "<DEPLOY_COMMIT>"
test -z "$(git status --porcelain)"
```

Update berikutnya wajib `--ff-only`. Jangan mengedit source production langsung
di VPS. Koreksi dibuat di repository lokal, diuji, di-review, di-commit, lalu
ditarik oleh VPS.

Catat sebelum deploy:

```bash
git rev-parse HEAD > "$HOME/porprov-known-good-commit.txt"
```

## 10. Environment Production

```bash
cd "$HOME/porprov-depok/infra/docker"
umask 077
test -f .env || cp .env.example .env
chmod 600 .env
```

Edit `.env` melalui terminal aman. Jangan mencetak file ke layar/log. Nilai
minimum non-secret VPS:

```dotenv
APP_ENV=production
NEXT_PUBLIC_API_URL=http://<VPS_HOST>/api/v1
NEXT_PUBLIC_SITE_URL=http://<VPS_HOST>
VITE_API_URL=https://<VPS_HOST>/api/v1
VITE_OIDC_AUTHORITY=https://<VPS_HOST>/realms/porprov
VITE_OIDC_CLIENT_ID=porprov-admin-web
VITE_BASE_PATH=/admin/
KEYCLOAK_PUBLIC_HOST=<VPS_HOST>
KEYCLOAK_ISSUER=https://<VPS_HOST>/realms/porprov
CORS_ALLOWED_ORIGINS=https://<VPS_HOST>
ADMIN_REDIRECT_URIS=["https://<VPS_HOST>/admin/*"]
ADMIN_WEB_ORIGINS=["https://<VPS_HOST>"]
```

Catatan:

- `KC_HOSTNAME` pada image Keycloak aktif menerima hostname/IP tanpa scheme;
- issuer eksternal tetap HTTPS karena Nginx mengirim `X-Forwarded-Proto`;
- Admin hanya canonical pada `/admin/` dan tidak boleh dibangun dengan base `/`;
- `INTERNAL_STREAM_TOKEN`, password PostgreSQL/Redis/Keycloak/Grafana, dan
  akun bootstrap harus diganti dengan nilai acak yang berbeda;
- jangan memakai default `.env.example` pada VPS;
- Public HTTP hanya transisi intranet; Admin/OIDC/API bertoken tetap HTTPS.

Validasi tanpa mencetak secret:

```bash
required=(POSTGRES_PASSWORD REDIS_PASSWORD INTERNAL_STREAM_TOKEN \
  KEYCLOAK_ADMIN_PASSWORD PORPROV_ADMIN_PASSWORD \
  PORPROV_KORESPONDEN_PASSWORD GRAFANA_PASSWORD)
for key in "${required[@]}"; do
  grep -qE "^${key}=.{20,}$" .env || {
    echo "secret belum valid: ${key}" >&2
    exit 1
  }
done
```

## 11. TLS Intranet dan Trust Store

Gunakan sertifikat resmi PKI Diskominfo bila tersedia. Private CA proyek hanya
fallback intranet.

```bash
cd "$HOME/porprov-depok/infra/docker"
PORPROV_TLS_IP=<VPS_HOST> ./generate-intranet-tls.sh
openssl verify -CAfile tls/ca.crt tls/server.crt
openssl x509 -in tls/server.crt -noout -subject -issuer -dates \
  -ext subjectAltName
```

Aturan:

- SAN harus memuat IP/hostname yang benar;
- hanya `ca.crt` yang boleh dibagikan ke klien;
- `ca.key` dan `server.key` tidak pernah meninggalkan VPS/PKI authority;
- pemasangan CA ke trust store wajib persetujuan eksplisit;
- browser harus ditutup seluruh prosesnya dan dibuka ulang setelah CA dipasang;
- `--insecure`, browser flag ignore-certificate, dan penonaktifan verifikasi
  bukan solusi production.

Contoh Windows Current User setelah operator menyetujui:

```powershell
certutil.exe -user -addstore Root .\porprov-intranet-ca.crt
curl.exe --ssl-no-revoke -I https://<VPS_HOST>/admin/
```

Contoh Ubuntu client:

```bash
sudo install -m 0644 porprov-intranet-ca.crt \
  /usr/local/share/ca-certificates/porprov-intranet-ca.crt
sudo update-ca-certificates
curl -I https://<VPS_HOST>/admin/
```

## 12. Backup Wajib Sebelum Deploy/Restore

Backup harus selesai dan terverifikasi sebelum mutation. Gunakan direktori baru:

```bash
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="$HOME/porprov-backups/$stamp"
mkdir -p "$BACKUP_DIR/databases"
chmod 700 "$HOME/porprov-backups" "$BACKUP_DIR"
```

Dump tujuh database domain dalam custom format:

```bash
databases=(master_data_db venue_db schedule_db livescore_db \
  porprov_db audit_db user_service_db)
for db in "${databases[@]}"; do
  docker exec porprov_postgres sh -c \
    'pg_dump -Fc --no-owner --no-privileges -U "$POSTGRES_USER" -d "$1"' \
    sh "$db" > "$BACKUP_DIR/databases/$db.dump"
  test -s "$BACKUP_DIR/databases/$db.dump"
done
```

Backup Media Library tanpa mengubah volume:

```bash
media_volume="$(docker volume ls -q \
  --filter label=com.docker.compose.volume=master_data_uploads | head -n1)"
test -n "$media_volume"
docker run --rm \
  -v "$media_volume:/data:ro" \
  -v "$BACKUP_DIR:/backup" \
  alpine:3.21 sh -c 'tar -C /data -czf /backup/master_data_uploads.tgz .'
```

Simpan konfigurasi secara terbatas dan buat manifest:

```bash
install -m 0600 "$HOME/porprov-depok/infra/docker/.env" \
  "$BACKUP_DIR/docker.env"
cp "$HOME/porprov-depok/infra/docker/tls/ca.crt" "$BACKUP_DIR/ca.crt"
git rev-parse HEAD > "$BACKUP_DIR/git-commit.txt"
find "$BACKUP_DIR" -type f ! -name SHA256SUMS -print0 \
  | sort -z | xargs -0 sha256sum > "$BACKUP_DIR/SHA256SUMS"
sha256sum -c "$BACKUP_DIR/SHA256SUMS"
```

Backup berisi secret dan tidak boleh diunggah ke Git/Drive publik. Terapkan
retensi dan enkripsi sesuai kebijakan Diskominfo.

## 13. Migrasi Data Lokal ke VPS

Migrasi harus memakai paket immutable yang memuat:

- dump custom-format tujuh database;
- arsip `master_data_uploads.tgz`;
- `SHA256SUMS`;
- manifest sumber: commit, waktu, versi migration, dan row count penting;
- tanpa `.env`, password, private key, atau credential.

Transfer melalui SCP/SFTP pada kanal terverifikasi:

```bash
scp -r <MIGRATION_DIR> <VPS_USER>@<VPS_HOST>:$HOME/porprov-migration/incoming
```

Pada VPS:

```bash
cd "$HOME/porprov-migration/incoming"
sha256sum -c SHA256SUMS
```

Restore wajib maintenance window, backup rollback, dan persetujuan eksplisit.
Hentikan writer terlebih dahulu, tetapi pertahankan PostgreSQL:

```bash
cd "$HOME/porprov-depok/infra/docker"
compose=(docker compose -f docker-compose.yml -f docker-compose.vps.yml)
"${compose[@]}" stop user-service master-data-service venue-service \
  schedule-service livescore-service medal-standing-service audit-service \
  realtime-gateway api-gateway keycloak keycloak-bootstrap
```

Restore database:

```bash
for db in master_data_db venue_db schedule_db livescore_db \
  porprov_db audit_db user_service_db; do
  dump="$HOME/porprov-migration/incoming/databases/$db.dump"
  test -s "$dump"
  docker exec -i porprov_postgres sh -c \
    'pg_restore --clean --if-exists --no-owner --no-privileges \
      -U "$POSTGRES_USER" -d "$1"' sh "$db" < "$dump"
done
```

Untuk Media, default aman adalah overlay restore setelah backup. Pengosongan
volume untuk parity exact bersifat destruktif dan membutuhkan persetujuan
terpisah. Setelah restore, jalankan migration canonical, start stack, lalu
bandingkan row count dan checksum agregat Media dengan manifest sumber.

Overlay restore yang tidak menghapus file lama:

```bash
media_volume="$(docker volume ls -q \
  --filter label=com.docker.compose.volume=master_data_uploads | head -n1)"
test -n "$media_volume"
test -s "$HOME/porprov-migration/incoming/master_data_uploads.tgz"
docker run --rm \
  -v "$media_volume:/data" \
  -v "$HOME/porprov-migration/incoming:/incoming:ro" \
  alpine:3.21 sh -c \
  'tar -C /data -xzf /incoming/master_data_uploads.tgz'
```

Gunakan algoritma checksum file-content yang sama di sumber dan VPS:

```bash
docker run --rm -v "$media_volume:/data:ro" alpine:3.21 sh -c \
  'cd /data && find . -type f -print0 | sort -z | \
   xargs -0 sha256sum | sha256sum'
```

Jika checksum sumber menuntut penggantian exact, jangan langsung menghapus isi
volume aktif. Buat maintenance plan terpisah: backup ulang, verifikasi path dan
nama volume, minta persetujuan eksplisit, lakukan replacement terkontrol, lalu
uji seluruh URL Media. File tambahan mungkin merupakan data yang belum masuk
manifest dan tidak boleh dianggap aman untuk dihapus.

Jangan memakai SQL hasil copy-paste dari Agent sebagai pengganti dump yang
terverifikasi. Jangan mengarang data yang hilang.

## 14. Deployment Tahan Reconnect

Koneksi ulang UI Codex/ChatGPT/Gemini tidak sama dengan kegagalan Ubuntu.
Build, pull image, restore, dan migration harus hidup di server walau client
terputus.

Gunakan wrapper job berikut di luar repository:

```bash
mkdir -p "$HOME/porprov-jobs"
chmod 700 "$HOME/porprov-jobs"

cat > "$HOME/porprov-jobs/run-deploy.sh" <<'SCRIPT'
#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$HOME/porprov-depok"
STATE="$HOME/porprov-jobs/deploy.status"
LOCK="$HOME/porprov-jobs/deploy.lock"
exec 9>"$LOCK"
flock -n 9 || { printf 'BLOCKED|%s\n' "$(date -u +%FT%TZ)" > "$STATE"; exit 75; }
on_error() {
  code=$?
  printf 'FAILED|%s|exit=%s|line=%s\n' \
    "$(date -u +%FT%TZ)" "$code" "${BASH_LINENO[0]:-unknown}" > "$STATE"
  exit "$code"
}
trap on_error ERR
printf 'RUNNING|%s|deploy\n' "$(date -u +%FT%TZ)" > "$STATE"
cd "$ROOT/infra/docker"
./deploy-vps.sh
printf 'DONE|%s|commit=%s\n' \
  "$(date -u +%FT%TZ)" "$(git -C "$ROOT" rev-parse HEAD)" > "$STATE"
SCRIPT
chmod 700 "$HOME/porprov-jobs/run-deploy.sh"

nohup setsid "$HOME/porprov-jobs/run-deploy.sh" \
  > "$HOME/porprov-jobs/deploy.log" 2>&1 < /dev/null &
echo "$!" > "$HOME/porprov-jobs/deploy.pid"
```

Pantau dengan koneksi SSH pendek:

```bash
cat "$HOME/porprov-jobs/deploy.status"
tail -n 100 "$HOME/porprov-jobs/deploy.log"
pid="$(cat "$HOME/porprov-jobs/deploy.pid")"
ps -p "$pid" -o pid,stat,etime,%cpu,%mem,cmd
```

Aturan job:

- jangan memulai ulang hanya karena belum ada output beberapa menit;
- cek status, PID, resource, dan log terlebih dahulu;
- retry hanya dari checkpoint yang gagal;
- lock harus dilepas otomatis saat proses berakhir;
- log tidak boleh memuat secret;
- jangan memakai `kill -9` kecuali ada diagnosis dan persetujuan;
- build satu service boleh memakai `docker compose build <service>` lalu
  `up -d --no-deps --force-recreate <service>` jika dependency/schema tidak
  berubah; perubahan lintas domain harus memakai deploy canonical.

## 15. Urutan Deployment Canonical

1. Bekukan commit `<DEPLOY_COMMIT>` dan hasil test.
2. Verifikasi fingerprint dan akses SSH.
3. Jalankan preflight read-only.
4. Buat backup dan validasi `SHA256SUMS`.
5. Tarik kode dengan `git pull --ff-only`.
6. Verifikasi worktree bersih dan commit exact.
7. Validasi `.env`, TLS, disk, memory, dan Compose config.
8. Jalankan `deploy-vps.sh` melalui wrapper job tahan reconnect.
9. Tunggu migration one-shot selesai dan service sehat.
10. Jalankan bootstrap Keycloak idempotent.
11. Lakukan smoke test, data parity, dan audit log.
12. Tandai `DONE` hanya setelah seluruh gate lulus.

Jangan mengubah urutan restore menjadi “deploy dahulu lalu timpa data” tanpa
rencana karena koneksi service lama dapat menulis selama restore.

## 16. Verifikasi End-to-End

### 16.1 Runtime

```bash
cd "$HOME/porprov-depok/infra/docker"
compose=(docker compose -f docker-compose.yml -f docker-compose.vps.yml)
"${compose[@]}" ps
docker ps --filter health=unhealthy
"${compose[@]}" logs --since 10m 2>&1 \
  | grep -Ei 'panic|fatal|conn busy|segmentation fault|out of memory' || true
```

Container migration boleh berstatus exited `0`; service runtime tidak boleh
exited atau unhealthy.

### 16.2 Halaman dan API

```bash
curl -fsS -o /dev/null http://127.0.0.1/
for path in cabor venue jadwal livescore medali; do
  curl -fsS -o /dev/null "http://127.0.0.1/$path"
done
curl -kfsS -o /dev/null https://127.0.0.1/admin/
curl -fsS http://127.0.0.1:8000/health

for path in \
  /api/v1/master-data/heroes/active \
  /api/v1/master-data/cabors \
  /api/v1/master-data/kontingens \
  /api/v1/master-data/city-guides \
  /api/v1/venues \
  /api/v1/schedule/matches/enriched \
  /api/v1/livescore/public \
  /api/v1/medals/standings; do
  curl -fsS "http://127.0.0.1$path" >/dev/null
done
```

`curl -k` hanya boleh digunakan dari VPS untuk memastikan route lokal saat CA
belum berada di trust store shell tersebut. Uji klien final wajib tanpa bypass.

### 16.3 OIDC dan Secure Context

```bash
curl --fail --silent --show-error \
  https://<VPS_HOST>/realms/porprov/.well-known/openid-configuration \
  | python3 -m json.tool >/dev/null
```

Pastikan field `issuer` sama persis dengan:

```text
https://<VPS_HOST>/realms/porprov
```

Authorization URL Admin harus memakai:

- `client_id=porprov-admin-web`;
- `redirect_uri=https://<VPS_HOST>/admin/`;
- `response_type=code`;
- `code_challenge_method=S256`.

Error `Crypto.subtle is available only in secure contexts` berarti browser
masih memakai HTTP atau sertifikat belum dipercaya. Jangan membuat fallback
kriptografi. Error `Invalid parameter: redirect_uri` berarti Keycloak client
belum memiliki callback exact yang sesuai.

### 16.4 Uji Konkurensi Schedule

```bash
results="$(mktemp)"
seq 1 100 | xargs -P 20 -I '{}' \
  curl -sS -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1/api/v1/schedule/matches/enriched > "$results"
test "$(grep -c '^200$' "$results")" -eq 100
rm -f "$results"
```

Jika log memuat `conn busy`, pastikan image Schedule terbaru memakai `pgxpool`
dan service benar-benar dibangun/recreate.

### 16.5 Database dan Media

```bash
for db in user_service_db master_data_db venue_db schedule_db \
  livescore_db porprov_db audit_db; do
  docker exec porprov_postgres sh -c \
    'psql -U "$POSTGRES_USER" -d "$1" -Atc \
      "SELECT version || chr(58) || dirty FROM schema_migrations"' sh "$db"
done
```

Bandingkan row count total dan aktif secara terpisah karena soft-deleted record
tetap berada di database. Bandingkan jumlah file serta checksum agregat Media,
bukan hanya metadata. Medali kosong dapat sah jika belum ada submission
`OFFICIAL`; jangan mengisi data palsu agar UI terlihat penuh.

## 17. Rollback

Rollback aplikasi dan rollback data adalah dua operasi berbeda.

### 17.1 Rollback Aplikasi

Metode utama adalah membuat commit revert pada Git, review, push, lalu deploy
commit revert. Jangan mengubah history production secara diam-diam.

Sebelum rollback:

- catat commit aktif dan known-good;
- pastikan migration backward-compatible;
- jangan menjalankan migration `down` otomatis;
- backup ulang state terbaru bila ada write setelah deployment.

### 17.2 Rollback Data

Gunakan dump dan arsip Media dari `<BACKUP_DIR>`. Stop semua writer, verifikasi
checksum, restore seluruh domain yang saling berkaitan, jalankan migration up,
kemudian ulangi seluruh quality gate. Rollback parsial lintas database hanya
boleh dilakukan jika kontrak referensi dan event/outbox sudah dianalisis.

`docker compose down -v` bukan prosedur rollback.

## 18. Incident Response

### 18.1 Credential Masuk Git atau Chat

1. Anggap credential kompromi.
2. Batasi akses dan rotasi credential pada sistem sumber.
3. Invalidasi sesi/token yang relevan.
4. Periksa audit log dan aktivitas tidak dikenal.
5. Hapus secret dari HEAD.
6. Rewrite history/force-push hanya dengan persetujuan eksplisit dan koordinasi
   seluruh clone/branch/tag.
7. Jalankan secret scan ulang.
8. Dokumentasikan insiden tanpa menyalin nilai secret.

### 18.2 Fingerprint SSH Berubah

Berhenti. Verifikasi ke administrator VPS melalui kanal tepercaya. Jangan
menghapus `known_hosts` dan menerima key baru tanpa bukti pergantian host/key.

### 18.3 Reconnecting pada Agent AI

- jangan mengulang deployment secara buta;
- periksa status/PID/log server-side;
- pastikan lock masih aktif;
- lanjutkan dari checkpoint terakhir;
- gunakan SSH keepalive untuk observasi, bukan sebagai mekanisme ketahanan job;
- bila UI Agent gagal, job Ubuntu tetap menjadi sumber kebenaran.

### 18.4 Data Tidak Muncul

Periksa berurutan: API Gateway, service health, migration version, database yang
dituju oleh `DATABASE_URL`, row count aktif vs tombstone, CORS, URL asset, dan
named volume. Jangan menjalankan seed palsu sebelum sumber data diverifikasi.

### 18.5 NATS Stream Tidak Ditemukan

Pastikan NATS JetStream aktif dan bootstrap stream selesai sebelum Realtime
Gateway membuat consumer. Jangan menghapus JetStream volume sebagai solusi
pertama karena dapat menghilangkan event durable.

## 19. Handoff Wajib Agent AI

Setiap pekerjaan deployment harus ditutup dengan laporan berikut:

```text
Target VPS          : <hostname/IP tanpa credential>
Commit deployed     : <full SHA>
Known-good rollback : <full SHA>
Backup              : <path, timestamp, checksum verified>
Job status/log      : <path status, PID, log>
Runtime             : <service healthy/failed>
Migration           : <database version:dirty>
Data parity         : <row count dan checksum Media>
Public/Admin/OIDC   : <hasil HTTP/TLS/login>
Security checks     : <secret scan, fingerprint, TLS>
Open risks          : <faktual, bukan asumsi>
Operator actions    : <izin/keputusan yang masih dibutuhkan>
```

Jangan menyertakan password, token, cookie, private key, atau isi `.env`.

## 20. Prompt Aman untuk Gemini/Agent AI Lain

Gunakan prompt berikut tanpa menambahkan password:

```text
Baca AI.md, RULES.md, FEATURES.md, DOCUMENTATION.md, README.md, AGENTS.md,
DEPLOYMENT_VPS.md, dan docs/runbook/VPS_UBUNTU_INTRANET.md secara lengkap.

Target adalah VPS Ubuntu intranet yang detail aksesnya tersedia melalui kanal
credential aman milik operator, bukan di prompt atau repository. Mulai hanya
dengan audit read-only. Verifikasi fingerprint SSH terhadap nilai yang diberikan
operator melalui kanal tepercaya. Jangan menampilkan atau menyimpan secret.

Susun rencana deployment, backup, rollback, risiko, dan quality gate. Minta
persetujuan eksplisit sebelum restore, rotasi credential, pemasangan CA,
perubahan firewall/SSH, penghapusan, atau rewrite Git history. Jalankan build,
restore, dan migrasi sebagai job server-side tahan reconnect dengan flock, PID,
status, log, dan checkpoint. Gunakan hanya Docker Compose canonical serta
override VPS. Jangan menonaktifkan HTTPS, PKCE, JWT validation, soft delete,
atau verifikasi host/TLS.

Deployment belum selesai sebelum commit, container health, migration
dirty=false, data parity, Media checksum, Public/Admin/API/OIDC, uji konkurensi,
dan log pascadeploy terverifikasi. Berikan handoff tanpa credential.
```

## 21. Checklist Persetujuan Operator

### Sebelum Deployment

- [ ] Target dan fingerprint SSH telah diverifikasi.
- [ ] Commit deploy dan known-good disetujui.
- [ ] Worktree lokal/VPS bersih atau perubahan sudah diinventarisasi.
- [ ] Secret production unik dan tidak ada di Git/chat.
- [ ] Disk, memory, Docker, waktu sistem, dan jaringan memadai.
- [ ] Backup database/Media/config selesai dan checksum valid.
- [ ] Maintenance window dan rollback owner jelas.
- [ ] TLS/CA dan origin OIDC final disepakati.

### Setelah Deployment

- [ ] Semua runtime service aktif dan tidak unhealthy.
- [ ] Migration seluruh database `dirty=false`.
- [ ] Public, Admin, asset, API, OIDC, dan authorization redirect lulus.
- [ ] Browser client mempercayai CA tanpa bypass.
- [ ] Data total/aktif dan Media cocok dengan manifest.
- [ ] Schedule concurrency test lulus.
- [ ] Tidak ada log kritis pascadeploy.
- [ ] Audit trail dan outbox tidak macet.
- [ ] Backup rollback tetap disimpan sesuai retensi.
- [ ] Laporan handoff lengkap dan bebas secret.

## 22. Urutan Prioritas Saat Terjadi Konflik

1. keselamatan manusia dan kebijakan Diskominfo;
2. perlindungan credential, data, dan akses;
3. `RULES.md` dan persetujuan eksplisit operator;
4. integritas backup/rollback;
5. availability layanan;
6. kecepatan deployment.

Agent AI tidak boleh menukar keamanan dan integritas data demi menyelesaikan
pekerjaan lebih cepat.
