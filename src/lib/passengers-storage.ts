export type PassengerProfile = {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  lastUsedAt: number;
};

const PASSENGERS_KEY = "taxiFlotte.passengers";

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

export function loadPassengers(): PassengerProfile[] {
  return readStorage<PassengerProfile[]>(PASSENGERS_KEY, []);
}

export function savePassenger(passenger: PassengerProfile) {
  const passengers = loadPassengers();
  const next = passengers.filter((item) => item.id !== passenger.id);
  writeStorage(PASSENGERS_KEY, [...next, passenger].sort((left, right) => right.lastUsedAt - left.lastUsedAt));
}

export function upsertPassenger(input: { name: string; phone?: string; address?: string; notes?: string }) {
  const cleanedName = input.name.trim();
  if (!cleanedName) return null;

  const passengers = loadPassengers();
  const existing = passengers.find((candidate) => candidate.name.toLowerCase() === cleanedName.toLowerCase());
  const nextPassenger: PassengerProfile = {
    id: existing?.id ?? `passenger_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: cleanedName,
    phone: input.phone?.trim() ?? "",
    address: input.address?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    lastUsedAt: Date.now(),
  };

  savePassenger(nextPassenger);
  return nextPassenger;
}
