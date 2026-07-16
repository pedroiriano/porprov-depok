#!/usr/bin/env bash
set -euo pipefail

KCADM="${KCADM:-/opt/keycloak/bin/kcadm.sh}"
KEYCLOAK_SERVER_URL="${KEYCLOAK_SERVER_URL:-http://localhost:8080}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-porprov}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-${KEYCLOAK_ADMIN:-admin}}"
KEYCLOAK_ADMIN_SECRET="${KEYCLOAK_ADMIN_SECRET:-${KEYCLOAK_ADMIN_PASSWORD:-admin_secret}}"
PORPROV_ADMIN_USERNAME="${PORPROV_ADMIN_USERNAME:-admin_depok}"
PORPROV_ADMIN_PASSWORD="${PORPROV_ADMIN_PASSWORD:-password}"
PORPROV_KORESPONDEN_USERNAME="${PORPROV_KORESPONDEN_USERNAME:-koresponden_1}"
PORPROV_KORESPONDEN_PASSWORD="${PORPROV_KORESPONDEN_PASSWORD:-password}"

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

  echo "Keycloak is unavailable or administrator credentials are invalid." >&2
  return 1
}

ensure_role() {
  local role="$1"
  if ! "${KCADM}" get "roles/${role}" -r "${KEYCLOAK_REALM}" >/dev/null 2>&1; then
    "${KCADM}" create roles -r "${KEYCLOAK_REALM}" -s "name=${role}" >/dev/null
    echo "Created realm role: ${role}"
  fi
}

user_id_for() {
  "${KCADM}" get users \
    -r "${KEYCLOAK_REALM}" \
    -q "username=$1" \
    --fields id \
    --format csv \
    --noquotes 2>/dev/null | head -n 1
}

ensure_user() {
  local username="$1"
  local password="$2"
  local email="$3"
  local first_name="$4"
  local last_name="$5"
  local role="$6"
  local user_id

  user_id="$(user_id_for "${username}")"
  if [[ -z "${user_id}" ]]; then
    "${KCADM}" create users -r "${KEYCLOAK_REALM}" \
      -s "username=${username}" \
      -s enabled=true \
      -s emailVerified=true \
      -s "email=${email}" \
      -s "firstName=${first_name}" \
      -s "lastName=${last_name}" >/dev/null
    echo "Created Keycloak user: ${username}"
  fi

  "${KCADM}" set-password -r "${KEYCLOAK_REALM}" --username "${username}" --new-password "${password}" >/dev/null
  "${KCADM}" add-roles -r "${KEYCLOAK_REALM}" --uusername "${username}" --rolename "${role}" >/dev/null
  echo "Ensured ${username} has role ${role}"
}

authenticate

for role in super_admin admin_venue koresponden verifikator auditor; do
  ensure_role "${role}"
done

ensure_user "${PORPROV_ADMIN_USERNAME}" "${PORPROV_ADMIN_PASSWORD}" \
  "admin@porprov.depok.go.id" "Admin" "Depok" "super_admin"
ensure_user "${PORPROV_KORESPONDEN_USERNAME}" "${PORPROV_KORESPONDEN_PASSWORD}" \
  "koresponden1@porprov.depok.go.id" "Koresponden" "Depok" "koresponden"
