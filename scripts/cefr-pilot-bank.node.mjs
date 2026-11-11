import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parsePilotBank, validatePilotBank } from './cefr-pilot-bank.mjs';

const markdown = await readFile(new URL('../docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.9.md', import.meta.url), 'utf8');
const bank = parsePilotBank(markdown);

test('validates the complete Pilot Bank inventory and taxonomy', () => {
  const summary = validatePilotBank(bank);
  assert.equal(summary.total, 420);
  assert.equal(summary.objective, 354);
  assert.equal(summary.productive, 66);
  assert.equal(summary.tasklets, 66);
});

test('preserves stable IDs, answer keys and tasklet relationships', () => {
  const item = bank.items.find(({ externalId }) => externalId === 'R-B1-001-Q3');
  assert.equal(item?.answerKey, 'C');
  assert.equal(item?.taskletExternalId, 'R-B1-001');
  assert.equal(bank.tasklets.find(({ externalId }) => externalId === item?.taskletExternalId)?.title, 'The Repair Café');
});

test('keeps productive tasks rubric-scored and without objective answers', () => {
  const production = bank.items.find(({ externalId }) => externalId === 'SP-C2-001');
  assert.equal(production?.answer, null);
  assert.equal(production?.rubric.some(({ key }) => key === 'interaction'), false);
  const interaction = bank.items.find(({ externalId }) => externalId === 'SI-C2-001');
  assert.equal(interaction?.rubric.some(({ key }) => key === 'interaction'), true);
  const mediation = bank.items.find(({ externalId }) => externalId === 'M-C1-001');
  assert.match(mediation?.sourceMaterial ?? '', /observational design does not establish causality/);
  assert.doesNotMatch(mediation?.sourceMaterial ?? '', /Explain this finding/);
});

test('separates legacy mediation source material from the learner task', () => {
  const item = bank.items.find(({ externalId }) => externalId === 'M-B1-001');
  assert.match(item?.sourceMaterial ?? '', /Comment 1:/u);
  assert.match(item?.sourceMaterial ?? '', /Comment 2:/u);
  assert.equal(item?.prompt, 'Write an email to the club organiser explaining the two main problems in the comments and saying which one is most important to act on first.'); // v0.7 wording
});

test('retains listening transcripts and application duration metadata', () => {
  const tasklet = bank.tasklets.find(({ externalId }) => externalId === 'L-C2-002');
  assert.match(tasklet?.inputText ?? '', /silence can be an active part of interaction/iu);
  assert.equal(tasklet?.estimatedDurationSeconds, 251);
  const rangedTasklet = bank.tasklets.find(({ externalId }) => externalId === 'L-A1-003');
  assert.equal(rangedTasklet?.estimatedDurationMinSeconds, 25);
  assert.equal(rangedTasklet?.estimatedDurationMaxSeconds, 30);
});

test('imports the expansion and keeps only legitimately repeated stems', () => {
  const summary = validatePilotBank(bank);
  assert.equal(bank.items.find(({ externalId }) => externalId === 'LU-C2-015')?.answerKey, 'B');
  assert.equal(bank.items.find(({ externalId }) => externalId === 'W-A1-003')?.answer, null);
  // Different Reading texts may share a gist stem; Language Use stems must be unique.
  assert.deepEqual(summary.repeatedPromptGroups, [['R-A2-001-Q1', 'R-B1-005-Q1'], ['R-B1-001-Q1', 'R-B1-003-Q1'], ['R-B1-002-Q1', 'R-C1-004-Q1'], ['R-A2-006-Q1', 'R-B2-005-Q1']]);
});

const item = (id) => bank.items.find(({ externalId }) => externalId === id);

test('v0.3 removes the double key and the cross-level duplicate', () => {
  assert.equal(item('LU-B1-003')?.prompt, 'The new sports centre ___ by the mayor last year.');
  assert.equal(item('LU-B1-003')?.answer, 'was opened');
  assert.notEqual(item('LU-C1-003')?.prompt, item('LU-B2-013')?.prompt);
  assert.equal(item('LU-C1-003')?.answer, 'sparked');
  assert.equal(item('LU-C1-013')?.answer, 'pick');
});

test('v0.3 keeps answer keys in place while rebalancing option length', () => {
  assert.equal(item('R-B2-001-Q1')?.answerKey, 'D');
  assert.match(item('R-B2-001-Q1')?.answer ?? '', /^Assistance is useful/); // key paraphrased in v0.5
  for (const level of ['B1', 'B2', 'C1', 'C2']) {
    const comprehension = bank.items.filter((entry) => entry.level === level && ['reading', 'listening'].includes(entry.skill));
    const longest = comprehension.filter((entry) => entry.answer.length === Math.max(...entry.options.map((option) => option.length))).length;
    assert.ok(longest / comprehension.length <= 0.35, `${level}: ${longest}/${comprehension.length}`);
  }
});

