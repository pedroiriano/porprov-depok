#!/usr/bin/env bash
set -euo pipefail

# INFO: Run this script inside the Keycloak container from Git Bash:
# docker exec -i porprov_keycloak bash < create_clients.sh
# INFO: PowerShell users should use the line-ending-safe command in DOCUMENTATION.md.

KCADM="${KCADM:-/opt/keycloak/bin/kcadm.sh}"
KEYCLOAK_SERVER_URL="${KEYCLOAK_SERVER_URL:-http://localhost:8080}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-porprov}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-${KEYCLOAK_ADMIN:-admin}}"
KEYCLOAK_ADMIN_SECRET="${KEYCLOAK_ADMIN_SECRET:-${KEYCLOAK_ADMIN_PASSWORD:-admin_secret}}"

# SECURITY: Origins are explicit. Never use webOrigins=["+"] for browser clients.
ADMIN_REDIRECT_URIS="${ADMIN_REDIRECT_URIS:-[\"http://localhost:5173/*\",\"http://localhost:5174/*\",\"http://127.0.0.1:5173/*\",\"http://127.0.0.1:5174/*\"]}"
ADMIN_WEB_ORIGINS="${ADMIN_WEB_ORIGINS:-[\"http://localhost:5173\",\"http://localhost:5174\",\"http://127.0.0.1:5173\",\"http://127.0.0.1:5174\"]}"
MOBILE_REDIRECT_URIS="${MOBILE_REDIRECT_URIS:-[\"exp://10.0.2.2:8081\",\"porprov://*\",\"http://localhost:8081/*\"]}"
MOBILE_WEB_ORIGINS="${MOBILE_WEB_ORIGINS:-[\"http://localhost:8081\"]}"

authenticate() {
  local attempt

  for attempt in $(seq 1 30); do
    if "${KCADM}" config credentials \
      --server "${KEYCLOAK_SERVER_URL}" \
      --realm master \
      --user "${KEYCLOAK_ADMIN_USER}" \
      --password "${KEYCLOAK_ADMIN_SECRET}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  echo "Keycloak is unavailable or the administrator credentials are invalid." >&2
  return 1
}

ensure_realm() {
  if ! "${KCADM}" get "realms/${KEYCLOAK_REALM}" >/dev/null 2>&1; then
    "${KCADM}" create realms -s "realm=${KEYCLOAK_REALM}" -s enabled=true >/dev/null
    echo "Created Keycloak realm: ${KEYCLOAK_REALM}"
  fi
}

client_id_for() {
  "${KCADM}" get clients \
    -r "${KEYCLOAK_REALM}" \
    -q "clientId=$1" \
    --fields id \
    --format csv \
    --noquotes 2>/dev/null | head -n 1
}

upsert_admin_client() {
  local client_uuid
  client_uuid="$(client_id_for porprov-admin-web)"

  if [[ -z "${client_uuid}" ]]; then
    "${KCADM}" create clients -r "${KEYCLOAK_REALM}" \
      -s clientId=porprov-admin-web \
      -s enabled=true \
      -s publicClient=true \
      -s standardFlowEnabled=true \
      -s directAccessGrantsEnabled=false \
      -s "redirectUris=${ADMIN_REDIRECT_URIS}" \
      -s "webOrigins=${ADMIN_WEB_ORIGINS}" \
      -s 'attributes."pkce.code.challenge.method"=S256' >/dev/null
    echo "Created Keycloak client: porprov-admin-web"
    return
  fi

  "${KCADM}" update "clients/${client_uuid}" -r "${KEYCLOAK_REALM}" \
    -s enabled=true \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s directAccessGrantsEnabled=false \
    -s "redirectUris=${ADMIN_REDIRECT_URIS}" \
    -s "webOrigins=${ADMIN_WEB_ORIGINS}" \
    -s 'attributes."pkce.code.challenge.method"=S256' >/dev/null
  echo "Updated Keycloak client: porprov-admin-web"
}

upsert_mobile_client() {
  local client_uuid
  client_uuid="$(client_id_for porprov-mobile-admin)"

  if [[ -z "${client_uuid}" ]]; then
    "${KCADM}" create clients -r "${KEYCLOAK_REALM}" \
      -s clientId=porprov-mobile-admin \
      -s enabled=true \
      -s publicClient=true \
      -s standardFlowEnabled=true \
      -s directAccessGrantsEnabled=true \
      -s "redirectUris=${MOBILE_REDIRECT_URIS}" \
      -s "webOrigins=${MOBILE_WEB_ORIGINS}" >/dev/null
    echo "Created Keycloak client: porprov-mobile-admin"
    return
  fi

  "${KCADM}" update "clients/${client_uuid}" -r "${KEYCLOAK_REALM}" \
    -s enabled=true \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s directAccessGrantsEnabled=true \
    -s "redirectUris=${MOBILE_REDIRECT_URIS}" \
    -s "webOrigins=${MOBILE_WEB_ORIGINS}" >/dev/null
  echo "Updated Keycloak client: porprov-mobile-admin"
}

authenticate
ensure_realm
upsert_admin_client
upsert_mobile_client
