import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';

describe('local company data boundaries', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a booking only to its own company context', () => {
    const firstCompany = db.companies.create('Nord Taxi');
    const secondCompany = db.companies.create('Süd Taxi');
    const driver = db.users.create({
      companyId: firstCompany.id,
      role: 'driver',
      name: 'Anna Fahrer',
      email: 'anna@nord.example',
      password: 'demo-password',
    });
    const trip = db.trips.create({
      companyId: firstCompany.id,
      driverId: driver.id,
      customerName: 'Herr Görse',
      pickupAddress: 'Vossworth 22',
      destinationAddress: 'ROW',
      scheduledAt: '2026-08-15T06:30:00.000Z',
      price: 42,
      currency: 'EUR',
      status: 'scheduled',
      paymentMethod: 'invoice',
      entrySource: 'central',
      createdBy: driver.id,
    });

    expect(db.trips.getForCompany(firstCompany.id, trip.id)?.id).toBe(trip.id);
    expect(db.trips.getForCompany(secondCompany.id, trip.id)).toBeUndefined();
    expect(db.trips.byCompany(secondCompany.id)).toEqual([]);
  });

  it('does not update a booking through a different company context', () => {
    const firstCompany = db.companies.create('Nord Taxi');
    const secondCompany = db.companies.create('Süd Taxi');
    const trip = db.trips.create({
      companyId: firstCompany.id,
      customerName: 'Frau Meyer',
      pickupAddress: 'Bahnhof',
      destinationAddress: 'Klinik',
      scheduledAt: '2026-08-15T08:00:00.000Z',
      price: 18,
      currency: 'EUR',
      status: 'scheduled',
      paymentMethod: 'cash',
      entrySource: 'central',
      createdBy: 'admin-1',
    });

    expect(db.trips.updateForCompany(secondCompany.id, trip.id, { status: 'cancelled' })).toBeUndefined();
    expect(db.trips.getForCompany(firstCompany.id, trip.id)?.status).toBe('scheduled');
  });

  it('stores a municipality-funded booking without requiring the final price', () => {
    const company = db.companies.create('SchulTaxi Nord');
    const trip = db.trips.create({
      companyId: company.id,
      customerName: 'Schulbeförderung',
      pickupAddress: 'Schule',
      destinationAddress: 'Wohnort',
      scheduledAt: '2026-08-16T07:30:00.000Z',
      currency: 'EUR',
      status: 'scheduled',
      paymentMethod: 'municipality_school',
      entrySource: 'central',
      createdBy: 'admin-1',
    });

    expect(trip.price).toBeUndefined();
    expect(db.trips.getForCompany(company.id, trip.id)?.paymentMethod).toBe('municipality_school');
  });

  it('supports two responsible drivers and clears assignments only in the owning company', () => {
    const firstCompany = db.companies.create('Nord Taxi');
    const secondCompany = db.companies.create('Süd Taxi');
    const vehicle = db.vehicles.create({
      companyId: firstCompany.id,
      plate: 'WL-TX 404',
      model: 'VW Caddy',
      status: 'active',
      assignedDriverIds: ['driver-1', 'driver-2'],
    });

    expect(db.vehicles.getForCompany(firstCompany.id, vehicle.id)?.assignedDriverIds).toEqual([
      'driver-1',
      'driver-2',
    ]);
    expect(db.vehicles.updateForCompany(secondCompany.id, vehicle.id, { assignedDriverIds: [] })).toBeUndefined();
    expect(db.vehicles.updateForCompany(firstCompany.id, vehicle.id, { assignedDriverIds: undefined })).toMatchObject({
      id: vehicle.id,
      companyId: firstCompany.id,
    });
    expect(db.vehicles.getForCompany(firstCompany.id, vehicle.id)?.assignedDriverIds).toBeUndefined();
  });

  it('keeps daily logs separated by both company and driver', () => {
    const firstCompany = db.companies.create('Nord Taxi');
    const secondCompany = db.companies.create('Süd Taxi');
    const firstLog = db.dailyLogs.upsert({
      companyId: firstCompany.id,
      driverId: 'driver-7',
      date: '2026-08-15',
      patch: { workStart: '06:00', workEnd: '14:00', breakMinutes: 30 },
    });

    expect(db.dailyLogs.byDriverAndDate(firstCompany.id, 'driver-7', '2026-08-15')?.id).toBe(firstLog.id);
    expect(db.dailyLogs.byDriverAndDate(secondCompany.id, 'driver-7', '2026-08-15')).toBeUndefined();
  });
});
