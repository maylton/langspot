import type { CefrBaseLevel, CefrSkill } from './types';

export const CEFR_LEVEL_CHECK_BLUEPRINTS = [
  { id: 'cefr-a1-level-check', floor: null, target: 'A1', ceiling: 'A2', objective: 39, productive: 5, formVersion: 'CEFR-A1-CHECK-1.0' },
  { id: 'cefr-a2-level-check', floor: 'A1', target: 'A2', ceiling: 'B1', objective: 52, productive: 5, formVersion: 'CEFR-A2-CHECK-1.0' },
  { id: 'cefr-b1-level-check', floor: 'A2', target: 'B1', ceiling: 'B2', objective: 52, productive: 5, formVersion: 'CEFR-B1-CHECK-1.0' },
  { id: 'cefr-b2-level-check', floor: 'B1', target: 'B2', ceiling: 'C1', objective: 52, productive: 5, formVersion: 'CEFR-B2-CHECK-1.0' },
  { id: 'cefr-c1-level-check', floor: 'B2', target: 'C1', ceiling: 'C2', objective: 52, productive: 5, formVersion: 'CEFR-C1-CHECK-1.0' },
  { id: 'cefr-c2-level-check', floor: 'C1', target: 'C2', ceiling: null, objective: 39, productive: 5, formVersion: 'CEFR-C2-CHECK-1.0' },
] as const;

export const A2_B1_READING_TASKLETS = ['R-A2-002', 'R-B1-001', 'R-B1-002', 'R-B2-001'] as const;
export const A2_B1_LISTENING_TASKLETS = ['L-A2-002', 'L-B1-001', 'L-B1-002', 'L-B2-002'] as const;
export const A2_B1_LANGUAGE_USE_ITEMS = [
  'LU-A2-004', 'LU-A2-005', 'LU-A2-006', 'LU-A2-008', 'LU-A2-009',
  'LU-B1-001', 'LU-B1-002', 'LU-B1-004', 'LU-B1-005', 'LU-B1-006',
  'LU-B1-007', 'LU-B1-008', 'LU-B1-009', 'LU-B1-010', 'LU-B1-013',
  'LU-B2-001', 'LU-B2-003', 'LU-B2-006', 'LU-B2-007', 'LU-B2-009',
] as const;
export const A2_B1_PRODUCTIVE_ITEMS = ['W-A2-001', 'W-B1-002', 'SP-B1-002', 'SI-B1-001', 'M-B1-002'] as const;

export const A2_B1_EXPECTED_DISTRIBUTION: ReadonlyArray<{
  skill: CefrSkill;
  level: CefrBaseLevel;
  count: number;
}> = [
  { skill: 'reading', level: 'A2', count: 4 },
  { skill: 'reading', level: 'B1', count: 8 },
  { skill: 'reading', level: 'B2', count: 4 },
  { skill: 'listening', level: 'A2', count: 4 },
  { skill: 'listening', level: 'B1', count: 8 },
  { skill: 'listening', level: 'B2', count: 4 },
  { skill: 'language_use', level: 'A2', count: 5 },
  { skill: 'language_use', level: 'B1', count: 10 },
  { skill: 'language_use', level: 'B2', count: 5 },
  { skill: 'writing', level: 'A2', count: 1 },
  { skill: 'writing', level: 'B1', count: 1 },
  { skill: 'spoken_production', level: 'B1', count: 1 },
  { skill: 'spoken_interaction', level: 'B1', count: 1 },
  { skill: 'mediation', level: 'B1', count: 1 },
];

export const A2_B1_LISTENING_AUDIO_FILES = A2_B1_LISTENING_TASKLETS.map((taskletId) => ({
  taskletId,
  fileName: `${taskletId}.mp3`,
}));
