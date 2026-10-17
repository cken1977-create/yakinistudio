#!/usr/bin/env bash
# Rebuilds a throwaway local Postgres DB from the live schema snapshot,
# applies the pilot migrations, then runs the RLS / audit / encryption tests.
# Fake data only. Usage: supabase/tests/run-local.sh   (needs local Postgres 15+ with pgvector)
set -euo pipefail
cd "$(dirname "$0")/.."
DB=${VS_TEST_DB:-vs_test}
export PGOPTIONS="-c client_min_messages=warning"
PSQL="psql -q -v ON_ERROR_STOP=1 -d $DB"
dropdb --if-exists "$DB"
createdb "$DB"
$PSQL -f tests/local-supabase-shim.sql
$PSQL -f schema/live-baseline-2026-10-16.sql
for f in migrations/*.sql; do
  echo "applying $f"
  $PSQL -f "$f"
done
echo "re-applying migrations (idempotency check)"
for f in migrations/*.sql; do $PSQL -f "$f" >/dev/null 2>&1 || { echo "re-apply failed: $f"; exit 1; }; done
$PSQL -f tests/seed-fake.sql
psql -v ON_ERROR_STOP=1 -d "$DB" -f tests/rls-audit-tests.sql
psql -v ON_ERROR_STOP=1 -d "$DB" -f tests/obr-coalition-tests.sql
