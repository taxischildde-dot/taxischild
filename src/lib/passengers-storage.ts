import { getTenantStorageScope } from "./auth-storage";

export type SavedPassenger = {
  id: string;
  name: string;
  phone?: string;
  pickupAddress: string;
  destination: string;
  frequency: "daily" | "weekly" | "occasional";
  notes?: string;
};

const PASSENGERS_KEY = "taxiFlotte.passengers";

function getScopedKey(tenantId?: string): string {
  return `${PASSENGERS_KEY}.${tenantId ?? getTenantStorageScope()}`;
}

export function loadPassengers(tenantId?: string): SavedPassenger[] {
  try {
    const raw = window.localStorage.getItem(getScopedKey(tenantId));
    if (!raw) return [];
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function savePassengers(list: SavedPassenger[], tenantId?: string) {
  window.localStorage.setItem(getScopedKey(tenantId), JSON.stringify(list));
}

export function addPassenger(data: Omit<SavedPassenger, "id">, tenantId?: string): SavedPassenger {
  const list = loadPassengers(tenantId);
  const passenger: SavedPassenger = { ...data, id: `passenger_${Date.now()}` };
  savePassengers([...list, passenger], tenantId);
  return passenger;
}
