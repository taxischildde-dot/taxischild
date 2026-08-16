import { describe, expect, it } from 'vitest';
import { clearAppCache, uid } from './storage';

describe('uid', () => {
  it('returns a UUID-compatible identifier for synced records', () => {
    expect(uid('vehicle')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('clears only the TaxiSchild cache namespace', () => {
    window.localStorage.setItem('taxischild_trips', '[]');
    window.localStorage.setItem('sb-project-auth-token', 'keep-me');

    clearAppCache();

    expect(window.localStorage.getItem('taxischild_trips')).toBeNull();
    expect(window.localStorage.getItem('sb-project-auth-token')).toBe('keep-me');
  });
});
