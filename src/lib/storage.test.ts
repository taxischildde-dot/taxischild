import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAppCache, uid, writeAll } from './storage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('uid', () => {
  it('returns a UUID-compatible identifier for synced records', () => {
    expect(uid('vehicle')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('does not throw when the browser rejects a cache write', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() => writeAll('trips', [{ id: 'trip-1' }])).not.toThrow();
  });

  it('clears only the TaxiSchild cache namespace', () => {
    window.localStorage.setItem('taxischild_trips', '[]');
    window.localStorage.setItem('sb-project-auth-token', 'keep-me');

    clearAppCache();

    expect(window.localStorage.getItem('taxischild_trips')).toBeNull();
    expect(window.localStorage.getItem('sb-project-auth-token')).toBe('keep-me');
  });
});
