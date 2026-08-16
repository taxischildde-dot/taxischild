import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatTime } from './format';

describe('safe date formatting', () => {
  it('returns a visible fallback for malformed cloud timestamps', () => {
    expect(formatDateTime('not-a-date')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatTime('not-a-date')).toBe('—');
  });
});
