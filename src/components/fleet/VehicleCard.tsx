import type { User, Vehicle } from '../../types';
import { VEHICLE_STATUS_COLOR, VEHICLE_STATUS_LABEL } from '../../lib/labels';
import { Badge } from '../ui/Card';
import { EditIcon, FleetIcon, TrashIcon, UsersIcon } from '../ui/Icons';

export function VehicleCard({
  vehicle,
  responsibleDrivers,
  canManage,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  responsibleDrivers: User[];
  canManage?: boolean;
  onEdit?: (v: Vehicle) => void;
  onDelete?: (v: Vehicle) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-cream-400/60 bg-cream-100 p-4 shadow-card">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-asphalt-900 text-amber-400">
        <FleetIcon width={22} height={22} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-meter text-base font-bold tabular-nums text-ink">{vehicle.plate}</p>
          <Badge className={VEHICLE_STATUS_COLOR[vehicle.status]}>{VEHICLE_STATUS_LABEL[vehicle.status]}</Badge>
        </div>
        <p className="truncate text-sm text-ink/60">
          {vehicle.model}
          {vehicle.year ? ` · ${vehicle.year}` : ''}
        </p>
        <p className="mt-1 flex items-start gap-1 text-xs font-semibold text-ink/55">
          <UsersIcon width={13} height={13} className="mt-0.5 shrink-0" />
          {responsibleDrivers.length > 0 ? (
            <span className="truncate">{responsibleDrivers.map((driver) => driver.name).join(' · ')}</span>
          ) : (
            <span className="text-ink/40">Kein verantwortlicher Fahrer</span>
          )}
        </p>
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => onEdit?.(vehicle)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60 hover:bg-ink/10"
            aria-label="Fahrzeug bearbeiten"
          >
            <EditIcon width={16} height={16} />
          </button>
          <button
            onClick={() => onDelete?.(vehicle)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger hover:bg-danger/20"
            aria-label="Fahrzeug löschen"
          >
            <TrashIcon width={16} height={16} />
          </button>
        </div>
      )}
    </div>
  );
}
