import { describe, expect, it } from 'vitest';
import { bulkInsertion } from './integrity';

describe('bulkInsertion', () => {
  it('ignores typing, paste and drop', () => {
    expect(bulkInsertion(10, 11, 'insertText')).toBeNull();
    expect(bulkInsertion(0, 300, 'insertFromPaste')).toBeNull();
    expect(bulkInsertion(0, 300, 'insertFromDrop')).toBeNull();
    expect(bulkInsertion(300, 0, 'deleteContentBackward')).toBeNull();
  });
  it('reports large insertions that did not come from typing', () => {
    expect(bulkInsertion(20, 260, 'insertReplacementText')).toBe(240);
    expect(bulkInsertion(0, 45, undefined)).toBe(45);
  });
});
