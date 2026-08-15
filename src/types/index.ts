// Kern-Datenmodelle für TaxiSchild.
// Hinweis: Diese Typen sind bewusst so benannt, dass sie sich 1:1 auf
// Tabellenspalten einer künftigen Cloud-Datenbank (z. B. Supabase) übertragen
// lassen (camelCase hier == snake_case dort).

export type UserRole = 'admin' | 'driver';

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
  createdAt: string;
}

export type TripStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

// Wer die Buchung tatsächlich im System erfasst hat
export type EntrySource = 'central' | 'driver_phone';

export type PaymentMethod = 'cash' | 'card' | 'invoice';

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
  price: number;
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
  assignedDriverId?: string;
  notes?: string;
  createdAt: string;
}

// Ein Tagesdatensatz je Fahrer — deckt sowohl den Fahrbericht (Kilometerstände)
// als auch den Stundenzettel (Arbeitszeiten) ab. Ein Eintrag pro (Fahrer, Datum).
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
