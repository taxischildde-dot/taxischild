import type { Vehicle } from '../types';
import { getResponsibleDriverIds } from '../types';

export function getAssignedVehicleSignatures(vehicles: Vehicle[], driverId: string): Record<string, string> {
  return Object.fromEntries(
    vehicles
      .filter((vehicle) => getResponsibleDriverIds(vehicle).includes(driverId))
      .map((vehicle) => [vehicle.id, `${vehicle.plate}|${vehicle.model}|${vehicle.status}|${getResponsibleDriverIds(vehicle).join(',')}`]),
  );
}

export function getChangedVehicleIds(previous: Record<string, string>, current: Record<string, string>): string[] {
  return Object.entries(current)
    .filter(([id, signature]) => !previous[id] || previous[id] !== signature)
    .map(([id]) => id);
}

export function vehicleAssignmentMessage(vehicle: Vehicle): string {
  return `Fahrzeug aktualisiert: ${vehicle.plate} · ${vehicle.model}`;
}
