import { useEffect, useState, type FormEvent } from "react";
import { loadSetup, type TaxiSetup } from "../lib/setup-storage";
import { Trip, createTripId, todayKey } from "../lib/trips-storage";

type TripFormProps = {
  onAdd: (trip: Trip) => void;
  onClose: () => void;
};

type TripFormState = {
  bookingTime: string;
  pickupTime: string;
  dueTime: string;
  customerName: string;
  phoneNumber: string;
  pickupAddress: string;
  destination: string;
  wheelchair: boolean;
  prebooked: boolean;
  price: string;
  notes: string;
  vehicleId: string;
  driverId: string;
  passengerCount: string;
  serviceType: string;
};

const emptyForm: TripFormState = {
  bookingTime: "",
  pickupTime: "",
  dueTime: "",
  customerName: "",
  phoneNumber: "",
  pickupAddress: "",
  destination: "",
  wheelchair: false,
  prebooked: true,
  price: "",
  notes: "",
  vehicleId: "",
  driverId: "",
  passengerCount: "",
  serviceType: "standard",
};

export default function TripForm({ onAdd, onClose }: TripFormProps) {
  const [form, setForm] = useState<TripFormState>(emptyForm);
  const [vehicles, setVehicles] = useState<TaxiSetup["vehicles"]>([]);
  const [drivers, setDrivers] = useState<TaxiSetup["drivers"]>([]);

  useEffect(() => {
    const setup = loadSetup();
    setVehicles(setup.vehicles);
    setDrivers(setup.drivers);
  }, []);

  const set = <K extends keyof TripFormState>(key: K, value: TripFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit = Boolean(
    form.pickupTime.trim() && form.customerName.trim() && form.pickupAddress.trim() && form.destination.trim()
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId);
    const selectedDriver = drivers.find((driver) => driver.id === form.driverId);
    const trip: Trip = {
      id: createTripId(),
      date: todayKey(),
      pickupTime: form.pickupTime,
      dueTime: form.dueTime,
      bookingTime: form.bookingTime.trim(),
      customerName: form.customerName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      pickupAddress: form.pickupAddress.trim(),
      destination: form.destination.trim(),
      wheelchair: form.wheelchair,
      prebooked: form.prebooked,
      price: form.price.trim(),
      notes: form.notes.trim(),
      status: "geplant",
      createdAt: Date.now(),
      vehicleId: form.vehicleId || undefined,
      driverId: form.driverId || undefined,
      vehicleLabel: selectedVehicle?.registration || selectedVehicle?.label || "",
      driverName: selectedDriver?.name || "",
      passengerCount: form.passengerCount ? Number(form.passengerCount) : undefined,
      serviceType: form.serviceType || "standard",
    };

    onAdd(trip);
    setForm(emptyForm);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-700 uppercase tracking-wide text-cream">Neue Fahrt</h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-signage text-muted">
            Schnell für Telefonbuchungen erfassen
          </p>
        </div>
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
          <label htmlFor="bookingTime" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Buchungszeit
          </label>
          <input
            id="bookingTime"
            type="time"
            value={form.bookingTime}
            onChange={(event) => set("bookingTime", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pickupTime" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Abholzeit
          </label>
          <input
            id="pickupTime"
            type="time"
            required
            value={form.pickupTime}
            onChange={(event) => set("pickupTime", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            onChange={(event) => set("customerName", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phoneNumber" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Telefon
          </label>
          <input
            id="phoneNumber"
            type="tel"
            placeholder="z. B. 0151 12345678"
            value={form.phoneNumber}
            onChange={(event) => set("phoneNumber", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
          />
        </div>
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
          onChange={(event) => set("pickupAddress", event.target.value)}
          className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            onChange={(event) => set("destination", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber font-mono uppercase tracking-wider"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="price" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Preis
          </label>
          <input
            id="price"
            type="text"
            placeholder="z. B. 18,50 €"
            value={form.price}
            onChange={(event) => set("price", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="vehicleId" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Fahrzeug
          </label>
          <select
            id="vehicleId"
            value={form.vehicleId}
            onChange={(event) => set("vehicleId", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          >
            <option value="">Nicht zugeordnet</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registration || vehicle.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="driverId" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Fahrer
          </label>
          <select
            id="driverId"
            value={form.driverId}
            onChange={(event) => set("driverId", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          >
            <option value="">Nicht zugeordnet</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="passengerCount" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Fahrgäste
          </label>
          <input
            id="passengerCount"
            type="number"
            min={1}
            placeholder="1"
            value={form.passengerCount}
            onChange={(event) => set("passengerCount", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="serviceType" className="font-mono text-[11px] uppercase tracking-signage text-muted">
            Service
          </label>
          <select
            id="serviceType"
            value={form.serviceType}
            onChange={(event) => set("serviceType", event.target.value)}
            className="rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream outline-none focus:border-amber"
          >
            <option value="standard">Standard</option>
            <option value="airport">Flughafen</option>
            <option value="medical">Medizinisch</option>
            <option value="wheelchair">Rollstuhl</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-signage text-muted">Besonderheiten</span>
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
          onChange={(event) => set("notes", event.target.value)}
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
