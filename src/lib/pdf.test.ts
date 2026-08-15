import { describe, expect, it } from 'vitest';
import type { Trip } from '../types';
import { getFahrberichtHeaders, getFahrberichtRow } from './pdf';

const trip: Trip = {
  id: 'trip-1',
  companyId: 'company-1',
  driverId: 'driver-1',
  customerName: 'Hans Müller',
  pickupAddress: 'Bahnhofstraße 1',
  destinationAddress: 'Klinik Soltau',
  destinationCode: 'ROW',
  scheduledAt: '2026-08-16T07:30:00.000Z',
  price: 42,
  currency: 'EUR',
  status: 'completed',
  paymentMethod: 'health_insurance',
  entrySource: 'central',
  createdBy: 'admin-1',
  createdAt: '2026-08-16T06:00:00.000Z',
};

describe('paper-form Fahrbericht rows', () => {
  it('includes the customer name and omits time by default', () => {
    expect(getFahrberichtHeaders()).toEqual(['Name', 'Von', 'Nach', 'Kürzel', 'Euro']);
    expect(getFahrberichtRow(trip)).toEqual([
      'Hans Müller',
      'Bahnhofstraße 1',
      'Klinik Soltau',
      'ROW',
      '42.00',
    ]);
  });

  it('adds time only when explicitly requested', () => {
    expect(getFahrberichtHeaders(true)).toEqual(['Zeit', 'Name', 'Von', 'Nach', 'Kürzel', 'Euro']);
    expect(getFahrberichtRow(trip, true)).toHaveLength(6);
  });
});
