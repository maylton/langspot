# CEFR Level Check Presets

## Architecture

The Level Check layer reuses the existing Assessments domain rather than creating a parallel assessment system. Preset definitions live in `cefr_level_check_presets`; generated assessments continue to use `assessments`, `assessment_sections`, `assessment_questions`, assignments, attempts, autosave/resume, objective grading, rubric review, CEFR profiles, progress tracking and private assessment media.

The authenticated selection service is:

```sql
generate_assessment_from_preset(p_preset_id, p_bank_version, p_selection_seed)
```

The same teacher, preset version, bank version and seed return the existing draft. New generation is deterministic: tasklets are ranked by a seeded hash with topic diversity first, and Language Use items are ranked with subskill diversity first. Every selected item is copied into an immutable assessment snapshot while retaining its `question_bank_id` link.

Each assessment stores:

- `preset_id`
- `preset_version`
- `bank_version`
- `selection_seed`
- `form_version`
- immutable question snapshots

## Available presets

| Preset | Floor | Target | Ceiling | Objective | Productive | Form version |
|---|---|---|---|---:|---:|---|
| A1 Level Check | — | A1 | A2 | 39 | 5 | `CEFR-A1-CHECK-1.0` |
| A2 Level Check | A1 | A2 | B1 | 52 | 5 | `CEFR-A2-CHECK-1.0` |
| B1 Level Check | A2 | B1 | B2 | 52 | 5 | `CEFR-B1-CHECK-1.0` |
| B2 Level Check | B1 | B2 | C1 | 52 | 5 | `CEFR-B2-CHECK-1.0` |
| C1 Level Check | B2 | C1 | C2 | 52 | 5 | `CEFR-C1-CHECK-1.0` |
| C2 Level Check | C1 | C2 | — | 39 | 5 | `CEFR-C2-CHECK-1.0` |

For A2–C1, Reading and Listening contain 4 floor, 8 target and 4 ceiling items; Language Use contains 5 floor, 10 target and 5 ceiling items. A1 contains 8 target + 4 ceiling Reading/Listening and 10 target + 5 ceiling Language Use. C2 contains 4 floor + 8 target Reading/Listening and 5 floor + 10 target Language Use.

Every preset adds two Writing tasks, one Spoken Production task, one Spoken Interaction task and one Mediation task. Productive responses remain in `manual_review`, and results use `after_teacher_review`.

The General CEFR Placement remains a separate construct and is still available independently in the assessment creation menu.

## First real form

- Title: `CEFR B1 Level Check — Pilot Form 1`
- Preset ID: `cefr-b1-level-check`
- Preset version: `1.0`
- Form version: `CEFR-B1-CHECK-1.0`
- Bank version: `pilot-0.2`
- Selection seed: `pilot-form-1`
- Decision rule: `cefr-level-check-v1`
- Routing rule: `cefr-routing-v1`
- Report model: `cefr-profile-v1`
- Initial status: `draft`
- Hard time limit: none, allowing autosave/resume across sittings
- Expected objective time: 50–65 minutes
- Expected productive time: 45–60 minutes, including preparation and assessor interaction

### B1 Pilot Form 1 composition

| Skill | A2 | B1 | B2 | Total |
|---|---:|---:|---:|---:|
| Reading | 4 | 8 | 4 | 16 |
| Listening | 4 | 8 | 4 | 16 |
| Language Use | 5 | 10 | 5 | 20 |
| Writing | 1 | 1 | 0 | 2 |
| Spoken Production | 0 | 1 | 0 | 1 |
| Spoken Interaction | 0 | 1 | 0 | 1 |
| Mediation | 0 | 1 | 0 | 1 |
| **Total** | **14** | **30** | **9** | **57** |

### Reading tasklets

- `R-A2-002` — A Change of Plans — floor
- `R-B1-001` — The Repair Café — primary
- `R-B1-002` — A School Without Bells — primary
- `R-B2-001` — When Convenience Becomes a Default — ceiling

### Listening tasklets and required audio

- `L-A2-002` — Changing a Restaurant Booking — `L-A2-002.mp3`
- `L-B1-001` — A Different Commute — `L-B1-001.mp3`
- `L-B1-002` — A Small Festival Goes Cashless — `L-B1-002.mp3`
- `L-B2-002` — Why Some Parks Leave Fallen Trees — `L-B2-002.mp3`

