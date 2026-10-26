#!/usr/bin/env bash
# Runs the RLS suite against a throwaway database on a LOCAL Postgres.
# Usage: PGHOST=/tmp PGPORT=55432 PGUSER=postgres ./run.sh
set -euo pipefail
# Safety: only ever a local Postgres (socket path or localhost). Never a live database.
case "${PGHOST:-}" in
  /*|localhost|127.0.0.1|::1) ;;
  *) echo "Refusing to run: PGHOST must be a local socket or localhost" >&2; exit 2 ;;
esac
cd "$(dirname "$0")"
DB="ms_office_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1 || true' EXIT
run() { psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1"; }
run local-supabase-shim.sql
for f in ../migrations/*.sql; do run "$f"; done
run seed-fake.sql
psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f rls-tests.sql 2>&1 | sed -n 's/^psql:[^ ]* NOTICE:  //p; /FAIL\|ERROR\|ALL RLS/p'
