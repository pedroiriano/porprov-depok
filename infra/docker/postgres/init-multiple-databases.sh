#!/bin/sh
set -eu

for database in master_data_db schedule_db venue_db audit_db user_service_db livescore_db porprov_db; do
  exists="$(psql --username "$POSTGRES_USER" --dbname postgres --tuples-only --no-align --command "SELECT 1 FROM pg_database WHERE datname = '$database'")"
  if [ "$exists" != "1" ]; then
    createdb --username "$POSTGRES_USER" "$database"
  fi
done
