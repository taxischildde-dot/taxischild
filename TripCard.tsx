import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { CancelReason, Trip, cancelReasonLabels, googleMapsUrl } from "../lib/trips-storage";

type TripCardProps = {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
};

const reasonOptions: CancelReason[] = ["kunde", "nicht_angetroffen", "medizinisch", "sonstiges"];

export default function TripCard({ trip, onUpdate }: TripCardProps) {
  const [cancelPanelOpen, setCancelPanelOpen] = useState(false);
  const [reason, setReason] = useState<CancelReason>("kunde");

  const isFinal = trip.status === "erledigt" || trip.status === "storniert";

  const advanceStatus = () => {
    if (trip.status === "geplant") onUpdate({ ...trip, status: "aktiv" });
    else if (trip.status === "aktiv") onUpdate({ ...trip, status: "erledigt" });
  };

  const confirmCancel = () => {
    onUpdate({ ...trip, status: "storniert", cancelReason: reason });
    setCancelPanelOpen(false);
  };

  const undoCancel = () => {
    onUpdate({ ...trip, status: "geplant", cancelReason: undefined });
  };

  return (
    <div
      className={`rounded-lg border bg-panel p-4 transition-colors ${
        trip.status === "storniert" ? "border-alert/50" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-2xl font-600 text-cream">{trip.pickupTime}</span>
          {trip.dueTime && <span className="text-xs text-muted">fällig {trip.dueTime}</span>}
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <p className="mt-2 font-body text-lg text-cream">{trip.customerName}</p>
      <p className="text-sm text-muted">{trip.pickupAddress}</p>

      <div className="mt-2 flex items-center gap-1.5 font-mono text-sm uppercase tracking-wider text-amber">
        <span aria-hidden="true">→</span>
        <span>{trip.destination}</span>
      </div>

      {(trip.wheelchair || trip.prebooked || trip.notes) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {trip.wheelchair && (
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted">
              ♿ Rolli
            </span>
          )}
          {trip.prebooked && (
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted">
              📅 Vorbestellung
            </span>
          )}
          {trip.notes && (
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted">
              {trip.notes}
            </span>
          )}
        </div>
      )}

      {trip.status === "storniert" && trip.cancelReason && (
        <p className="mt-3 font-mono text-xs text-alert">
          Storniert · {cancelReasonLabels[trip.cancelReason]}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={googleMapsUrl(trip.pickupAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-md border border-line font-mono text-sm uppercase tracking-signage text-cream transition-colors hover:border-amber hover:text-amber"
        >
          Route ↗
        </a>

        {!isFinal && (
          <button
            type="button"
            onClick={advanceStatus}
            className="flex h-12 flex-1 items-center justify-center rounded-md bg-amber font-mono text-sm font-600 uppercase tracking-signage text-asphalt"
          >
            {trip.status === "geplant" ? "Starten" : "Abschließen"}
          </button>
        )}

        {!isFinal && (
          <button
            type="button"
            onClick={() => setCancelPanelOpen((v) => !v)}
            className="flex h-12 items-center justify-center rounded-md border border-alert px-4 font-mono text-sm uppercase tracking-signage text-alert"
          >
            Storno
          </button>
        )}

        {trip.status === "storniert" && (
          <button
            type="button"
            onClick={undoCancel}
            className="flex h-12 items-center justify-center rounded-md border border-line px-4 font-mono text-sm uppercase tracking-signage text-muted hover:border-amber hover:text-amber"
          >
            Rückgängig
          </button>
        )}
      </div>

      {cancelPanelOpen && (
        <div className="mt-3 rounded-md border border-alert/40 bg-asphalt p-3">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-signage text-muted">
            Grund der Stornierung
          </p>
          <div className="flex flex-col gap-2">
            {reasonOptions.map((option) => (
              <label
                key={option}
                className="flex h-11 items-center gap-2.5 rounded-md border border-line px-3 text-sm text-cream"
              >
                <input
                  type="radio"
                  name={`cancel-reason-${trip.id}`}
                  checked={reason === option}
                  onChange={() => setReason(option)}
                  className="h-4 w-4 accent-alert"
                />
                {cancelReasonLabels[option]}
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirmCancel}
              className="h-12 flex-1 rounded-md bg-alert font-mono text-sm font-600 uppercase tracking-signage text-cream"
            >
              Fahrt stornieren
            </button>
            <button
              type="button"
              onClick={() => setCancelPanelOpen(false)}
              className="h-12 rounded-md border border-line px-4 font-mono text-sm uppercase tracking-signage text-muted"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
