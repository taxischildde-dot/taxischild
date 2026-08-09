export type AppNotification = {
  id: string;
  userId: string;
  type: "trip_added" | "trip_updated" | "trip_cancelled" | "trip_reminder";
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  tripId?: string;
};

const NOTIFICATIONS_KEY = "taxiFlotte.notifications";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadNotifications(userId: string): AppNotification[] {
  return readStorage<AppNotification[]>(NOTIFICATIONS_KEY, []).filter((item) => item.userId === userId);
}

export function addNotification(notification: AppNotification) {
  const notifications = readStorage<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const next = [notification, ...notifications.filter((item) => item.id !== notification.id)];
  writeStorage(NOTIFICATIONS_KEY, next);
}

export function markNotificationsRead(userId: string) {
  const notifications = readStorage<AppNotification[]>(NOTIFICATIONS_KEY, []);
  const next = notifications.map((item) => (item.userId === userId ? { ...item, read: true } : item));
  writeStorage(NOTIFICATIONS_KEY, next);
}

export function createNotification(userId: string, type: AppNotification["type"], title: string, message: string, tripId?: string): AppNotification {
  return {
    id: `notify_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    type,
    title,
    message,
    createdAt: Date.now(),
    read: false,
    tripId,
  };
}
