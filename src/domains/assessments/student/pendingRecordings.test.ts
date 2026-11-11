import { describe, expect, it } from 'vitest';
import { flushPendingRecordings, hasPendingRecordings, setPendingRecording } from './pendingRecordings';

describe('pending recordings', () => {
  it('sends every pending recording before a part closes', async () => {
    const sent: string[] = [];
    setPendingRecording('sp', async () => { sent.push('sp'); });
    setPendingRecording('si', async () => { sent.push('si'); });
    expect(hasPendingRecordings()).toBe(true);
    await flushPendingRecordings();
    expect(sent).toEqual(['sp', 'si']);
    setPendingRecording('sp', null); setPendingRecording('si', null);
    expect(hasPendingRecordings()).toBe(false);
  });
  it('fails when a recording cannot be sent, so the part stays open', async () => {
    setPendingRecording('sp', async () => { throw new Error('offline'); });
    await expect(flushPendingRecordings()).rejects.toThrow('offline');
    setPendingRecording('sp', null);
  });
});