The editor uploads one audio file per tasklet and copies the resulting `audioPath` to all four tasklet questions. The form cannot be published while any selected Listening item lacks media. Listening scripts remain hidden during the attempt and are marked `after_submit`.

### Language Use

- A2: `LU-A2-004`, `LU-A2-005`, `LU-A2-006`, `LU-A2-008`, `LU-A2-009`
- B1: `LU-B1-001`, `LU-B1-002`, `LU-B1-004`, `LU-B1-005`, `LU-B1-006`, `LU-B1-007`, `LU-B1-008`, `LU-B1-009`, `LU-B1-010`, `LU-B1-013`
- B2: `LU-B2-001`, `LU-B2-003`, `LU-B2-006`, `LU-B2-007`, `LU-B2-009`

The selection covers tense and clause control, word formation, lexical choice, collocation, phrasal verbs, functional language, discourse markers and register.

### Productive tasks

- `W-A2-001` — functional informal email, 60–100 words
- `W-B1-002` — connected opinion article, 120–160 words
- `SP-B1-002` — sustained comparison and justified preference, 1–2 minutes
- `SI-B1-001` — collaborative decision with an assessor, 4–5 minutes
- `M-B1-002` — relevant Homework Club information for a classmate, 1–2 minutes

`M-B1-002` was selected for this pilot because its source notice provides a clear B1 information-selection task. The Pilot Bank importer was also corrected so legacy mediation items such as `M-B1-001` now separate source material from the learner instruction correctly.

## Decision safeguards

Level Checks reuse the CEFR profile engine, then apply preset-aware boundaries:

- overall results are limited to the preset's previous level, previous+, target and target+ where applicable;
- ceiling evidence cannot by itself turn the Level Check into certification of the ceiling level;
- when an automatic result reaches the target but Writing or Spoken Interaction remains below target, the result is capped at the preceding `+` band and sent to teacher review;
- a spread of one full CEFR band or more adds `HIGH_SKILL_VARIANCE` and requires human review;
- productive skills are never definitively auto-classified.

For the B1 form, the report can therefore distinguish A2, A2+, B1 and B1+, while B2 remains ceiling evidence.

## Version 1.1 — Pilot Bank v0.3, Listening disabled (2026-11-06)

Listening is switched off until the audio for each tasklet has been produced
(`public.assessment_feature_flags`, key `listening`). While it is off:

- Level Check presets generate **Reading + Language Use + the five productive tasks**. The removed
  Listening counts are kept in `cefr_level_check_presets.listening_distribution`.
- Objective items per form: A1 and C2 → 27; A2–C1 → 36. Estimated duration drops by 15–20 minutes.
- Parts are numbered consecutively (Reading = PART 1, Language Use = PART 2, …).
- No assessment containing Listening sections or questions can be published (server trigger);
  the builder hides Listening and the General CEFR Placement blueprint omits it.
- Forms generated with preset 1.0 / bank `pilot-0.2` keep their snapshots. Drafts of 1.0 can no
  longer be published; generate the Level Check again to get the 1.1 form.

The bank moves to `pilot-0.3` (`docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.3.md`), built from
v0.2 by `scripts/cefr-pilot-bank-v0_3-changes.py`. The changes follow
`docs/CEFR_CONTENT_AND_BUILDER_REVIEW.md`: option lengths rebalanced (the key is no longer usually
the longest option), the LU-B1-003 double key, duplicated Language Use items, above-level wording
in A1–B1 stems, Writing lengths for A1/A2/B2, missing durations and duplicated productive tasks.
`scripts/cefr-pilot-bank.mjs` now rejects a bank where the key is the longest option in more than
35% of a level's comprehension items, repeated Language Use stems, or productive tasks without a
target length or duration.

### Re-enabling Listening

1. Upload the audio of every Listening tasklet.
2. `update public.assessment_feature_flags set enabled = true where key = 'listening';`
3. Restore the distribution:
   `update public.cefr_level_check_presets set objective_distribution = objective_distribution || jsonb_build_object('listening', listening_distribution), preset_version = '1.2', form_version = regexp_replace(form_version, '-1\.1$', '-1.2');`
