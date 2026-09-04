#!/usr/bin/env bash
set -euo pipefail

container_name="langspot-assessment-test-pg"
repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cleanup() { docker rm -f "$container_name" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

docker run --name "$container_name" -e POSTGRES_PASSWORD=postgres -d postgres:17-alpine >/dev/null
for _ in {1..20}; do
  docker exec "$container_name" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

docker cp "$repo_dir/supabase/tests/assessment_bootstrap.sql" "$container_name:/tmp/bootstrap.sql" >/dev/null
docker cp "$repo_dir/supabase/tests/assessment_smoke.sql" "$container_name:/tmp/smoke.sql" >/dev/null
migrations=(
  20260903204901_create_assessments_foundation.sql
  20260903210547_add_assessment_mvp_workflows.sql
  20260904021343_secure_assessment_grading_and_results.sql
  20260904033000_add_assessment_integrity_and_adaptive_placement.sql
  20260904050000_add_assessment_listening_writing_speaking.sql
  20260904060000_integrate_assessment_progress.sql
  20260904104029_add_cefr_assessment_layer.sql
)
for index in "${!migrations[@]}"; do
  number=$((index + 1))
  docker cp "$repo_dir/supabase/migrations/${migrations[$index]}" "$container_name:/tmp/$number.sql" >/dev/null
done

docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/bootstrap.sql >/dev/null
for index in "${!migrations[@]}"; do
  number=$((index + 1))
  docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f "/tmp/$number.sql" >/dev/null
done
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/smoke.sql
