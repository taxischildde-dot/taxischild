import { describe, expect, it } from 'vitest';
import { uid } from './storage';

describe('uid', () => {
  it('returns a UUID-compatible identifier for synced records', () => {
    expect(uid('vehicle')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});
