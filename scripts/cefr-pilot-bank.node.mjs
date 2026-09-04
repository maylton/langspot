import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parsePilotBank, validatePilotBank } from './cefr-pilot-bank.mjs';

const markdown = await readFile(new URL('../docs/cefr/LangSpot_CEFR_Pilot_Bank_v0.1.md', import.meta.url), 'utf8');
const bank = parsePilotBank(markdown);

test('validates the complete Pilot Bank inventory and taxonomy', () => {
  const summary = validatePilotBank(bank);
  assert.equal(summary.total, 198);
  assert.equal(summary.objective, 156);
  assert.equal(summary.productive, 42);
  assert.equal(summary.tasklets, 24);
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

test('retains listening transcripts and application duration metadata', () => {
  const tasklet = bank.tasklets.find(({ externalId }) => externalId === 'L-C2-002');
  assert.match(tasklet?.inputText ?? '', /silence can be an active part of interaction/iu);
  assert.equal(tasklet?.estimatedDurationSeconds, 251);
});
