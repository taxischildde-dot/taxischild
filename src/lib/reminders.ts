import type { Trip } from '../types';
import { tomorrowDateKey, toDateKey } from './format';

const LAST_REMINDER_KEY = 'taxischild_last_reminder_date';
const SEEN_DRIVER_TRIPS_PREFIX = 'taxischild_seen_driver_trips_';

function safeNotification(title: string, options: NotificationOptions): void {
  try {
    new Notification(title, options);
  } catch (error) {
    console.warn('[TaxiSchild] Reminder notification unavailable', error);
  }
}

function safeReadIds(key: string): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== 'string')) throw new Error('Invalid reminder cache');
    return new Set(parsed as string[]);
  } catch (error) {
    console.warn('[TaxiSchild] Resetting invalid reminder cache', error);
    try { window.localStorage.removeItem(key); } catch { /* storage unavailable */ }
    return null;
  }
}

// Echte Hintergrund-Push-Benachrichtigungen (auch bei geschlossener App) würden
// einen Push-Server samt Service-Worker-Subscriptions erfordern. Als
// praktikable Lösung ohne eigenen Server prüft die App beim Öffnen, ob für
// morgen Fahrten anstehen, und zeigt dafür einmal pro Tag eine lokale
// Benachrichtigung — sofern der Nutzer die Berechtigung erteilt hat.
export function maybeNotifyTomorrow(trips: Trip[], contextLabel: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const todayKey = toDateKey();
  const lastReminder = window.localStorage.getItem(LAST_REMINDER_KEY);
  if (lastReminder === todayKey) return; // heute schon erinnert

  const tomorrow = tomorrowDateKey();
  const tomorrowTrips = trips.filter(
    (t) => toDateKey(new Date(t.scheduledAt)) === tomorrow && t.status === 'scheduled',
  );
  if (tomorrowTrips.length === 0) return;

  safeNotification('TaxiSchild — Fahrten für morgen', {
    body: `${tomorrowTrips.length} Fahrt(en) für morgen geplant (${contextLabel}).`,
    icon: '/icons/icon-192.png',
  });

  try { window.localStorage.setItem(LAST_REMINDER_KEY, todayKey); } catch { /* keep the reminder best-effort */ }
}

export function maybeNotifyNewDriverTrips(trips: Trip[], driverId: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const assignedTrips = trips.filter((trip) => trip.driverId === driverId && trip.status !== 'cancelled');
  const storageKey = `${SEEN_DRIVER_TRIPS_PREFIX}${driverId}`;
  const seenIds = safeReadIds(storageKey);

  if (!seenIds) {
    try { window.localStorage.setItem(storageKey, JSON.stringify(assignedTrips.map((trip) => trip.id))); } catch { /* cache remains optional */ }
    return;
  }

  const newTrips = assignedTrips.filter((trip) => !seenIds.has(trip.id));
  if (newTrips.length === 0) return;

  const firstTrip = newTrips[0];
  safeNotification('TaxiSchild — Neue Fahrt', {
    body: newTrips.length === 1
      ? `${firstTrip.customerName} um ${new Date(firstTrip.scheduledAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} wurde Ihnen zugewiesen.`
      : `${newTrips.length} neue Fahrten wurden Ihnen zugewiesen.`,
    icon: '/icons/icon-192.png',
  });

  const nextSeenIds = [...new Set([...seenIds, ...assignedTrips.map((trip) => trip.id)])].slice(-200);
  try { window.localStorage.setItem(storageKey, JSON.stringify(nextSeenIds)); } catch { /* cache remains optional */ }
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
}
