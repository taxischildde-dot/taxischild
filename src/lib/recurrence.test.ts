import { describe, expect, it } from 'vitest';
import { hasEquivalentTrip, recurringOccurrenceDates } from './recurrence';

describe('weekly recurring taxi bookings', () => {
  it('generates only selected weekdays through the inclusive end date', () => {
    const dates = recurringOccurrenceDates({
      firstScheduledAt: new Date('2026-08-17T08:30:00'),
      endDate: '2026-08-23',
      weekdays: ['mon', 'wed', 'fri'],
    });

    expect(dates.map((date) => date.getDay())).toEqual([1, 3, 5]);
    expect(dates.every((date) => date.getHours() === 8 && date.getMinutes() === 30)).toBe(true);
  });

  it('recognizes an existing booking with the same customer, route, and time', () => {
    const candidate = {
      customerName: 'Frau Meyer',
      pickupAddress: 'Bahnhof 1',
      destinationAddress: 'Klinik',
      scheduledAt: '2026-08-17T08:30:00.000Z',
    };

    expect(hasEquivalentTrip([{ ...candidate }], candidate)).toBe(true);
    expect(hasEquivalentTrip([{ ...candidate, destinationAddress: 'Schule' }], candidate)).toBe(false);
  });
});
