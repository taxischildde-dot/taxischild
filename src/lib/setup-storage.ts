import { getTenantStorageScope } from "./auth-storage";

export type TaxiSetup = {
  companyName: string;
  vehicleNumber: string;
  driverName: string;
  inviteCode: string;
  vehicles: Array<{ id: string; label: string; registration: string; notes: string }>;
  drivers: Array<{ id: string; name: string; email: string; phone: string; active: boolean }>;
  defaultVehicleId?: string;
};

export const SETUP_STORAGE_KEY = "taxiFlotte.setup";

export const emptySetup: TaxiSetup = {
  companyName: "",
  vehicleNumber: "",
  driverName: "",
  inviteCode: "",
  vehicles: [],
  drivers: [],
  defaultVehicleId: "",
};

function getScopedStorageKey(baseKey: string, tenantId?: string): string {
  return `${baseKey}.${tenantId ?? getTenantStorageScope()}`;
}

export function createVehicle(label: string, registration: string) {
  return {
    id: `vehicle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label: label || "Fahrzeug 1",
    registration: registration || "",
    notes: "",
  };
}

export function createDriver(name: string, email = "") {
  return {
    id: `driver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || "Hauptfahrer",
    email,
    phone: "",
    active: true,
  };
}

export function createInviteCode(): string {
  return `TX-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Reads the saved setup from localStorage. */
export function loadSetup(tenantId?: string): TaxiSetup {
  try {
    const scopedKey = getScopedStorageKey(SETUP_STORAGE_KEY, tenantId);
    const legacyRaw = window.localStorage.getItem(SETUP_STORAGE_KEY);
    const raw = window.localStorage.getItem(scopedKey) ?? legacyRaw;
    if (!raw) return emptySetup;
    const parsed = JSON.parse(raw);
    const vehicles = Array.isArray(parsed.vehicles) && parsed.vehicles.length
      ? parsed.vehicles
      : parsed.vehicleNumber
        ? [createVehicle(parsed.vehicleNumber, parsed.vehicleNumber)]
        : [];
    const drivers = Array.isArray(parsed.drivers) && parsed.drivers.length
      ? parsed.drivers
      : parsed.driverName
        ? [createDriver(parsed.driverName)]
        : [];

    return {
      companyName: parsed.companyName ?? "",
      vehicleNumber: parsed.vehicleNumber ?? "",
      driverName: parsed.driverName ?? "",
      inviteCode: parsed.inviteCode ?? "",
      vehicles,
      drivers,
      defaultVehicleId: parsed.defaultVehicleId ?? (vehicles[0]?.id ?? ""),
    };
  } catch {
    return emptySetup;
  }
}

export function saveSetup(setup: TaxiSetup, tenantId?: string) {
  const scopedKey = getScopedStorageKey(SETUP_STORAGE_KEY, tenantId);
  window.localStorage.setItem(scopedKey, JSON.stringify(setup));
}

export function isSetupComplete(setup: TaxiSetup): boolean {
  return Boolean(
    setup.companyName.trim() &&
      setup.vehicles.some((vehicle) => vehicle.label.trim() || vehicle.registration.trim()) &&
      setup.drivers.some((driver) => driver.name.trim())
  );
}
