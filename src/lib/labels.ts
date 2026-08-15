import type { EntrySource, PaymentMethod, TripStatus, VehicleStatus } from '../types';

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  scheduled: 'Geplant',
  ongoing: 'Laufend',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

export const TRIP_STATUS_COLOR: Record<TripStatus, string> = {
  scheduled: 'bg-info/10 text-info border-info/30',
  ongoing: 'bg-amber-100 text-amber-700 border-amber-400/60',
  completed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-danger/10 text-danger border-danger/30',
};

export const ENTRY_SOURCE_LABEL: Record<EntrySource, string> = {
  central: 'Zentrale',
  driver_phone: 'Direktanruf beim Fahrer',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Bar',
  card: 'Karte',
  invoice: 'Rechnung',
  health_insurance: 'Krankenkasse / Kostenträger',
  municipality_school: 'Gemeinde / Schulbeförderung',
};

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  active: 'Einsatzbereit',
  maintenance: 'In Werkstatt',
  inactive: 'Außer Betrieb',
};

export const VEHICLE_STATUS_COLOR: Record<VehicleStatus, string> = {
  active: 'bg-success/10 text-success border-success/30',
  maintenance: 'bg-amber-100 text-amber-700 border-amber-400/60',
  inactive: 'bg-asphalt-100/10 text-asphalt-100 border-asphalt-100/30',
};
