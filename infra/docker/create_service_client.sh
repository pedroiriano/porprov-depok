#!/usr/bin/env bash
set -euo pipefail

KCADM="${KCADM:-/opt/keycloak/bin/kcadm.sh}"
KEYCLOAK_SERVER_URL="${KEYCLOAK_SERVER_URL:-http://localhost:8080}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-porprov}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_SECRET="${KEYCLOAK_ADMIN_SECRET:-admin_secret}"
KEYCLOAK_BACKEND_CLIENT_SECRET="${KEYCLOAK_BACKEND_CLIENT_SECRET:?KEYCLOAK_BACKEND_CLIENT_SECRET wajib diisi}"

authenticate() {
  "${KCADM}" config credentials --server "${KEYCLOAK_SERVER_URL}" --realm master --user "${KEYCLOAK_ADMIN_USER}" --password "${KEYCLOAK_ADMIN_SECRET}"
}

client_id_for() {
  "${KCADM}" get clients -r "${KEYCLOAK_REALM}" -q "clientId=$1" --fields id --format csv --noquotes 2>/dev/null | head -n 1
}

upsert_backend_client() {
  local client_uuid
  client_uuid="$(client_id_for porprov-backend-service)"

  if [[ -z "${client_uuid}" ]]; then
    "${KCADM}" create clients -r "${KEYCLOAK_REALM}" \
      -s clientId=porprov-backend-service \
      -s enabled=true \
      -s publicClient=false \
      -s standardFlowEnabled=false \
      -s directAccessGrantsEnabled=false \
      -s serviceAccountsEnabled=true \
      -s "secret=${KEYCLOAK_BACKEND_CLIENT_SECRET}" >/dev/null
    echo "Created Keycloak client: porprov-backend-service"
  else
    echo "Client porprov-backend-service already exists."
  fi
}

assign_roles() {
  local role

  # SECURITY: manage-realm diperlukan hanya untuk sinkronisasi Peran kustom.
  # Hak ini tidak diberikan kepada browser/mobile client.
  for role in manage-users view-users manage-realm; do
    "${KCADM}" add-roles -r "${KEYCLOAK_REALM}" \
      --uusername "service-account-porprov-backend-service" \
      --cclientid realm-management \
      --rolename "${role}"
  done

  echo "Assigned backend realm-management roles."
}

authenticate
upsert_backend_client
assign_roles
