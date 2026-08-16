import type { User, Vehicle } from '../types';
import { getResponsibleDriverIds, isVehicleAssignedToUser } from '../types';

export function getAssignedVehicleSignatures(vehicles: Vehicle[], user: Pick<User, 'id' | 'email'>): Record<string, string> {
  return Object.fromEntries(
    vehicles
      .filter((vehicle) => isVehicleAssignedToUser(vehicle, user))
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
