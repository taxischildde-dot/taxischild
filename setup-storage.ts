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

/** Reads the saved setup from localStorage. */
export function loadSetup(): TaxiSetup {
  try {
    const raw = window.localStorage.getItem(SETUP_STORAGE_KEY);
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

export function saveSetup(setup: TaxiSetup) {
  window.localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
}

export function isSetupComplete(setup: TaxiSetup): boolean {
  return Boolean(
    setup.companyName.trim() &&
      setup.vehicles.some((vehicle) => vehicle.label.trim() || vehicle.registration.trim())
  );
}
