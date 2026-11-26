#!/usr/bin/env bash
# Runs the Builder migrations + RLS suite against a throwaway database on a LOCAL Postgres.
# Usage: PGHOST=/tmp PGPORT=55433 PGUSER=postgres ./run.sh      (CI: PGHOST=localhost)
set -euo pipefail
# Safety: only ever a local Postgres (socket path or localhost). Never a hosted database.
case "${PGHOST:-}" in
  /*|localhost|127.0.0.1|::1) ;;
  *) echo "Refusing to run: PGHOST must be a local socket or localhost" >&2; exit 2 ;;
esac
cd "$(dirname "$0")"
DB="builder_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1 || true' EXIT
run() { psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1"; }
run local-supabase-shim.sql
for f in ../migrations/*.sql; do echo "migrate: $(basename "$f")"; run "$f"; done
run seed-fake.sql
out=$(psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f rls-tests.sql 2>&1) || { echo "$out" | sed -n 's/^psql:[^ ]* NOTICE:  //p; /FAIL\|ERROR/p'; exit 1; }
echo "$out" | sed -n 's/^psql:[^ ]* NOTICE:  //p'
pass=$(echo "$out" | grep -c 'NOTICE:  PASS:' || true)
echo "RLS checks passed: $pass"
echo "$out" | grep -q 'ALL RLS TESTS PASSED'
out2=$(psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f phase2-tests.sql 2>&1) || { echo "$out2" | sed -n 's/^psql:[^ ]* NOTICE:  //p; /FAIL\|ERROR/p'; exit 1; }
echo "$out2" | sed -n 's/^psql:[^ ]* NOTICE:  //p'
echo "$out2" | grep -q 'ALL PHASE 2 TESTS PASSED'
out3=$(psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f phase3-tests.sql 2>&1) || { echo "$out3" | sed -n 's/^psql:[^ ]* NOTICE:  //p; /FAIL\|ERROR/p'; exit 1; }
echo "$out3" | sed -n 's/^psql:[^ ]* NOTICE:  //p'
echo "$out3" | grep -q 'ALL PHASE 3 TESTS PASSED'
out4=$(psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f phase4-tests.sql 2>&1) || { echo "$out4" | sed -n 's/^psql:[^ ]* NOTICE:  //p; /FAIL\|ERROR/p'; exit 1; }
echo "$out4" | sed -n 's/^psql:[^ ]* NOTICE:  //p'
echo "$out4" | grep -q 'ALL PHASE 4 TESTS PASSED'
out5=$(psql -X -q -v ON_ERROR_STOP=1 -d "$DB" -f phase4b-tests.sql 2>&1) || { echo "$out5" | sed -n 's/^psql:[^ ]* NOTICE:  //p; /FAIL\|ERROR/p'; exit 1; }
echo "$out5" | sed -n 's/^psql:[^ ]* NOTICE:  //p'
echo "$out5" | grep -q 'ALL FOUNDING OFFER TESTS PASSED'
