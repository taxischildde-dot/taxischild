const SOUND_ENABLED_KEY = 'taxischild_notification_sound_enabled';

let audioContext: AudioContext | null = null;

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(SOUND_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch {
    // Sound preferences are optional and must never block the app.
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

function beep(): void {
  const context = getAudioContext();
  if (!context || context.state !== 'running') return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.16);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.23);
}

export function notificationSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return readEnabled();
}

export async function enableNotificationSound(): Promise<boolean> {
  const context = getAudioContext();
  if (!context) return false;
  try {
    await context.resume();
    writeEnabled(true);
    beep();
    return true;
  } catch (error) {
    console.warn('[TaxiSchild] Notification sound could not be enabled', error);
    return false;
  }
}

export function disableNotificationSound(): void {
  writeEnabled(false);
}

export function playNotificationSound(): void {
  if (!notificationSoundEnabled()) return;
  try {
    beep();
  } catch (error) {
    console.warn('[TaxiSchild] Notification sound unavailable', error);
  }
}
