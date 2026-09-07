#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOCK_FILE="${SCRIPT_DIR}/.deploy-vps.lock"
LOG_PREFIX="[porprov-vps]"

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "${LOG_PREFIX} deployment lain masih berjalan" >&2
  exit 1
fi

cd "${SCRIPT_DIR}"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.vps.yml)

env_value() {
  local key="$1"
  awk -F= -v key="${key}" '$1 == key { sub(/^[^=]*=/, ""); value=$0 } END { print value }' .env | tr -d '\r'
}

require_secure_value() {
  local key="$1"
  local minimum="$2"
  shift 2
  local value
  value="$(env_value "${key}")"
  if [[ ${#value} -lt ${minimum} ]]; then
    echo "${LOG_PREFIX} ${key} wajib diisi minimal ${minimum} karakter" >&2
    exit 1
  fi
  for rejected in "$@"; do
    if [[ "${value}" == "${rejected}" || "${value}" == replace-with-* ]]; then
      echo "${LOG_PREFIX} ${key} masih memakai nilai development/placeholder" >&2
      exit 1
    fi
  done
}

require_exact_value() {
  local key="$1"
  local expected="$2"
  if [[ "$(env_value "${key}")" != "${expected}" ]]; then
    echo "${LOG_PREFIX} ${key} wajib bernilai ${expected}" >&2
    exit 1
  fi
}

backup_running_stack() {
  local timestamp backup_root backup_dir
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup_root="${PORPROV_BACKUP_ROOT:-${HOME}/porprov-backups}"
  backup_dir="${backup_root}/${timestamp}"
  install -d -m 700 "${backup_dir}"

  install -m 600 .env "${backup_dir}/docker.env"
  install -m 600 tls/server.crt "${backup_dir}/server.crt"
  install -m 600 tls/server.key "${backup_dir}/server.key"
  install -m 600 nginx/nginx.vps.conf "${backup_dir}/nginx.vps.conf"
  git -C "${SCRIPT_DIR}/../.." rev-parse HEAD >"${backup_dir}/source.commit"

  if [[ -n "$("${COMPOSE[@]}" ps --status running -q postgres)" ]]; then
    echo "${LOG_PREFIX} backup seluruh database"
    "${COMPOSE[@]}" exec -T postgres sh -eu -c \
      'PGPASSWORD="$POSTGRES_PASSWORD" pg_dumpall --clean --if-exists --username="$POSTGRES_USER"' |
      gzip -9 >"${backup_dir}/postgres-all.sql.gz"
  fi

  if [[ -n "$("${COMPOSE[@]}" ps --status running -q master-data-service)" ]]; then
    echo "${LOG_PREFIX} backup Media Library"
    "${COMPOSE[@]}" exec -T master-data-service \
      tar -C /app/uploads -czf - . >"${backup_dir}/master-data-uploads.tar.gz"
  fi

  (
    cd "${backup_dir}"
    find . -maxdepth 1 -type f ! -name SHA256SUMS -print0 |
      sort -z | xargs -0 sha256sum >SHA256SUMS
  )
  echo "${LOG_PREFIX} backup=${backup_dir}"
}

if [[ ! -f .env ]]; then
  echo "${LOG_PREFIX} infra/docker/.env belum tersedia" >&2
  exit 1
fi

require_secure_value POSTGRES_PASSWORD 20 porprov_secret
require_secure_value REDIS_PASSWORD 20 porprov_redis_secret
require_secure_value INTERNAL_STREAM_TOKEN 32 local-development-stream-token
require_secure_value KEYCLOAK_ADMIN_PASSWORD 20 admin_secret
require_secure_value KEYCLOAK_BACKEND_CLIENT_SECRET 32 backend_secret
require_secure_value PORPROV_ADMIN_PASSWORD 16 password
require_secure_value PORPROV_KORESPONDEN_PASSWORD 16 password
require_secure_value GRAFANA_PASSWORD 20 admin
require_exact_value KEYCLOAK_ISSUER https://porprov.depok.go.id/realms/porprov
require_exact_value CORS_ALLOWED_ORIGINS https://porprov.depok.go.id
require_exact_value NEXT_PUBLIC_API_URL /api/v1
require_exact_value NEXT_PUBLIC_SITE_URL https://porprov.depok.go.id
require_exact_value VITE_API_URL /api/v1
require_exact_value VITE_OIDC_AUTHORITY https://porprov.depok.go.id/realms/porprov
require_exact_value VITE_BASE_PATH /admin/

expected_commit="$(env_value PORPROV_DEPLOY_COMMIT)"
current_commit="$(git -C "${SCRIPT_DIR}/../.." rev-parse HEAD)"
if [[ ! "${expected_commit}" =~ ^[0-9a-f]{40}$ || "${expected_commit}" != "${current_commit}" ]]; then
  echo "${LOG_PREFIX} PORPROV_DEPLOY_COMMIT harus sama dengan commit source aktif" >&2
  exit 1
fi
if [[ -n "$(git -C "${SCRIPT_DIR}/../.." status --porcelain --untracked-files=normal)" ]]; then
  echo "${LOG_PREFIX} working tree VPS harus bersih sebelum deployment" >&2
  exit 1
fi

for required in tls/server.crt tls/server.key; do
  if [[ ! -s "${required}" ]]; then
    echo "${LOG_PREFIX} file TLS wajib tidak tersedia: ${required}" >&2
    exit 1
  fi
done

echo "${LOG_PREFIX} validasi konfigurasi"
"${COMPOSE[@]}" config --quiet

backup_running_stack

echo "${LOG_PREFIX} build dan start stack"
"${COMPOSE[@]}" up -d --build --remove-orphans

"${COMPOSE[@]}" exec -T nginx nginx -t

echo "${LOG_PREFIX} menunggu health service inti"
for attempt in $(seq 1 60); do
  unhealthy="$(
    "${COMPOSE[@]}" ps --format json |
      grep -E '"Health":"unhealthy"|"State":"exited"' || true
  )"

  if [[ -z "${unhealthy}" ]] &&
    curl --fail --silent --show-error http://127.0.0.1:8000/health >/dev/null &&
    curl --fail --silent --show-error http://127.0.0.1:3000 >/dev/null; then
    echo "${LOG_PREFIX} service internal sehat; menjalankan smoke test HTTPS"
    resolve=(--resolve porprov.depok.go.id:443:127.0.0.1)
    curl --fail --silent --show-error "${resolve[@]}" https://porprov.depok.go.id/ >/dev/null
    curl --fail --silent --show-error "${resolve[@]}" https://porprov.depok.go.id/admin/ >/dev/null
    curl --fail --silent --show-error "${resolve[@]}" https://porprov.depok.go.id/sitemap.xml >/dev/null
    curl --fail --silent --show-error "${resolve[@]}" https://porprov.depok.go.id/robots.txt >/dev/null
    curl --fail --silent --show-error "${resolve[@]}" https://porprov.depok.go.id/api/v1/master-data/cabors >/dev/null
    curl --fail --silent --show-error "${resolve[@]}" https://porprov.depok.go.id/realms/porprov/.well-known/openid-configuration >/dev/null

    headers="$(curl --fail --silent --show-error --head "${resolve[@]}" https://porprov.depok.go.id/)"
    grep -qi '^strict-transport-security:' <<<"${headers}"
    grep -qi '^content-security-policy:' <<<"${headers}"
    if grep -Eqi '^server:.*nginx/' <<<"${headers}" || grep -qi '^x-powered-by:' <<<"${headers}"; then
      echo "${LOG_PREFIX} version/framework header masih bocor" >&2
      exit 1
    fi

    echo "${LOG_PREFIX} stack dan security header sehat"
    "${COMPOSE[@]}" ps
    exit 0
  fi

  sleep 5
done

echo "${LOG_PREFIX} timeout menunggu stack sehat" >&2
"${COMPOSE[@]}" ps >&2
exit 1