test('v0.3 targets level-appropriate lengths and defines every duration', () => {
  assert.deepEqual(item('W-A1-001')?.responseConstraints, { min: 20, max: 35, unit: 'words', label: '20–35 words' });
  assert.equal(item('W-A2-003')?.responseConstraints?.max, 70);
  assert.equal(item('W-B2-001')?.responseConstraints?.max, 190);
  assert.equal(item('SI-C2-003')?.responseConstraints?.label, '7–9 minutes');
  assert.equal(item('M-A2-002')?.responseConstraints?.unit, 'words'); // written since v0.7
  assert.doesNotMatch(item('M-A2-002')?.sourceMaterial ?? '', /Suggested duration/);
  assert.match(item('M-A2-002')?.sourceMaterial ?? '', /R\$15/);
  assert.ok(bank.items.filter(({ skill }) => !['reading', 'listening', 'language_use'].includes(skill)).every(({ responseConstraints }) => responseConstraints));
});

test('v0.4 adds one authentic, attributed Reading text per level', () => {
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    const tasklet = bank.tasklets.find(({ externalId }) => externalId === `R-${level}-004`);
    assert.ok(tasklet, level);
    assert.match(tasklet.sourceReference, /Disponível em: https:\/\/\S+\. Acesso em: 6 nov\. 2026\./);
    assert.match(tasklet.sourceLicense, /Domínio público|Creative Commons/);
    assert.ok(tasklet.sourceCredit.startsWith('Texto:'));
    assert.equal(bank.items.filter(({ taskletExternalId }) => taskletExternalId === tasklet.externalId).length, 4);
  }
  assert.match(bank.tasklets.find(({ externalId }) => externalId === 'R-C2-004').inputText, /^If all mankind minus one/);
  assert.equal(bank.tasklets.find(({ externalId }) => externalId === 'R-B1-001').sourceReference, null);
});

test('v0.5 Reading distractors carry no absolute-word cue and keys keep their letter', () => {
  const absolute = /\b(all|every|everyone|everything|always|never|only|none|nothing|nobody|completely|entirely|totally)\b/i;
  const texts = new Map(bank.tasklets.map((tasklet) => [tasklet.externalId, (tasklet.inputText ?? '').toLowerCase()]));
  for (const entry of bank.items.filter(({ skill }) => skill === 'reading')) {
    if (absolute.test(entry.answer)) continue;
    for (const option of entry.options.filter((value) => value !== entry.answer)) {
      const word = option.match(absolute)?.[0]?.toLowerCase();
      if (word) assert.match(texts.get(entry.taskletExternalId) ?? '', new RegExp(`\\b${word}\\b`), `${entry.externalId}: "${word}"`);
    }
  }
  assert.equal(item('R-B2-004-Q1')?.answerKey, 'D');
  assert.equal(item('R-B2-004-Q1')?.answer, 'Major drink companies agreed to remove soda from high schools.');
});

test('the validator rejects a Reading distractor with an absolute the text does not use', () => {
  const tampered = structuredClone(bank);
  const target = tampered.items.find(({ externalId }) => externalId === 'R-B1-001-Q2');
  target.options[0] = 'never stay while the volunteers repair the object';
  assert.throws(() => validatePilotBank(tampered), /R-B1-001-Q2: distractor uses "never"/);
});

test('v0.6 Language Use keys keep their letter, with real-word distractors and no length cue', () => {
  assert.equal(item('LU-B1-005')?.answerKey, 'B');
  assert.deepEqual(item('LU-B1-005')?.options, ['do', 'make', 'put', 'set']);
  assert.equal(item('LU-C2-002')?.answer, 'tempered');
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    const languageUse = bank.items.filter((entry) => entry.level === level && entry.skill === 'language_use');
    // Ties are not a cue (single words often share a length); count the strictly longest key, as the validator does.
    const longest = languageUse.filter((entry) => {
      const lengths = entry.options.map((option) => option.length);
      return entry.answer.length === Math.max(...lengths) && lengths.filter((length) => length === entry.answer.length).length === 1;
    }).length;
    assert.ok(longest / languageUse.length <= 0.35, `${level}: ${longest}/${languageUse.length}`);
  }
  // Invented forms such as "create up" or "increases up" are gone.
  const invented = /\b(create up|earn out|collect up|increases up|extract out|whose it|are have|is go|have lose|was lose|did we have seen|whereas of|consequently of|for example of)\b/i;
  assert.deepEqual(bank.items.filter((entry) => entry.skill === 'language_use' && entry.options.some((option) => invented.test(option))).map(({ externalId }) => externalId), []);
});

