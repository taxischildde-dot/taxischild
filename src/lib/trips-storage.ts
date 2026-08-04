export type TripStatus = "geplant" | "aktiv" | "erledigt" | "storniert";

export type CancelReason = "kunde" | "nicht_angetroffen" | "medizinisch" | "sonstiges";

export type Trip = {
  id: string;
  date: string; // YYYY-MM-DD, local date the trip belongs to
  pickupTime: string; // HH:MM
  dueTime: string; // HH:MM, "Fällig um" — may be empty
  customerName: string;
  pickupAddress: string;
  destination: string; // e.g. "ROW" or "Honerdingen"
  wheelchair: boolean; // Rolli
  prebooked: boolean; // Vorbestellung
  notes: string;
  status: TripStatus;
  cancelReason?: CancelReason;
  createdAt: number;
};

export const TRIPS_STORAGE_KEY = "taxiFlotte.trips";

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function loadTrips(): Trip[] {
  try {
    const raw = window.localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTrips(trips: Trip[]) {
  window.localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
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
