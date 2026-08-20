import { describe, expect, it, beforeEach } from 'vitest';
import {
  disableNotificationSound,
  notificationSoundEnabled,
  playNotificationSound,
} from './notificationSound';

describe('notification sound preference', () => {
  beforeEach(() => {
    window.localStorage.clear();
    disableNotificationSound();
  });

  it('is opt-in and disabled by default', () => {
    expect(notificationSoundEnabled()).toBe(false);
  });

  it('does not throw when audio is unavailable or disabled', () => {
    expect(() => playNotificationSound()).not.toThrow();
  });
});
