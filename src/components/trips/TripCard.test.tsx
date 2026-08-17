import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Trip } from '../../types';
import { TripCard } from './TripCard';

const trip: Trip = {
  id: 'trip-ongoing',
  companyId: 'company-1',
  driverId: 'driver-1',
  customerName: 'Frau Meyer',
  pickupAddress: 'Bahnhof',
  destinationAddress: 'Klinik',
  scheduledAt: '2026-08-17T08:00:00.000Z',
  currency: 'EUR',
  status: 'ongoing',
  paymentMethod: 'invoice',
  entrySource: 'central',
  createdBy: 'admin-1',
  createdAt: '2026-08-16T08:00:00.000Z',
};

describe('TripCard ongoing state', () => {
  it('renders the ongoing badge and completion action after Start Trip', () => {
    const markup = renderToStaticMarkup(
      <TripCard trip={trip} onAdvance={() => undefined} />,
    );

    expect(markup).toContain('Laufend');
    expect(markup).toContain('Fahrt beenden');
    expect(markup).toContain('Frau Meyer');
  });

  it('renders a safe fallback when a legacy row contains an unknown status', () => {
    const legacyTrip = { ...trip, status: 'legacy-status' } as unknown as Trip;
    const markup = renderToStaticMarkup(<TripCard trip={legacyTrip} />);

    expect(markup).toContain('Geplant');
    expect(markup).toContain('Preis offen');
  });
});
