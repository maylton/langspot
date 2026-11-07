import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parsePilotBank, validatePilotBank } from './cefr-pilot-bank.mjs';

const markdown = await readFile(new URL('../docs/cefr/LangSpot_CEFR_Placement_Pilot_Bank_v0.5.md', import.meta.url), 'utf8');
const bank = parsePilotBank(markdown);

test('validates the complete Pilot Bank inventory and taxonomy', () => {
  const summary = validatePilotBank(bank);
  assert.equal(summary.total, 324);
  assert.equal(summary.objective, 258);
  assert.equal(summary.productive, 66);
  assert.equal(summary.tasklets, 42);
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
  assert.equal(item?.prompt, 'Explain to the club organiser the two main problems and suggest what information from the comments is most important to act on.');
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
  assert.deepEqual(summary.repeatedPromptGroups, [['R-B1-001-Q1', 'R-B1-003-Q1'], ['R-B1-002-Q1', 'R-C1-004-Q1']]);
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
  assert.equal(item('M-A2-002')?.responseConstraints?.unit, 'seconds');
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
