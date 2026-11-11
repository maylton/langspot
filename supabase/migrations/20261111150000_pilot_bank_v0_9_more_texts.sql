-- Pilot Bank v0.9: two more Reading texts per level (eight per level), see supabase/seed.sql and
-- docs/cefr/AUTHENTIC_TEXT_SOURCES.md. The bank validator expects 420 units / 66 tasklets / 32 Reading
-- items per level from v0.9 on (earlier versions keep their counts). The validator defaults to
-- 'pilot-0.9', and private.current_pilot_bank_version() (the Level Check generator's default) returns it.

create or replace function private.validate_cefr_pilot_bank(p_bank_version text default 'pilot-0.9')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_expected record;
  -- v0.4 added one authentic Reading tasklet per level; v0.8 and v0.9 added two more each (eight per level).
  v_legacy constant boolean := p_bank_version in ('pilot-0.1', 'pilot-0.2', 'pilot-0.3');
  v_four_texts constant boolean := p_bank_version in ('pilot-0.4', 'pilot-0.5', 'pilot-0.6', 'pilot-0.7');
  v_six_texts constant boolean := p_bank_version = 'pilot-0.8';
  v_units constant integer := case when v_legacy then 300 when v_four_texts then 324 when v_six_texts then 372 else 420 end;
  v_tasklets constant integer := case when v_legacy then 36 when v_four_texts then 42 when v_six_texts then 54 else 66 end;
  v_reading_per_level constant integer := case when v_legacy then 12 when v_four_texts then 16 when v_six_texts then 24 else 32 end;
begin
  select count(*) into v_count
  from public.question_bank
  where bank_version = p_bank_version and source_origin = 'cefr_pilot';
  if v_count <> v_units then raise exception 'Expected % Pilot Bank units, found %', v_units, v_count; end if;

  select count(*) into v_count
  from public.question_bank_tasklets
  where bank_version = p_bank_version;
  if v_count <> v_tasklets then raise exception 'Expected % Pilot Bank tasklets, found %', v_tasklets, v_count; end if;

  if exists (
    select 1 from public.question_bank_tasklets tasklet
    left join public.question_bank item on item.tasklet_id = tasklet.id
    where tasklet.bank_version = p_bank_version
    group by tasklet.id having count(item.id) <> 4
  ) then raise exception 'Every Pilot Bank tasklet must contain exactly four items'; end if;

  if exists (
    select 1 from public.question_bank item
    join public.question_bank_tasklets tasklet on tasklet.id = item.tasklet_id
    where item.bank_version = p_bank_version and (item.skill <> tasklet.skill or item.level <> tasklet.level)
  ) then raise exception 'Pilot Bank tasklet skill/level association failed'; end if;

  if exists (
    select 1 from public.question_bank
    where bank_version = p_bank_version and source_origin = 'cefr_pilot'
      and (quality_status <> 'approved_for_pilot' or psychometric_status <> 'uncalibrated')
  ) then raise exception 'Pilot Bank status metadata is inconsistent'; end if;

  if exists (
    select 1 from public.question_bank
    where bank_version = p_bank_version and source_origin = 'cefr_pilot'
      and skill in ('reading', 'listening', 'language_use')
      and (cardinality(options) <> 4 or answer is null or not answer = any(options) or answer_key is null)
  ) then raise exception 'Pilot Bank objective answer validation failed'; end if;

  if exists (
    select 1 from public.question_bank item
    where item.bank_version = p_bank_version and item.source_origin = 'cefr_pilot'
      and item.skill in ('reading', 'listening', 'language_use')
      and (select count(distinct option) from unnest(item.options) option) <> 4
  ) then raise exception 'Pilot Bank alternatives must be complete and distinct'; end if;

  if exists (
    select 1 from public.question_bank
    where bank_version = p_bank_version and source_origin = 'cefr_pilot'
      and skill in ('writing', 'spoken_production', 'spoken_interaction', 'mediation')
      and (answer is not null or answer_key is not null or cardinality(options) <> 0 or jsonb_array_length(rubric) = 0)
  ) then raise exception 'Pilot Bank productive rubric validation failed'; end if;

  if exists (
    select 1 from public.question_bank_tasklets
    where bank_version = p_bank_version and skill = 'listening'
      and (estimated_duration_min_seconds is null or estimated_duration_max_seconds is null
        or estimated_duration_min_seconds > estimated_duration_max_seconds)
  ) then raise exception 'Pilot Bank listening duration validation failed'; end if;

  if exists (
    select 1 from public.question_bank_tasklets
    where bank_version = p_bank_version and source_reference is not null
      and (source_license is null or source_credit is null or source_adaptation is null)
  ) then raise exception 'Pilot Bank external sources need licence, credit and adaptation'; end if;

  for v_expected in
    select * from (values
      ('reading', v_reading_per_level), ('listening', 12), ('language_use', 15), ('writing', 3),
      ('spoken_production', 3), ('spoken_interaction', 3), ('mediation', 2)
    ) expected(skill, per_level)
  loop
    if exists (
      select 1 from (values ('A1'), ('A2'), ('B1'), ('B2'), ('C1'), ('C2')) levels(level)
      where (select count(*) from public.question_bank item
        where item.bank_version = p_bank_version and item.source_origin = 'cefr_pilot'
          and item.skill = v_expected.skill and item.level = levels.level) <> v_expected.per_level
    ) then raise exception 'Pilot Bank count mismatch for skill %', v_expected.skill; end if;
  end loop;
end;
$$;

create or replace function private.current_pilot_bank_version()
returns text language sql immutable set search_path = '' as $$ select 'pilot-0.9'::text $$;

