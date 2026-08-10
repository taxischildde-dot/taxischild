import { getTenantStorageScope, getActiveUser } from "./auth-storage";

export type NotificationType = "new_trip" | "cancelled_trip" | "updated_trip" | "assigned_trip";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  tripId?: string;
  read: boolean;
  createdAt: number;
};

const NOTIFICATIONS_KEY = "taxiFlotte.notifications";

function getScopedKey(tenantId?: string): string {
  return `${NOTIFICATIONS_KEY}.${tenantId ?? getTenantStorageScope()}`;
}

export function loadNotifications(tenantId?: string): Notification[] {
  try {
    const raw = window.localStorage.getItem(getScopedKey(tenantId));
    if (!raw) return [];
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveNotifications(notifications: Notification[], tenantId?: string) {
  window.localStorage.setItem(getScopedKey(tenantId), JSON.stringify(notifications));
}

export function getUnreadNotifications(userId?: string, tenantId?: string): Notification[] {
  const target = userId ?? getActiveUser()?.id;
  if (!target) return [];
  return loadNotifications(tenantId).filter(n => n.userId === target && !n.read);
}

export function markNotificationRead(notificationId: string, tenantId?: string) {
  const all = loadNotifications(tenantId);
  saveNotifications(all.map(n => n.id === notificationId ? { ...n, read: true } : n), tenantId);
}

export function markAllNotificationsRead(userId: string, tenantId?: string) {
  const all = loadNotifications(tenantId);
  saveNotifications(all.map(n => n.userId === userId ? { ...n, read: true } : n), tenantId);
}

export function addNotification(notification: Omit<Notification, "id" | "createdAt">, tenantId?: string): Notification {
  const all = loadNotifications(tenantId);
  const created: Notification = { ...notification, id: `notif_${Date.now()}`, createdAt: Date.now() };
  saveNotifications([...all, created], tenantId);
  return created;
}
