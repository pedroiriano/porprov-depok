#!/usr/bin/env bash
set -Eeuo pipefail

# SECURITY: Sertifikat ini hanya untuk intranet tanpa PKI resmi. CA privat
# tidak boleh masuk Git dan harus diganti dengan PKI Diskominfo saat tersedia.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TLS_DIR="${TLS_DIR:-${SCRIPT_DIR}/tls}"
PORPROV_TLS_IP="${PORPROV_TLS_IP:-}"

if [[ -z "${PORPROV_TLS_IP}" ]]; then
  echo "PORPROV_TLS_IP wajib diisi, contoh: PORPROV_TLS_IP=10.11.5.80" >&2
  exit 1
fi

mkdir -p "${TLS_DIR}"
chmod 700 "${TLS_DIR}"

if [[ ! -f "${TLS_DIR}/ca.key" || ! -f "${TLS_DIR}/ca.crt" ]]; then
  openssl genpkey \
    -algorithm RSA \
    -pkeyopt rsa_keygen_bits:4096 \
    -out "${TLS_DIR}/ca.key"
  chmod 600 "${TLS_DIR}/ca.key"

  openssl req \
    -x509 \
    -new \
    -sha256 \
    -days 3650 \
    -key "${TLS_DIR}/ca.key" \
    -subj "/C=ID/ST=Jawa Barat/L=Depok/O=Pemerintah Kota Depok/OU=PORPROV XV/CN=PORPROV Intranet Root CA" \
    -out "${TLS_DIR}/ca.crt"
fi

cat > "${TLS_DIR}/server.ext" <<EOF
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=IP:${PORPROV_TLS_IP}
authorityKeyIdentifier=keyid,issuer
EOF

openssl genpkey \
  -algorithm RSA \
  -pkeyopt rsa_keygen_bits:3072 \
  -out "${TLS_DIR}/server.key"
chmod 600 "${TLS_DIR}/server.key"

openssl req \
  -new \
  -sha256 \
  -key "${TLS_DIR}/server.key" \
  -subj "/C=ID/ST=Jawa Barat/L=Depok/O=Pemerintah Kota Depok/OU=PORPROV XV/CN=${PORPROV_TLS_IP}" \
  -out "${TLS_DIR}/server.csr"

openssl x509 \
  -req \
  -sha256 \
  -days 825 \
  -in "${TLS_DIR}/server.csr" \
  -CA "${TLS_DIR}/ca.crt" \
  -CAkey "${TLS_DIR}/ca.key" \
  -CAcreateserial \
  -extfile "${TLS_DIR}/server.ext" \
  -out "${TLS_DIR}/server.crt"

openssl verify -CAfile "${TLS_DIR}/ca.crt" "${TLS_DIR}/server.crt"
openssl x509 -in "${TLS_DIR}/server.crt" -noout -subject -issuer -dates -ext subjectAltName

