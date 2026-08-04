import { useState } from "react";
import { Trip, createTripId, todayKey } from "../lib/trips-storage";

type TripFormProps = {
  onAdd: (trip: Trip) => void;
  onClose: () => void;
};

const emptyForm = {
  pickupTime: "",
  dueTime: "",
  customerName: "",
  pickupAddress: "",
  destination: "",
  wheelchair: false,
  prebooked: false,
  notes: "",
};

export default function TripForm({ onAdd, onClose }: TripFormProps) {
  const [form, setForm] = useState(emptyForm);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit =
    form.pickupTime.trim() && form.customerName.trim() && form.pickupAddress.trim() && form.destination.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const trip: Trip = {
      id: createTripId(),
      date: todayKey(),
      pickupTime: form.pickupTime,
      dueTime: form.dueTime,
      customerName: form.customerName.trim(),
      pickupAddress: form.pickupAddress.trim(),
      destination: form.destination.trim(),
      wheelchair: form.wheelchair,
      prebooked: form.prebooked,
      notes: form.notes.trim(),
      status: "geplant",
      createdAt: Date.now(),
    };

    onAdd(trip);
    setForm(emptyForm);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-lg border border-line bg-panel p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-700 uppercase tracking-wide text-cream">
          Neue Fahrt
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Formular schließen"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line font-mono text-lg text-muted hover:border-amber hover:text-amber"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pickupTime" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Abholzeit
          </label>
          <input
            id="pickupTime"
            type="time"
            required
            value={form.pickupTime}
            onChange={(e) => set("pickupTime", e.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dueTime" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Fällig um
          </label>
          <input
            id="dueTime"
            type="time"
            value={form.dueTime}
            onChange={(e) => set("dueTime", e.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="customerName" className="font-mono text-[11px] uppercase tracking-signage text-muted">
          Kundenname
        </label>
        <input
          id="customerName"
          type="text"
          required
          placeholder="z. B. Frau Keller"
          value={form.customerName}
          onChange={(e) => set("customerName", e.target.value)}
          className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pickupAddress" className="font-mono text-[11px] uppercase tracking-signage text-muted">
          Abholadresse (vollständig)
        </label>
        <input
          id="pickupAddress"
          type="text"
          required
          placeholder="Straße, Hausnummer, PLZ, Ort"
          value={form.pickupAddress}
          onChange={(e) => set("pickupAddress", e.target.value)}
          className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="destination" className="font-mono text-[11px] uppercase tracking-signage text-muted">
          Ziel
        </label>
        <input
          id="destination"
          type="text"
          required
          placeholder="z. B. ROW oder Honerdingen"
          value={form.destination}
          onChange={(e) => set("destination", e.target.value)}
          className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber font-mono uppercase tracking-wider"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-signage text-muted">
          Besonderheiten
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => set("wheelchair", !form.wheelchair)}
            className={`flex h-11 items-center gap-1.5 rounded-full border px-4 font-mono text-sm transition-colors ${
              form.wheelchair ? "border-amber bg-amber text-asphalt" : "border-line text-muted"
            }`}
          >
            ♿ Rolli
          </button>
          <button
            type="button"
            onClick={() => set("prebooked", !form.prebooked)}
            className={`flex h-11 items-center gap-1.5 rounded-full border px-4 font-mono text-sm transition-colors ${
              form.prebooked ? "border-amber bg-amber text-asphalt" : "border-line text-muted"
            }`}
          >
            📅 Vorbestellung
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="font-mono text-[11px] uppercase tracking-signage text-muted">
          Notiz (optional)
        </label>
        <textarea
          id="notes"
          rows={2}
          placeholder="z. B. Rollstuhlrampe nötig, 2. Etage, Klingel defekt …"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="resize-none rounded-md border border-line bg-asphalt px-3 py-3 text-base text-cream placeholder:text-muted/50 outline-none focus:border-amber"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-14 w-full rounded-md bg-amber font-display text-lg font-700 uppercase tracking-signage text-asphalt transition-opacity disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
      >
        Fahrt eintragen
      </button>
    </form>
  );
}
