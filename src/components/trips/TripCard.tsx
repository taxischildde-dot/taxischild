import React from 'react';
import type { Trip, User, Vehicle } from '../../types';
import { ENTRY_SOURCE_LABEL, PAYMENT_METHOD_LABEL, TRIP_STATUS_COLOR, TRIP_STATUS_LABEL } from '../../lib/labels';
import { formatDateTime, formatMoney, formatTime } from '../../lib/format';
import { Badge } from '../ui/Card';
import { PinIcon, FlagIcon, CheckIcon, PlayIcon, XIcon, EditIcon, UsersIcon } from '../ui/Icons';

interface TripCardProps {
  trip: Trip;
  driver?: User;
  vehicle?: Vehicle;
  showDriver?: boolean;
  onAdvance?: (trip: Trip) => void;
  onCancel?: (trip: Trip) => void;
  onEdit?: (trip: Trip) => void;
  onAssign?: (trip: Trip) => void;
}

const nextAction: Record<Trip['status'], { label: string; icon: React.FC<any> } | null> = {
  scheduled: { label: 'Fahrt starten', icon: PlayIcon },
  ongoing: { label: 'Fahrt beenden', icon: CheckIcon },
  completed: null,
  cancelled: null,
};

export function TripCard({ trip, driver, vehicle, showDriver, onAdvance, onCancel, onEdit, onAssign }: TripCardProps) {
  const action = nextAction[trip.status];
  const isUnassigned = !trip.driverId;
  const hasDistinctDueTime = trip.dueAt && trip.dueAt !== trip.scheduledAt;
  const mapUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div
      className={`overflow-hidden rounded-card border bg-cream-100 shadow-card ${
        isUnassigned && trip.status === 'scheduled' ? 'border-amber-400/70' : 'border-cream-400/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5">
        <div className="min-w-0">
          <p className="truncate font-display text-[1.05rem] font-extrabold text-ink">{trip.customerName}</p>
          <p className="font-meter text-xs text-ink/45">
            {formatDateTime(trip.scheduledAt)}
            {hasDistinctDueTime && (
              <span className="ml-1.5 font-bold text-danger">· Fällig {formatTime(trip.dueAt!)}</span>
            )}
          </p>
        </div>
        <Badge className={TRIP_STATUS_COLOR[trip.status]}>{TRIP_STATUS_LABEL[trip.status]}</Badge>
      </div>

      <div className="mt-3 space-y-1.5 px-4">
        <a
          href={mapUrl(trip.pickupAddress)}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-2 rounded-lg text-sm text-ink/75 underline-offset-2 transition hover:text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label={`Abholadresse in Google Maps öffnen: ${trip.pickupAddress}`}
        >
          <PinIcon width={16} height={16} className="mt-0.5 shrink-0 text-amber-600" />
          <span className="leading-snug">{trip.pickupAddress}</span>
        </a>
        <a
          href={mapUrl(trip.destinationAddress)}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-2 rounded-lg text-sm text-ink/75 underline-offset-2 transition hover:text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label={`Zieladresse in Google Maps öffnen: ${trip.destinationAddress}`}
        >
          <FlagIcon width={16} height={16} className="mt-0.5 shrink-0 text-ink/40" />
          <span className="leading-snug">
            {trip.destinationAddress}
            {trip.destinationCode && <span className="ml-1 font-meter font-bold text-ink/50">({trip.destinationCode})</span>}
          </span>
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 px-4 text-[0.68rem] font-bold text-ink/45">
        <Badge className="border-ink/10 bg-ink/5 text-ink/60">{ENTRY_SOURCE_LABEL[trip.entrySource]}</Badge>
        <Badge className="border-ink/10 bg-ink/5 text-ink/60">{PAYMENT_METHOD_LABEL[trip.paymentMethod]}</Badge>
        {showDriver && driver && <Badge className="border-ink/10 bg-ink/5 text-ink/60">{driver.name}</Badge>}
        {showDriver && isUnassigned && (
          <Badge className="border-amber-500/40 bg-amber-100 text-amber-700">Nicht zugewiesen</Badge>
        )}
        {vehicle && <Badge className="border-ink/10 bg-ink/5 text-ink/60">{vehicle.plate}</Badge>}
      </div>

      {trip.status === 'cancelled' && trip.cancellationReason && (
        <p className="mx-4 mt-3 rounded-lg bg-danger/5 px-3 py-2 text-xs font-semibold text-danger">
          Stornierungsgrund: {trip.cancellationReason}
        </p>
      )}

      {/* Perforierte Trennlinie — das Erkennungsmerkmal der Fahrtenkarte */}
      <div className="mt-3.5 h-[2px] bg-dispatch-tear opacity-70" />

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="font-meter text-xl font-bold tabular-nums text-amber-600">
          {trip.price != null ? formatMoney(trip.price, trip.currency) : 'Preis offen'}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {onAssign && isUnassigned && trip.status === 'scheduled' && (
            <button
              onClick={() => onAssign(trip)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-asphalt-900 px-3 text-xs font-bold text-cream-100 transition hover:bg-asphalt-800"
            >
              <UsersIcon width={14} height={14} />
              Fahrer zuweisen
            </button>
          )}
          {onEdit && trip.status !== 'completed' && trip.status !== 'cancelled' && (
            <button
              onClick={() => onEdit(trip)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60 transition hover:bg-ink/10"
              aria-label="Bearbeiten"
            >
              <EditIcon width={16} height={16} />
            </button>
          )}
          {onCancel && (trip.status === 'scheduled' || trip.status === 'ongoing') && (
            <button
              onClick={() => onCancel(trip)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger transition hover:bg-danger/20"
              aria-label="Stornieren"
            >
              <XIcon width={16} height={16} />
            </button>
          )}
          {action && onAdvance && !isUnassigned && (
            <button
              onClick={() => onAdvance(trip)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-400 px-3 text-xs font-bold text-asphalt-950 transition hover:bg-amber-500"
            >
              <action.icon width={14} height={14} />
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
