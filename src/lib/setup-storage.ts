import { getTenantStorageScope } from "./auth-storage";

export type TaxiSetup = {
  companyName: string;
  vehicleNumber: string;
  driverName: string;
};

export const SETUP_STORAGE_KEY = "taxiFlotte.setup";

export const emptySetup: TaxiSetup = {
  companyName: "",
  vehicleNumber: "",
  driverName: "",
};

function getScopedStorageKey(baseKey: string, tenantId?: string): string {
  return `${baseKey}.${tenantId ?? getTenantStorageScope()}`;
}

/** Reads the saved setup from localStorage. */
export function loadSetup(tenantId?: string): TaxiSetup {
  try {
    const scopedKey = getScopedStorageKey(SETUP_STORAGE_KEY, tenantId);
    const legacyRaw = window.localStorage.getItem(SETUP_STORAGE_KEY);
    const raw = window.localStorage.getItem(scopedKey) ?? legacyRaw;
    if (!raw) return emptySetup;
    const parsed = JSON.parse(raw);
    return {
      companyName: parsed.companyName ?? "",
      vehicleNumber: parsed.vehicleNumber ?? "",
      driverName: parsed.driverName ?? "",
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
  return Boolean(setup.companyName.trim() && setup.vehicleNumber.trim() && setup.driverName.trim());
}