test('the validator rejects a Language Use form where the key is usually the longest option', () => {
  const tampered = structuredClone(bank);
  for (const entry of tampered.items.filter(({ level, skill }) => level === 'B1' && skill === 'language_use').slice(0, 8)) {
    entry.options = entry.options.map((option) => option === entry.answer ? `${option} indeed, without any doubt` : option);
    entry.answer = `${entry.answer} indeed, without any doubt`;
  }
  assert.throws(() => validatePilotBank(tampered), /B1: the key is the longest option in \d+\/15 Language Use items/);
});

test('v0.7 productive tasks: written targets in words, candidate-facing interaction, Cambridge lengths', () => {
  for (const entry of bank.items.filter(({ skill }) => ['writing', 'mediation'].includes(skill))) {
    assert.equal(entry.responseConstraints?.unit, 'words', entry.externalId);
  }
  for (const entry of bank.items.filter(({ skill }) => skill === 'spoken_interaction')) {
    assert.doesNotMatch(entry.prompt, /\b(the learner|the assessor)\b/i, entry.externalId);
    assert.match(entry.prompt, /\b(you|your)\b/i, entry.externalId);
  }
  assert.deepEqual(item('W-B1-001')?.responseConstraints, { min: 100, max: 120, unit: 'words', label: '100–120 words' });
  assert.equal(item('W-C1-002')?.responseConstraints?.label, '220–260 words');
  assert.equal(item('W-C2-001')?.responseConstraints?.label, '280–320 words');
  assert.match(item('M-A1-001')?.sourceMaterial ?? '', /^Source card:/);
  assert.match(item('M-A1-001')?.prompt ?? '', /^Your English-speaking friend/);
});

test('the validator rejects a written task timed in seconds and a prompt about "the learner"', () => {
  const tampered = structuredClone(bank);
  tampered.items.find(({ externalId }) => externalId === 'M-B1-001').responseConstraints = { min: 60, max: 90, unit: 'seconds', label: '60–90 seconds' };
  tampered.items.find(({ externalId }) => externalId === 'SI-B1-001').prompt = 'The learner and assessor agree on two activities.';
  assert.throws(() => validatePilotBank(tampered), (error) => /M-B1-001: written tasks/.test(error.message) && /SI-B1-001: write the task to the candidate/.test(error.message));
});

test('v0.8 adds two Reading texts per level with balanced keys and no length cue', () => {
  const added = bank.items.filter(({ externalId }) => /^R-(A1|A2|B1|B2|C1|C2)-00[56]-Q\d$/.test(externalId));
  assert.equal(added.length, 48);
  const keys = Object.fromEntries(['A', 'B', 'C', 'D'].map((letter) => [letter, added.filter(({ answerKey }) => answerKey === letter).length]));
  assert.deepEqual(keys, { A: 12, B: 12, C: 12, D: 12 });
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    assert.equal(bank.tasklets.filter((tasklet) => tasklet.skill === 'reading' && tasklet.level === level).length, 8, level);
    const longest = added.filter((entry) => entry.level === level && entry.answer.length === Math.max(...entry.options.map((option) => option.length))).length;
    assert.ok(longest <= 2, `${level}: ${longest}/8`);
  }
  const external = bank.tasklets.filter(({ externalId, sourceReference }) => /-00[56]$/.test(externalId) && sourceReference);
  assert.equal(external.length, 8);
  for (const tasklet of external) assert.match(tasklet.sourceReference, /Acesso em: 10 nov\. 2026\.$/);
});

test('v0.9 adds two more Reading texts per level with balanced keys and no length cue', () => {
  const added = bank.items.filter(({ externalId }) => /^R-(A1|A2|B1|B2|C1|C2)-00[78]-Q\d$/.test(externalId));
  assert.equal(added.length, 48);
  const keys = Object.fromEntries(['A', 'B', 'C', 'D'].map((letter) => [letter, added.filter(({ answerKey }) => answerKey === letter).length]));
  assert.deepEqual(keys, { A: 12, B: 12, C: 12, D: 12 });
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    const longest = added.filter((entry) => entry.level === level && entry.answer.length === Math.max(...entry.options.map((option) => option.length))).length;
    assert.ok(longest <= 2, `${level}: ${longest}/8`);
  }
  const external = bank.tasklets.filter(({ externalId, sourceReference }) => /-00[78]$/.test(externalId) && sourceReference);
  assert.equal(external.length, 8);
  for (const tasklet of external) assert.match(tasklet.sourceReference, /Acesso em: 11 nov\. 2026\.$/);
});
