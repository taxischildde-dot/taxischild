import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoofSign from "../components/RoofSign";
import FormField from "../components/FormField";
import BrandFooter from "../components/BrandFooter";
import { TaxiSetup, createDriver, createInviteCode, createVehicle, emptySetup, loadSetup, saveSetup, isSetupComplete } from "../lib/setup-storage";

export default function SetupPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<TaxiSetup>(emptySetup);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedSetup = loadSetup();
    setSetup(savedSetup);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSetup(setup);
  }, [setup, hydrated]);

  const update = (field: keyof TaxiSetup) => (value: string) =>
    setSetup((prev) => ({ ...prev, [field]: value }));

  const updateVehicle = (id: string, field: "label" | "registration" | "notes", value: string) => {
    setSetup((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, [field]: value } : vehicle)),
    }));
  };

  const addVehicle = () => {
    setSetup((prev) => ({ ...prev, vehicles: [...prev.vehicles, createVehicle(prev.vehicleNumber || "Fahrzeug", prev.vehicleNumber || "")] }));
  };

  const removeVehicle = (id: string) => {
    setSetup((prev) => ({ ...prev, vehicles: prev.vehicles.filter((vehicle) => vehicle.id !== id) }));
  };

  const updateDriver = (id: string, field: "name" | "email" | "phone" | "active", value: string | boolean) => {
    setSetup((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) => (driver.id === id ? { ...driver, [field]: value } : driver)),
    }));
  };

  const addDriver = () => {
    setSetup((prev) => ({ ...prev, drivers: [...prev.drivers, createDriver(prev.driverName || "Fahrer", "")] }));
  };

  const removeDriver = (id: string) => {
    setSetup((prev) => ({ ...prev, drivers: prev.drivers.filter((driver) => driver.id !== id) }));
  };

  const litSegments = useMemo(
    () => [setup.companyName, setup.vehicles.length > 0 ? `${setup.vehicles.length} Fahrzeuge` : "", setup.drivers.length > 0 ? `${setup.drivers.length} Fahrer` : ""].filter(Boolean).length,
    [setup.companyName, setup.vehicles.length, setup.drivers.length]
  );
  const complete = isSetupComplete(setup);

  const handleContinue = () => {
    if (!complete) return;
    const normalizedSetup: TaxiSetup = {
      ...setup,
      inviteCode: setup.inviteCode || createInviteCode(),
      vehicles: setup.vehicles.length
        ? setup.vehicles
        : [createVehicle(setup.vehicleNumber || "Fahrzeug 1", setup.vehicleNumber || "")],
      drivers: setup.drivers.length
        ? setup.drivers
        : [createDriver(setup.driverName || "Hauptfahrer", "")],
      defaultVehicleId: setup.defaultVehicleId || setup.vehicles[0]?.id || "",
    };
    saveSetup(normalizedSetup);
    navigate("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10 sm:py-14">
      <header className="mb-10 flex flex-col items-center">
        <RoofSign litSegments={litSegments} />
      </header>

      <section className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-700 uppercase tracking-wide text-cream">
          Fahrzeugflotte einrichten
        </h1>
        <p className="mb-8 text-sm text-muted">
          Erfassen Sie Ihr Unternehmen, Ihre Fahrzeuge und Fahrer einmalig. Jede Firma hat ihren eigenen Datenraum.
        </p>

        <form
          className="flex flex-col gap-7 rounded-lg border border-line bg-panel p-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleContinue();
          }}
        >
          <FormField
            id="companyName"
            label="Unternehmen (White-Label)"
            placeholder="z. B. Stadttaxi München eG"
            value={setup.companyName}
            onChange={update("companyName")}
            autoComplete="organization"
          />

          <div className="rounded-md border border-dashed border-line px-3 py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Einladungs-Code</p>
              <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-cream">
                {setup.inviteCode || "wird generiert"}
              </span>
            </div>
            <p className="text-sm text-muted">
              Fahrer können sich mit diesem Code registrieren und erhalten dann nur ihren eigenen Bereich mit Fahrzeug und Fahrten.
            </p>
          </div>

          <div className="rounded-md border border-line p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-700 uppercase tracking-wide text-cream">Fahrzeuge</h2>
              <button type="button" onClick={addVehicle} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-signage text-cream">
                + Fahrzeug
              </button>
            </div>
            {setup.vehicles.map((vehicle) => (
              <div key={vehicle.id} className="mb-3 rounded-md border border-line bg-asphalt p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <input
                    value={vehicle.label}
                    onChange={(event) => updateVehicle(vehicle.id, "label", event.target.value)}
                    placeholder="z. B. Mercedes Vito"
                    className="flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm text-cream outline-none focus:border-amber"
                  />
                  <button type="button" onClick={() => removeVehicle(vehicle.id)} className="rounded-md border border-alert px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-signage text-alert">
                    Löschen
                  </button>
                </div>
                <input
                  value={vehicle.registration}
                  onChange={(event) => updateVehicle(vehicle.id, "registration", event.target.value)}
                  placeholder="Kennzeichen / Fahrzeugnummer"
                  className="mb-2 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-cream outline-none focus:border-amber"
                />
                <textarea
                  value={vehicle.notes}
                  onChange={(event) => updateVehicle(vehicle.id, "notes", event.target.value)}
                  placeholder="Notiz zum Fahrzeug"
                  rows={2}
                  className="w-full resize-none rounded-md border border-line bg-panel px-3 py-2 text-sm text-cream outline-none focus:border-amber"
                />
              </div>
            ))}
            {setup.vehicles.length === 0 && <p className="text-sm text-muted">Noch keine Fahrzeuge erfasst.</p>}
          </div>

          <div className="rounded-md border border-line p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-700 uppercase tracking-wide text-cream">Fahrer</h2>
              <button type="button" onClick={addDriver} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-signage text-cream">
                + Fahrer
              </button>
            </div>
            {setup.drivers.map((driver) => (
              <div key={driver.id} className="mb-3 rounded-md border border-line bg-asphalt p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <input
                    value={driver.name}
                    onChange={(event) => updateDriver(driver.id, "name", event.target.value)}
                    placeholder="Vor- und Nachname"
                    className="flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm text-cream outline-none focus:border-amber"
                  />
                  <button type="button" onClick={() => removeDriver(driver.id)} className="rounded-md border border-alert px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-signage text-alert">
                    Löschen
                  </button>
                </div>
                <input
                  value={driver.email}
                  onChange={(event) => updateDriver(driver.id, "email", event.target.value)}
                  placeholder="E-Mail (optional)"
                  className="mb-2 w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-cream outline-none focus:border-amber"
                />
                <input
                  value={driver.phone}
                  onChange={(event) => updateDriver(driver.id, "phone", event.target.value)}
                  placeholder="Telefon (optional)"
                  className="w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-cream outline-none focus:border-amber"
                />
              </div>
            ))}
            {setup.drivers.length === 0 && <p className="text-sm text-muted">Noch keine Fahrer erfasst.</p>}
          </div>

          <button
            type="submit"
            disabled={!complete}
            className="mt-1 w-full rounded-md bg-amber py-3.5 font-display text-lg font-700 uppercase tracking-signage text-asphalt transition-opacity disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            Weiter zum Dashboard
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Sie können diese Angaben jederzeit über die Dashboard-Einstellungen ändern.
        </p>
      </section>

      <BrandFooter />
    </main>
  );
}
