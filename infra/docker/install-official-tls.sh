#!/usr/bin/env bash
set -Eeuo pipefail

# SECURITY: Installer ini tidak pernah mencetak isi sertifikat atau private key.
# INFO: Jalankan sebagai pemilik repository yang memiliki akses ke Docker.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${1:-}"
SOURCE_DIR="${2:-${HOME}/ssl-wildcard}"
TLS_DIR="${SCRIPT_DIR}/tls"
SOURCE_CERT="${SOURCE_DIR}/depok.go.id.crt"
SOURCE_KEY="${SOURCE_DIR}/depok.go.id.key"
LOCK_FILE="${HOME}/.porprov-official-tls.lock"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
JOB_DIR="${HOME}/porprov-jobs"
BACKUP_DIR="${HOME}/porprov-backups/tls-${STAMP}"
STATUS_FILE="${JOB_DIR}/official-tls.status"
LOG_FILE="${JOB_DIR}/official-tls-${STAMP}.log"
COMPOSE=(docker compose -f "${SCRIPT_DIR}/docker-compose.yml" -f "${SCRIPT_DIR}/docker-compose.vps.yml")

usage() {
  cat <<'EOF'
Pemakaian:
  bash install-official-tls.sh <domain-publik> [folder-sumber]

Contoh:
  bash install-official-tls.sh porprov.depok.go.id "$HOME/ssl-wildcard"

Folder sumber wajib berisi depok.go.id.crt (leaf + intermediate) dan
depok.go.id.key. Jangan simpan folder tersebut di Git.
EOF
}

if [[ -z "${DOMAIN}" ]]; then
  usage >&2
  exit 2
fi

mkdir -p "${JOB_DIR}" "${BACKUP_DIR}" "${TLS_DIR}"
chmod 700 "${JOB_DIR}" "${BACKUP_DIR}" "${TLS_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  echo "ERROR: instalasi/deployment TLS lain masih berjalan" >&2
  exit 1
fi

printf 'RUNNING %s domain=%s\n' "${STAMP}" "${DOMAIN}" >"${STATUS_FILE}"

installed=false
had_cert=false
had_key=false
nginx_container=""
tmp_dir=""

rollback() {
  local reason="$1"
  set +e
  if [[ "${installed}" == true ]]; then
    echo "ROLLBACK: ${reason}"
    if [[ "${had_cert}" == true ]]; then
      install -m 0644 "${BACKUP_DIR}/server.crt" "${TLS_DIR}/server.crt"
    else
      rm -f "${TLS_DIR}/server.crt"
    fi
    if [[ "${had_key}" == true ]]; then
      install -m 0600 "${BACKUP_DIR}/server.key" "${TLS_DIR}/server.key"
    else
      rm -f "${TLS_DIR}/server.key"
    fi
    if [[ -n "${nginx_container}" ]]; then
      docker exec "${nginx_container}" nginx -t >/dev/null 2>&1 &&
        docker exec "${nginx_container}" nginx -s reload >/dev/null 2>&1
    fi
  fi
  printf 'FAILED %s domain=%s reason=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${DOMAIN}" "${reason}" >"${STATUS_FILE}"
}

on_exit() {
  local rc=$?
  trap - EXIT
  if [[ -n "${tmp_dir}" && -d "${tmp_dir}" ]]; then
    rm -rf "${tmp_dir}"
  fi
  if ((rc != 0)); then
    rollback "exit-${rc}"
  fi
  exit "${rc}"
}
trap on_exit EXIT

for command_name in openssl docker curl sha256sum awk flock timeout getent; do
  command -v "${command_name}" >/dev/null || {
    echo "ERROR: command tidak tersedia: ${command_name}" >&2
    exit 1
  }
done

for required in "${SOURCE_CERT}" "${SOURCE_KEY}"; do
  [[ -s "${required}" ]] || {
    echo "ERROR: file wajib tidak tersedia: ${required}" >&2
    exit 1
  }
done

chmod 600 "${SOURCE_KEY}"

tmp_dir="$(mktemp -d)"
awk -v output_dir="${tmp_dir}" '
  /-----BEGIN CERTIFICATE-----/ { certificate += 1 }
  certificate > 0 { print > (output_dir "/cert-" certificate ".pem") }
' "${SOURCE_CERT}"

cert_count="$(find "${tmp_dir}" -maxdepth 1 -name 'cert-*.pem' -type f | wc -l | tr -d ' ')"
if ((cert_count < 2)); then
  echo "ERROR: depok.go.id.crt bukan full chain; minimal leaf + intermediate" >&2
  exit 1
fi

