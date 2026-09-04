import { describe, expect, it } from 'vitest';
import {
  A2_B1_EXPECTED_DISTRIBUTION,
  A2_B1_LANGUAGE_USE_ITEMS,
  A2_B1_LISTENING_AUDIO_FILES,
  A2_B1_LISTENING_TASKLETS,
  A2_B1_PRODUCTIVE_ITEMS,
  A2_B1_READING_TASKLETS,
  CEFR_LEVEL_CHECK_BLUEPRINTS,
} from './a2B1PlacementPreset';

describe('CEFR A2-B1 placement preset', () => {
  it('defines all six boundary-aware Level Check blueprints', () => {
    expect(CEFR_LEVEL_CHECK_BLUEPRINTS.map(({ target }) => target)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
    expect(CEFR_LEVEL_CHECK_BLUEPRINTS.filter(({ target }) => ['A1', 'C2'].includes(target)).every(({ objective }) => objective === 39)).toBe(true);
    expect(CEFR_LEVEL_CHECK_BLUEPRINTS.filter(({ target }) => !['A1', 'C2'].includes(target)).every(({ objective }) => objective === 52)).toBe(true);
    expect(new Set(CEFR_LEVEL_CHECK_BLUEPRINTS.map(({ formVersion }) => formVersion)).size).toBe(6);
  });
  it('has the exact requested objective and productive composition', () => {
    expect(A2_B1_READING_TASKLETS).toHaveLength(4);
    expect(A2_B1_LISTENING_TASKLETS).toHaveLength(4);
    expect(A2_B1_LANGUAGE_USE_ITEMS).toHaveLength(20);
    expect(A2_B1_PRODUCTIVE_ITEMS).toEqual(['W-A2-001', 'W-B1-002', 'SP-B1-002', 'SI-B1-001', 'M-B1-002']);
    expect(A2_B1_EXPECTED_DISTRIBUTION.reduce((total, entry) => total + entry.count, 0)).toBe(57);
  });

  it('keeps every stable selection ID unique', () => {
    const ids = [
      ...A2_B1_READING_TASKLETS,
      ...A2_B1_LISTENING_TASKLETS,
      ...A2_B1_LANGUAGE_USE_ITEMS,
      ...A2_B1_PRODUCTIVE_ITEMS,
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('defines exactly one audio file per Listening tasklet', () => {
    expect(A2_B1_LISTENING_AUDIO_FILES).toEqual([
      { taskletId: 'L-A2-002', fileName: 'L-A2-002.mp3' },
      { taskletId: 'L-B1-001', fileName: 'L-B1-001.mp3' },
      { taskletId: 'L-B1-002', fileName: 'L-B1-002.mp3' },
      { taskletId: 'L-B2-002', fileName: 'L-B2-002.mp3' },
    ]);
  });
});
