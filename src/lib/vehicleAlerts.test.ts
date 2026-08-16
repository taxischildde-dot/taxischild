import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { getAssignedVehicleSignatures, getChangedVehicleIds, vehicleAssignmentMessage } from './vehicleAlerts';

const vehicle = (patch: Partial<Vehicle> = {}): Vehicle => ({
  id: 'vehicle-1',
  companyId: 'company-1',
  plate: 'WL-TX 101',
  model: 'Mercedes E-Klasse',
  status: 'active',
  assignedDriverIds: ['driver-1'],
  createdAt: '2026-08-16T00:00:00.000Z',
  ...patch,
});

describe('vehicle alerts', () => {
  it('creates signatures only for vehicles responsible to the driver', () => {
    const signatures = getAssignedVehicleSignatures([
      vehicle(),
      vehicle({ id: 'vehicle-2', assignedDriverIds: ['driver-2'] }),
    ], { id: 'driver-1', email: 'driver@example.test' });

    expect(Object.keys(signatures)).toEqual(['vehicle-1']);
    expect(signatures['vehicle-1']).toContain('WL-TX 101');
  });

  it('detects both newly assigned and edited vehicles', () => {
    expect(getChangedVehicleIds({}, { 'vehicle-1': 'new' })).toEqual(['vehicle-1']);
    expect(getChangedVehicleIds({ 'vehicle-1': 'old' }, { 'vehicle-1': 'new' })).toEqual(['vehicle-1']);
    expect(getChangedVehicleIds({ 'vehicle-1': 'same' }, { 'vehicle-1': 'same' })).toEqual([]);
  });

  it('builds a German vehicle message with the driver-facing details', () => {
    expect(vehicleAssignmentMessage(vehicle())).toBe('Fahrzeug aktualisiert: WL-TX 101 · Mercedes E-Klasse');
  });
});
