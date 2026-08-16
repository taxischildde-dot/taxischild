import type { DriverAvailabilityStatus, Trip, User } from '../types';

export type DriverDashboardState = {
  kind: 'working' | 'available' | 'unavailable';
  label: string;
  detail: string;
};

export function getDriverDashboardState(driver: User, trips: Trip[]): DriverDashboardState {
  const activeTrip = trips.find((trip) => trip.status === 'ongoing');
  if (activeTrip) {
    return { kind: 'working', label: 'In Fahrt', detail: activeTrip.customerName };
  }

  const status = driver.availabilityStatus;
  if (status === 'sick' || status === 'leave' || status === 'holiday') {
    const labels: Record<Extract<DriverAvailabilityStatus, 'sick' | 'leave' | 'holiday'>, string> = {
      sick: 'Krank',
      leave: 'Urlaub',
      holiday: 'Frei / Feiertag',
    };
    return { kind: 'unavailable', label: labels[status], detail: 'Keine Einteilung heute' };
  }

  return {
    kind: 'available',
    label: status === 'break' ? 'In Pause' : 'Wartet / verfügbar',
    detail: 'Bereit für die nächste Fahrt',
  };
}
