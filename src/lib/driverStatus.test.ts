import { describe, expect, it } from 'vitest';
import type { Trip, User } from '../types';
import { getDriverDashboardState } from './driverStatus';

const driver: User = {
  id: 'driver-1',
  companyId: 'company-1',
  role: 'driver',
  name: 'Anna Fahrer',
  email: 'anna@example.test',
  password: 'secret',
  createdAt: '2026-08-01T00:00:00.000Z',
};

const ongoingTrip: Trip = {
  id: 'trip-1',
  companyId: 'company-1',
  driverId: 'driver-1',
  customerName: 'Kunde unterwegs',
  pickupAddress: 'Bahnhof',
  destinationAddress: 'Klinik',
  scheduledAt: '2026-08-16T08:00:00.000Z',
  price: 20,
  currency: 'EUR',
  status: 'ongoing',
  paymentMethod: 'invoice',
  entrySource: 'central',
  createdBy: 'admin-1',
  createdAt: '2026-08-16T07:00:00.000Z',
};

describe('driver dashboard status', () => {
  it('shows red working state when a driver has an ongoing trip', () => {
    expect(getDriverDashboardState(driver, [ongoingTrip])).toMatchObject({ kind: 'working', label: 'In Fahrt' });
  });

  it('shows green waiting or break state without an ongoing trip', () => {
    expect(getDriverDashboardState(driver, [])).toMatchObject({ kind: 'available', label: 'Wartet / verfügbar' });
    expect(getDriverDashboardState({ ...driver, availabilityStatus: 'break' }, [])).toMatchObject({ kind: 'available', label: 'In Pause' });
  });

  it('shows black unavailable state for sickness, leave, or holiday', () => {
    expect(getDriverDashboardState({ ...driver, availabilityStatus: 'sick' }, [])).toMatchObject({ kind: 'unavailable', label: 'Krank' });
    expect(getDriverDashboardState({ ...driver, availabilityStatus: 'leave' }, [])).toMatchObject({ kind: 'unavailable', label: 'Urlaub' });
    expect(getDriverDashboardState({ ...driver, availabilityStatus: 'holiday' }, [])).toMatchObject({ kind: 'unavailable', label: 'Frei / Feiertag' });
  });
});
