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

class TripCardBoundary extends React.Component<React.PropsWithChildren<{ tripId: string }>, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[TaxiSchild] Trip card render failed', { tripId: this.props.tripId, error: error.stack ?? error.message });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="rounded-card border border-danger/30 bg-danger/5 px-4 py-4">
        <p className="text-sm font-bold text-danger">Diese Fahrt konnte nicht dargestellt werden.</p>
        <p className="mt-1 text-xs text-ink/60">Die übrigen Fahrten bleiben verfügbar. Bitte laden Sie diese Karte erneut.</p>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false })}
          className="mt-3 rounded-xl bg-ink px-3 py-2 text-xs font-bold text-cream-100"
        >
          Karte erneut laden
        </button>
      </div>
    );
  }
}

export function TripCard(props: TripCardProps) {
  return (
    <TripCardBoundary tripId={props.trip.id}>
      <TripCardContent {...props} />
    </TripCardBoundary>
  );
}

function TripCardContent({ trip, driver, vehicle, showDriver, onAdvance, onCancel, onEdit, onAssign }: TripCardProps) {
  const status = trip.status in nextAction ? trip.status : 'scheduled';
  const action = nextAction[status];
  const customerName = typeof trip.customerName === 'string' && trip.customerName.trim() ? trip.customerName : 'Unbekannter Kunde';
  const pickupAddress = typeof trip.pickupAddress === 'string' ? trip.pickupAddress : '';
  const destinationAddress = typeof trip.destinationAddress === 'string' ? trip.destinationAddress : '';
  const currency = typeof trip.currency === 'string' && trip.currency ? trip.currency : 'EUR';
  const isUnassigned = !trip.driverId;
  const hasDistinctDueTime = Boolean(trip.dueAt && trip.dueAt !== trip.scheduledAt);
  const mapUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div
      className={`overflow-hidden rounded-card border bg-cream-100 shadow-card ${
        isUnassigned && status === 'scheduled' ? 'border-amber-400/70' : 'border-cream-400/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5">
        <div className="min-w-0">
          <p className="truncate font-display text-[1.05rem] font-extrabold text-ink">{customerName}</p>
          <p className="font-meter text-xs text-ink/45">
            {formatDateTime(typeof trip.scheduledAt === 'string' ? trip.scheduledAt : '')}
            {hasDistinctDueTime && (
              <span className="ml-1.5 font-bold text-danger">· Fällig {formatTime(trip.dueAt!)}</span>
            )}
          </p>
        </div>
        <Badge className={TRIP_STATUS_COLOR[status] ?? TRIP_STATUS_COLOR.scheduled}>{TRIP_STATUS_LABEL[status] ?? 'Unbekannt'}</Badge>
      </div>

      <div className="mt-3 space-y-1.5 px-4">
        <a
          href={mapUrl(pickupAddress)}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-2 rounded-lg text-sm text-ink/75 underline-offset-2 transition hover:text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label={`Abholadresse in Google Maps öffnen: ${pickupAddress}`}
        >
          <PinIcon width={16} height={16} className="mt-0.5 shrink-0 text-amber-600" />
          <span className="leading-snug">{pickupAddress}</span>
        </a>
        <a
          href={mapUrl(destinationAddress)}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-2 rounded-lg text-sm text-ink/75 underline-offset-2 transition hover:text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label={`Zieladresse in Google Maps öffnen: ${destinationAddress}`}
        >
          <FlagIcon width={16} height={16} className="mt-0.5 shrink-0 text-ink/40" />
          <span className="leading-snug">
            {destinationAddress}
            {trip.destinationCode && <span className="ml-1 font-meter font-bold text-ink/50">({trip.destinationCode})</span>}
          </span>
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 px-4 text-[0.68rem] font-bold text-ink/45">
        <Badge className="border-ink/10 bg-ink/5 text-ink/60">{ENTRY_SOURCE_LABEL[trip.entrySource] ?? 'Quelle unbekannt'}</Badge>
        <Badge className="border-ink/10 bg-ink/5 text-ink/60">{PAYMENT_METHOD_LABEL[trip.paymentMethod] ?? 'Zahlungsart offen'}</Badge>
        {showDriver && driver && <Badge className="border-ink/10 bg-ink/5 text-ink/60">{driver.name}</Badge>}
        {showDriver && isUnassigned && (
          <Badge className="border-amber-500/40 bg-amber-100 text-amber-700">Nicht zugewiesen</Badge>
        )}
        {vehicle && <Badge className="border-ink/10 bg-ink/5 text-ink/60">{vehicle.plate}</Badge>}
      </div>

      {status === 'cancelled' && trip.cancellationReason && (
        <p className="mx-4 mt-3 rounded-lg bg-danger/5 px-3 py-2 text-xs font-semibold text-danger">
          Stornierungsgrund: {trip.cancellationReason}
        </p>
      )}

      {/* Perforierte Trennlinie — das Erkennungsmerkmal der Fahrtenkarte */}
      <div className="mt-3.5 h-[2px] bg-dispatch-tear opacity-70" />

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="font-meter text-xl font-bold tabular-nums text-amber-600">
          {typeof trip.price === 'number' && Number.isFinite(trip.price) ? formatMoney(trip.price, currency) : 'Preis offen'}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {onAssign && status === 'scheduled' && (
            <button
              onClick={() => onAssign(trip)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-asphalt-900 px-3 text-xs font-bold text-cream-100 transition hover:bg-asphalt-800"
            >
              <UsersIcon width={14} height={14} />
              {isUnassigned ? 'Fahrer zuweisen' : 'Fahrer ändern'}
            </button>
          )}
          {onEdit && status !== 'completed' && status !== 'cancelled' && (
            <button
              onClick={() => onEdit(trip)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60 transition hover:bg-ink/10"
              aria-label="Bearbeiten"
            >
              <EditIcon width={16} height={16} />
            </button>
          )}
          {onCancel && (status === 'scheduled' || status === 'ongoing') && (
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
