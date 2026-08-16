import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Trip } from '../types';
import { maybeNotifyNewDriverTrips } from './reminders';

const driverId = 'driver-1';

function trip(id: string, assignedDriverId = driverId, status: Trip['status'] = 'scheduled'): Trip {
  return {
    id,
    companyId: 'company-1',
    driverId: assignedDriverId,
    customerName: `Kunde ${id}`,
    pickupAddress: 'Bahnhof',
    destinationAddress: 'Klinik',
    scheduledAt: new Date().toISOString(),
    currency: 'EUR',
    status,
    paymentMethod: 'cash',
    entrySource: 'central',
    createdBy: 'admin-1',
    createdAt: new Date().toISOString(),
  };
}

describe('maybeNotifyNewDriverTrips', () => {
  const notifications: Array<{ title: string; body: string }> = [];

  beforeEach(() => {
    window.localStorage.clear();
    notifications.length = 0;
    vi.stubGlobal('Notification', class {
      static permission = 'granted';
      constructor(title: string, options: { body: string }) {
        notifications.push({ title, body: options.body });
      }
    });
  });

  it('seeds the seen set without notifying on the first sync', () => {
    maybeNotifyNewDriverTrips([trip('first')], driverId);

    expect(notifications).toHaveLength(0);
    expect(window.localStorage.getItem(`taxischild_seen_driver_trips_${driverId}`)).toContain('first');
  });

  it('notifies once when a newly assigned trip appears and then deduplicates it', () => {
    maybeNotifyNewDriverTrips([trip('first')], driverId);
    maybeNotifyNewDriverTrips([trip('first'), trip('second')], driverId);
    maybeNotifyNewDriverTrips([trip('first'), trip('second')], driverId);

    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('TaxiSchild — Neue Fahrt');
    expect(notifications[0].body).toContain('Kunde second');
  });

  it('ignores cancelled trips and trips assigned to another driver', () => {
    maybeNotifyNewDriverTrips([trip('first')], driverId);
    maybeNotifyNewDriverTrips([trip('cancelled', driverId, 'cancelled'), trip('other', 'driver-2')], driverId);

    expect(notifications).toHaveLength(0);
  });

  it('resets malformed seen-trip cache instead of throwing', () => {
    window.localStorage.setItem(`taxischild_seen_driver_trips_${driverId}`, '{broken');

    expect(() => maybeNotifyNewDriverTrips([trip('first')], driverId)).not.toThrow();
    expect(notifications).toHaveLength(0);
    expect(window.localStorage.getItem(`taxischild_seen_driver_trips_${driverId}`)).toContain('first');
  });
});
