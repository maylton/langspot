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
docker cp "$repo_dir/supabase/tests/cefr_pilot_bank_smoke.sql" "$container_name:/tmp/pilot-smoke.sql" >/dev/null
docker cp "$repo_dir/supabase/tests/cefr_a2_b1_placement_smoke.sql" "$container_name:/tmp/a2-b1-smoke.sql" >/dev/null
docker cp "$repo_dir/supabase/tests/cefr_level_check_followup_smoke.sql" "$container_name:/tmp/level-check-followup-smoke.sql" >/dev/null
docker cp "$repo_dir/supabase/tests/live_assessment_smoke.sql" "$container_name:/tmp/live-smoke.sql" >/dev/null
docker cp "$repo_dir/supabase/tests/report_notes_smoke.sql" "$container_name:/tmp/report-notes-smoke.sql" >/dev/null
docker cp "$repo_dir/supabase/tests/review_queue_smoke.sql" "$container_name:/tmp/review-queue-smoke.sql" >/dev/null
docker cp "$repo_dir/supabase/seed.sql" "$container_name:/tmp/pilot-seed.sql" >/dev/null
migrations=(
  20260903204901_create_assessments_foundation.sql
  20260903210547_add_assessment_mvp_workflows.sql
  20260904021343_secure_assessment_grading_and_results.sql
  20260904033000_add_assessment_integrity_and_adaptive_placement.sql
  20260904050000_add_assessment_listening_writing_speaking.sql
  20260904060000_integrate_assessment_progress.sql
  20260904104029_add_cefr_assessment_layer.sql
  20260904110918_add_cefr_pilot_bank.sql
  20260904121534_expand_cefr_pilot_bank_v0_2.sql
  20260904162620_add_cefr_level_check_presets.sql
  20260904170000_fix_cefr_level_check_listening_and_selection.sql
  20261106120000_drop_legacy_review_assessment_response.sql
  20261106130000_add_live_assessment_administration.sql
  20261106140000_add_assessment_report_notes.sql
  20261106150000_add_assessment_review_queue.sql
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
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/pilot-seed.sql >/dev/null
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/pilot-seed.sql >/dev/null
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/smoke.sql
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/pilot-smoke.sql
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/a2-b1-smoke.sql
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/level-check-followup-smoke.sql
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/live-smoke.sql
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/report-notes-smoke.sql
docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f /tmp/review-queue-smoke.sql