leaf_cert="${tmp_dir}/cert-1.pem"
intermediate_cert="${tmp_dir}/cert-2.pem"
openssl x509 -in "${leaf_cert}" -noout -checkend 604800 >/dev/null || {
  echo "ERROR: sertifikat kedaluwarsa atau tersisa kurang dari tujuh hari" >&2
  exit 1
}
openssl x509 -in "${leaf_cert}" -noout -checkhost "${DOMAIN}" >/dev/null || {
  echo "ERROR: hostname ${DOMAIN} tidak tercakup SAN sertifikat" >&2
  exit 1
}
openssl pkey -in "${SOURCE_KEY}" -check -noout >/dev/null
openssl verify -partial_chain -CAfile "${intermediate_cert}" "${leaf_cert}" >/dev/null

cert_key_hash="$(openssl x509 -in "${leaf_cert}" -pubkey -noout | openssl pkey -pubin -outform DER 2>/dev/null | sha256sum | awk '{print $1}')"
private_key_hash="$(openssl pkey -in "${SOURCE_KEY}" -pubout -outform DER 2>/dev/null | sha256sum | awk '{print $1}')"
[[ -n "${cert_key_hash}" && "${cert_key_hash}" == "${private_key_hash}" ]] || {
  echo "ERROR: private key tidak cocok dengan sertifikat" >&2
  exit 1
}

target_fingerprint="$(openssl x509 -in "${leaf_cert}" -noout -fingerprint -sha256 | cut -d= -f2)"
echo "VALID: full-chain=${cert_count}, hostname=${DOMAIN}, key-match=true"
openssl x509 -in "${leaf_cert}" -noout -subject -issuer -dates -ext subjectAltName
echo "TARGET_SHA256_FINGERPRINT=${target_fingerprint}"

if [[ -s "${TLS_DIR}/server.crt" ]]; then
  cp -p "${TLS_DIR}/server.crt" "${BACKUP_DIR}/server.crt"
  had_cert=true
fi
if [[ -s "${TLS_DIR}/server.key" ]]; then
  cp -p "${TLS_DIR}/server.key" "${BACKUP_DIR}/server.key"
  had_key=true
fi
find "${BACKUP_DIR}" -maxdepth 1 -type f ! -name SHA256SUMS -print0 |
  sort -z | xargs -0 -r sha256sum >"${BACKUP_DIR}/SHA256SUMS"
echo "BACKUP=${BACKUP_DIR}"

# CHANGE: Compose VPS membaca tepat dari infra/docker/tls, bukan nginx/tls.
install -m 0644 "${SOURCE_CERT}" "${TLS_DIR}/server.crt.next"
install -m 0600 "${SOURCE_KEY}" "${TLS_DIR}/server.key.next"
mv -f "${TLS_DIR}/server.crt.next" "${TLS_DIR}/server.crt"
mv -f "${TLS_DIR}/server.key.next" "${TLS_DIR}/server.key"
installed=true

"${COMPOSE[@]}" config --quiet
nginx_container="$("${COMPOSE[@]}" ps -q nginx)"
[[ -n "${nginx_container}" ]] || {
  echo "ERROR: container Nginx tidak ditemukan" >&2
  exit 1
}

docker exec "${nginx_container}" nginx -t
docker exec "${nginx_container}" nginx -s reload

served_fingerprint="$(
  printf '\n' |
    timeout 15 openssl s_client -connect 127.0.0.1:443 -servername "${DOMAIN}" 2>/dev/null |
    openssl x509 -noout -fingerprint -sha256 |
    cut -d= -f2
)"
[[ "${served_fingerprint}" == "${target_fingerprint}" ]] || {
  echo "ERROR: Nginx masih menyajikan sertifikat berbeda" >&2
  exit 1
}

printf '\n' |
  timeout 15 openssl s_client \
    -connect 127.0.0.1:443 \
    -servername "${DOMAIN}" \
    -verify_hostname "${DOMAIN}" \
    -verify_return_error >/dev/null

curl --fail --silent --show-error --head --max-time 20 \
  --resolve "${DOMAIN}:443:127.0.0.1" "https://${DOMAIN}/" >/dev/null

if getent ahostsv4 "${DOMAIN}" >/dev/null 2>&1; then
  final_status="TLS_INSTALLED_DNS_RESOLVED"
  echo "DNS_LOCAL_RESOLVER=resolved"
else
  final_status="TLS_INSTALLED_DNS_PENDING"
  echo "WARNING: TLS aktif di VPS, tetapi DNS ${DOMAIN} belum dapat di-resolve" >&2
fi

printf '%s %s domain=%s fingerprint=%s backup=%s\n' \
  "${final_status}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${DOMAIN}" \
  "${served_fingerprint}" "${BACKUP_DIR}" >"${STATUS_FILE}"
echo "STATUS=${final_status}"
echo "STATUS_FILE=${STATUS_FILE}"
echo "LOG_FILE=${LOG_FILE}"
echo "SERVED_SHA256_FINGERPRINT=${served_fingerprint}"
