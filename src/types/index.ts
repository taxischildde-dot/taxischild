// Kern-Datenmodelle für TaxiSchild.
// Hinweis: Diese Typen sind bewusst so benannt, dass sie sich 1:1 auf
// Tabellenspalten einer künftigen Cloud-Datenbank (z. B. Supabase) übertragen
// lassen (camelCase hier == snake_case dort).

export type UserRole = 'admin' | 'driver';
export type DriverAvailabilityStatus = 'available' | 'break' | 'sick' | 'leave' | 'holiday';

export interface Company {
  id: string;
  name: string;
  createdAt: string; // ISO date
}

// Wochentage für die Arbeitstage eines Fahrers
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const ALL_WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export interface User {
  id: string;
  companyId: string;
  role: UserRole;
  name: string;
  email: string;
  password: string; // nur lokale Demo-Speicherung — bei Cloud-Anbindung durch echte Auth ersetzen
  phone?: string;
  // Zusätzliche Fahrerdaten (nur relevant für role === 'driver')
  employeeNumber?: string; // Fahrer-Nr., erscheint im Fahrbericht
  licenseType?: string; // z. B. "Personenbeförderungsschein (P-Schein)"
  workDays?: Weekday[]; // an diesen Tagen erhält der Fahrer neue Fahrten; leer/undefined = alle Tage
  availabilityStatus?: DriverAvailabilityStatus; // aktuelle Verfügbarkeit für das Admin-Dashboard
  createdAt: string;
}

export type TripStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

// Wer die Buchung tatsächlich im System erfasst hat
export type EntrySource = 'central' | 'driver_phone';

export type PaymentMethod = 'cash' | 'card' | 'invoice' | 'health_insurance' | 'municipality_school';

export interface Trip {
  id: string;
  companyId: string;
  driverId?: string; // leer = "nicht zugewiesen", kann später zugewiesen werden
  vehicleId?: string;
  customerName: string;
  customerPhone?: string;
  pickupAddress: string;
  destinationAddress: string;
  destinationCode?: string; // Kürzel wie im Fahrplan des Auftraggebers, z. B. "ROW"
  scheduledAt: string; // ISO datetime - tatsächliche Abholzeit
  dueAt?: string; // ISO datetime - Fällig-/Spätestzeit laut Auftraggeber, falls abweichend
  /** Optional when the driver does not know the final billing amount yet. */
  price?: number;
  currency: string;
  status: TripStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  paymentMethod: PaymentMethod;
  entrySource: EntrySource;
  notes?: string;
  createdBy: string; // ID des Nutzers, der die Buchung angelegt hat
  createdAt: string;
}

export type VehicleStatus = 'active' | 'maintenance' | 'inactive';

export interface Vehicle {
  id: string;
  companyId: string;
  plate: string;
  model: string;
  year?: number;
  status: VehicleStatus;
  /** New format: one or two drivers responsible for this vehicle. */
  assignedDriverIds?: string[];
  /** Legacy single-driver field kept so existing localStorage records remain readable. */
  assignedDriverId?: string;
  notes?: string;
  createdAt: string;
}

/** Normalizes both the current and legacy vehicle assignment shapes. */
export function getResponsibleDriverIds(vehicle: Pick<Vehicle, 'assignedDriverIds' | 'assignedDriverId'>): string[] {
  const ids = vehicle.assignedDriverIds?.filter(Boolean) ?? [];
  if (ids.length > 0) return ids.slice(0, 2);
  return vehicle.assignedDriverId ? [vehicle.assignedDriverId] : [];
}

// Ein Tagesdatensatz je Fahrer — die Kilometerstände gehören zum Fahrbericht,
// die Arbeitszeiten zum Stundenzettel. Ein Eintrag pro (Fahrer, Datum).
export interface DailyLog {
  id: string;
  companyId: string;
  driverId: string;
  vehicleId?: string;
  date: string; // yyyy-MM-dd
  odometerStart?: number;
  odometerEnd?: number;
  workStart?: string; // HH:mm
  workEnd?: string; // HH:mm
  breakMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  userId: string;
}
