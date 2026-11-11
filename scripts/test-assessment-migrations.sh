#!/usr/bin/env bash
set -euo pipefail

container_name="langspot-assessment-test-pg"
repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cleanup() { docker rm -f "$container_name" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

docker run --name "$container_name" -e POSTGRES_PASSWORD=postgres -d postgres:17-alpine >/dev/null
# The image starts a temporary server for initialisation and then restarts it, so wait for
# the init to finish before trusting pg_isready.
for _ in {1..60}; do
  if docker logs "$container_name" 2>&1 | grep -q 'PostgreSQL init process complete' \
    && docker exec "$container_name" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

copy() { docker cp "$repo_dir/$1" "$container_name:/tmp/$2" >/dev/null; }
run() { docker exec "$container_name" psql -v ON_ERROR_STOP=1 -U postgres -f "/tmp/$1" "${@:2}"; }
apply_migrations() {
  for migration in "$@"; do
    copy "supabase/migrations/$migration" "$migration"
    run "$migration" >/dev/null
  done
}

# Phase 1 — schema up to the v0.2 Pilot Bank, with Listening enabled. These smoke tests keep
# covering the Listening infrastructure (play counters, audio guard) that stays in the system.
before_v0_3=(
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
# Phase 2 — Pilot Bank v0.3 and Level Checks without Listening.
from_v0_3=(
  20261106160000_pilot_bank_v0_3_and_disable_listening.sql
  20261106170000_add_assessment_section_pacing.sql
  20261106180000_restrict_pilot_bank_to_teachers.sql
  20261106190000_assessment_integrity_v2.sql
  20261106200000_pilot_bank_v0_4_authentic_texts.sql
  20261106210000_add_assessment_deletion.sql
  20261107120000_level_check_decision_ladder.sql
  20261107130000_pilot_bank_v0_5_defaults.sql
  20261107140000_pilot_bank_v0_6_defaults.sql
  20261107150000_pilot_bank_v0_7_defaults.sql
  20261107160000_assessment_notifications.sql
  20261110120000_level_check_text_variety.sql
  20261110130000_pilot_bank_v0_8_more_texts.sql
  20261111120000_live_attempt_monitor.sql
)

copy supabase/tests/assessment_bootstrap.sql bootstrap.sql
run bootstrap.sql >/dev/null
apply_migrations "${before_v0_3[@]}"
copy supabase/tests/fixtures/pilot_bank_v0_2_seed.sql pilot-seed-v0_2.sql
run pilot-seed-v0_2.sql >/dev/null
run pilot-seed-v0_2.sql >/dev/null
for test in assessment_smoke cefr_pilot_bank_smoke cefr_a2_b1_placement_smoke cefr_level_check_followup_smoke; do
  copy "supabase/tests/$test.sql" "$test.sql"
  run "$test.sql"
done

apply_migrations "${from_v0_3[@]}"
copy supabase/seed.sql pilot-seed.sql
run pilot-seed.sql >/dev/null
run pilot-seed.sql >/dev/null
for test in pilot_bank_v0_3_smoke live_assessment_smoke report_notes_smoke review_queue_smoke section_pacing_smoke integrity_v2_smoke assessment_deletion_smoke level_check_ladder_smoke assessment_notifications_smoke level_check_variety_smoke live_attempt_monitor_smoke; do
  copy "supabase/tests/$test.sql" "$test.sql"
  run "$test.sql"
done
