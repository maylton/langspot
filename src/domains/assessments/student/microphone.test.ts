import { afterEach, describe, expect, it, vi } from 'vitest';
import { acquireMicrophone, isPermissionPromptActive, releaseMicrophone, resetMicrophoneForTests } from './microphone';

const fakeStream = () => {
  const track = { readyState: 'live', stop: vi.fn(() => { track.readyState = 'ended'; }) };
  return { getAudioTracks: () => [track], getTracks: () => [track], track } as unknown as MediaStream & { track: typeof track };
};

describe('shared microphone', () => {
  afterEach(() => { resetMicrophoneForTests(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('asks for permission once and reuses the live stream', async () => {
    const stream = fakeStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    expect(await acquireMicrophone()).toBe(stream);
    expect(await acquireMicrophone()).toBe(stream);
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    releaseMicrophone();
    expect(stream.track.stop).toHaveBeenCalled();
    await acquireMicrophone();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it('flags the prompt while it is open and for a short grace period', async () => {
    vi.useFakeTimers();
    let resolve!: (stream: MediaStream) => void;
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => new Promise<MediaStream>((done) => { resolve = done; }) } });
    const request = acquireMicrophone();
    expect(isPermissionPromptActive()).toBe(true);
    resolve(fakeStream());
    await request;
    expect(isPermissionPromptActive()).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(isPermissionPromptActive()).toBe(false);
  });
});
