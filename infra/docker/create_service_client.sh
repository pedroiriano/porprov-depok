#!/usr/bin/env bash
set -euo pipefail

KCADM="${KCADM:-/opt/keycloak/bin/kcadm.sh}"
KEYCLOAK_SERVER_URL="${KEYCLOAK_SERVER_URL:-http://localhost:8080}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-porprov}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_SECRET="${KEYCLOAK_ADMIN_SECRET:-admin_secret}"

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
      -s secret=backend_secret >/dev/null
    echo "Created Keycloak client: porprov-backend-service"
  else
    echo "Client porprov-backend-service already exists."
  fi
}

assign_roles() {
  # Get service account user id
  local sa_user_id
  sa_user_id=$("${KCADM}" get clients/$(client_id_for porprov-backend-service)/service-account-user -r "${KEYCLOAK_REALM}" --fields id --format csv --noquotes)
  
  local rm_client_id
  rm_client_id=$("${KCADM}" get clients -r "${KEYCLOAK_REALM}" -q clientId=realm-management --fields id --format csv --noquotes | head -n 1)

  # Assign manage-users
  "${KCADM}" add-roles -r "${KEYCLOAK_REALM}" --uusername "service-account-porprov-backend-service" --cclientid realm-management --rolename manage-users
  "${KCADM}" add-roles -r "${KEYCLOAK_REALM}" --uusername "service-account-porprov-backend-service" --cclientid realm-management --rolename view-users
  
  echo "Assigned manage-users and view-users to backend service account."
}

authenticate
upsert_backend_client
assign_roles
