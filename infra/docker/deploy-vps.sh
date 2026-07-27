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

if [[ ! -f .env ]]; then
  echo "${LOG_PREFIX} infra/docker/.env belum tersedia" >&2
  exit 1
fi

for required in tls/server.crt tls/server.key; do
  if [[ ! -s "${required}" ]]; then
    echo "${LOG_PREFIX} file TLS wajib tidak tersedia: ${required}" >&2
    exit 1
  fi
done

echo "${LOG_PREFIX} validasi konfigurasi"
docker compose \
  -f docker-compose.yml \
  -f docker-compose.vps.yml \
  config --quiet

echo "${LOG_PREFIX} build dan start stack"
docker compose \
  -f docker-compose.yml \
  -f docker-compose.vps.yml \
  up -d --build --remove-orphans

echo "${LOG_PREFIX} menunggu health service inti"
for attempt in $(seq 1 60); do
  unhealthy="$(
    docker compose \
      -f docker-compose.yml \
      -f docker-compose.vps.yml \
      ps --format json |
      grep -E '"Health":"unhealthy"|"State":"exited"' || true
  )"

  if [[ -z "${unhealthy}" ]] &&
    curl --fail --silent --show-error http://127.0.0.1:8000/health >/dev/null &&
    curl --fail --silent --show-error http://127.0.0.1:3000 >/dev/null; then
    echo "${LOG_PREFIX} stack sehat"
    docker compose \
      -f docker-compose.yml \
      -f docker-compose.vps.yml \
      ps
    exit 0
  fi

  sleep 5
done

echo "${LOG_PREFIX} timeout menunggu stack sehat" >&2
docker compose \
  -f docker-compose.yml \
  -f docker-compose.vps.yml \
  ps >&2
exit 1
