import { getTenantStorageScope } from "./auth-storage";

export type TripStatus = "geplant" | "aktiv" | "erledigt" | "storniert";

export type CancelReason = "kunde" | "nicht_angetroffen" | "medizinisch" | "sonstiges";

export type Trip = {
  id: string;
  date: string; // YYYY-MM-DD, local date the trip belongs to
  pickupTime: string; // HH:MM
  dueTime: string; // HH:MM, "Fällig um" — may be empty
  bookingTime?: string;
  customerName: string;
  phoneNumber?: string;
  pickupAddress: string;
  destination: string; // e.g. "ROW" or "Honerdingen"
  wheelchair: boolean; // Rolli
  prebooked: boolean; // Vorbestellung
  price?: string;
  notes: string;
  status: TripStatus;
  cancelReason?: CancelReason;
  createdAt: number;
  vehicleId?: string;
  driverId?: string;
  vehicleLabel?: string;
  driverName?: string;
  passengerCount?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  serviceType?: string;
};

export const TRIPS_STORAGE_KEY = "taxiFlotte.trips";

function getScopedStorageKey(baseKey: string, tenantId?: string): string {
  return `${baseKey}.${tenantId ?? getTenantStorageScope()}`;
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function loadTrips(tenantId?: string): Trip[] {
  try {
    const scopedKey = getScopedStorageKey(TRIPS_STORAGE_KEY, tenantId);
    const legacyRaw = window.localStorage.getItem(TRIPS_STORAGE_KEY);
    const raw = window.localStorage.getItem(scopedKey) ?? legacyRaw;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTrips(trips: Trip[], tenantId?: string) {
  const scopedKey = getScopedStorageKey(TRIPS_STORAGE_KEY, tenantId);
  window.localStorage.setItem(scopedKey, JSON.stringify(trips));
}

export function createTripId(): string {
  return `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const cancelReasonLabels: Record<CancelReason, string> = {
  kunde: "Kunde storniert",
  nicht_angetroffen: "Vor Ort nicht angetroffen",
  medizinisch: "Medizinischer Transport – Problem",
  sonstiges: "Sonstiges",
};

export const statusLabels: Record<TripStatus, string> = {
  geplant: "Geplant",
  aktiv: "Aktiv",
  erledigt: "Erledigt",
  storniert: "Storniert",
};

export function googleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
export function updateTrip(tripId: string, updates: Partial<Trip>, tenantId?: string): Trip | null {
  const all = loadTrips(tenantId);
  const index = all.findIndex(t => t.id === tripId);
  if (index === -1) return null;
  
  const updated = { ...all[index], ...updates, id: tripId }; // preserve id
  all[index] = updated;
  saveTrips(all, tenantId);
  return updated;
}

export function deleteTrip(tripId: string, tenantId?: string): boolean {
  const all = loadTrips(tenantId);
  const filtered = all.filter(t => t.id !== tripId);
  if (filtered.length === all.length) return false;
  saveTrips(filtered, tenantId);
  return true;
}

export function reassignTrip(tripId: string, newDriverId: string, newDriverName: string, tenantId?: string): Trip | null {
  return updateTrip(tripId, { driverId: newDriverId, driverName: newDriverName }, tenantId);
}
