#!/bin/sh
set -eu

# SECURITY: Nama role/database dibatasi agar tidak menjadi vektor SQL injection.
case "${UMAMI_DATABASE_USER:-}" in (*[!A-Za-z0-9_]*|'') echo "UMAMI_DATABASE_USER tidak valid" >&2; exit 1;; esac
case "${UMAMI_DATABASE_NAME:-}" in (*[!A-Za-z0-9_]*|'') echo "UMAMI_DATABASE_NAME tidak valid" >&2; exit 1;; esac
case "${UMAMI_DATABASE_PASSWORD:-}" in (*[!A-Za-z0-9]*|'') echo "UMAMI_DATABASE_PASSWORD harus alfanumerik" >&2; exit 1;; esac

export PGPASSWORD="${POSTGRES_PASSWORD}"
psql -v ON_ERROR_STOP=1 -h postgres -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  -v db_user="${UMAMI_DATABASE_USER}" -v db_password="${UMAMI_DATABASE_PASSWORD}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('ALTER ROLE %I PASSWORD %L', :'db_user', :'db_password') \gexec
SQL

psql -v ON_ERROR_STOP=1 -h postgres -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  -v db_name="${UMAMI_DATABASE_NAME}" -v db_user="${UMAMI_DATABASE_USER}" <<'SQL'
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SQL

echo "Database Umami siap"
