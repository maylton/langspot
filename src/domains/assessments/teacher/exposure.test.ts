import { describe, expect, it } from 'vitest';
import { buildSeenIndex, seenLabel, studentFormSeed, summarizeExposure } from './exposure';

describe('buildSeenIndex', () => {
  it('indexes items and keeps the latest sighting of each text', () => {
    const index = buildSeenIndex([
      { itemKey: 'R-A1-001-Q1', taskletKey: 'R-A1-001', skill: 'reading', seenAt: '2026-11-01T12:00:00Z', assessmentTitle: 'Old' },
      { itemKey: 'R-A1-001-Q2', taskletKey: 'R-A1-001', skill: 'reading', seenAt: '2026-11-10T12:00:00Z', assessmentTitle: 'Level Placement - A2' },
      { itemKey: 'LU-A2-004', taskletKey: null, skill: 'language_use', seenAt: '2026-11-10T12:00:00Z', assessmentTitle: 'Level Placement - A2' },
    ]);
    expect(index.items.size).toBe(3);
    expect(index.texts.get('R-A1-001')?.assessmentTitle).toBe('Level Placement - A2');
    expect(seenLabel('Lucas', index.items.get('LU-A2-004')!)).toBe('Lucas já viu em “Level Placement - A2” (10/11/2026)');
  });
});

describe('summarizeExposure', () => {
  const base = { seenAt: '2026-11-10T12:00:00Z', assessmentTitle: 'Level Placement - A2' };
  it('groups repeated Reading questions by text and lists productive tasks', () => {
    const summary = summarizeExposure({
      fixed: [
        { ...base, sectionTitle: 'PART 1', skill: 'reading', itemKey: 'R-A1-001-Q1', taskletKey: 'R-A1-001', taskletTitle: 'The market' },
        { ...base, sectionTitle: 'PART 1', skill: 'reading', itemKey: 'R-A1-001-Q2', taskletKey: 'R-A1-001', taskletTitle: 'The market' },
        { ...base, sectionTitle: 'PART 3', skill: 'writing', itemKey: 'W-A2-002', taskletKey: null, taskletTitle: null },
      ],
      pools: [
        { sectionTitle: 'PART 2 — Language Use · Target A2', skill: 'language_use', poolSize: 20, drawCount: 10, unseen: 15 },
        { sectionTitle: 'PART 2 — Language Use · Floor A1', skill: 'language_use', poolSize: 10, drawCount: 5, unseen: 3 },
      ],
    });
    expect(summary.texts).toEqual([{ key: 'R-A1-001', title: 'The market', ...base }]);
    expect(summary.tasks.map((task) => task.key)).toEqual(['W-A2-002']);
    expect(summary.shortPools).toEqual([{ sectionTitle: 'PART 2 — Language Use · Floor A1', unseen: 3, drawCount: 5 }]);
    expect(summary.freshPools).toBe(1);
    expect(summary.clean).toBe(false);
  });
  it('is clean when nothing repeats and every pool can draw new items', () => {
    expect(summarizeExposure({ fixed: [], pools: [{ sectionTitle: 'LU', skill: 'language_use', poolSize: 20, drawCount: 10, unseen: 20 }] }).clean).toBe(true);
  });
});

describe('studentFormSeed', () => {
  it('builds a readable, accent-free seed', () => {
    expect(studentFormSeed('Lúcas Targino Luna', new Date('2026-11-11T12:00:00Z'), () => 'ab12')).toBe('lucas-targino-luna-2026-11-11-AB12');
    expect(studentFormSeed('***', new Date('2026-11-11T12:00:00Z'), () => 'ab12')).toBe('aluno-2026-11-11-AB12');
  });
});
