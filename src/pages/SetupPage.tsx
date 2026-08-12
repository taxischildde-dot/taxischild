import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoofSign from "../components/RoofSign";
import BrandFooter from "../components/BrandFooter";
import { TaxiSetup, createVehicle, emptySetup, loadSetup, saveSetup, isSetupComplete } from "../lib/setup-storage";
import { getActiveUser } from "../lib/auth-storage";

export default function SetupPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<TaxiSetup>(emptySetup);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const user = getActiveUser();
    if (!user) { 
      navigate("/login", { replace: true }); 
      return; 
    }
    
    const savedSetup = loadSetup(user.companyId);
    setSetup(savedSetup);
    setHydrated(true);
  }, [navigate]);

  useEffect(() => {
    if (!hydrated) return;
    const user = getActiveUser();
    if (!user) return;
    saveSetup(setup, user.companyId);
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
    setSetup((prev) => ({ 
      ...prev, 
      vehicles: [...prev.vehicles, createVehicle(prev.vehicleNumber || "Fahrzeug", prev.vehicleNumber || "")] 
    }));
  };

  const removeVehicle = (id: string) => {
    setSetup((prev) => ({ ...prev, vehicles: prev.vehicles.filter((vehicle) => vehicle.id !== id) }));
  };

  const litSegments = useMemo(
    () => [
      setup.companyName, 
      setup.vehicles.length > 0 ? `${setup.vehicles.length} Fahrzeuge` : ""
    ].filter(Boolean).length,
    [setup.companyName, setup.vehicles.length]
  );
  
  const complete = isSetupComplete(setup);

  const handleContinue = () => {
    if (!complete) return;
    
    const user = getActiveUser();
    if (!user) return;
    
    const normalizedSetup: TaxiSetup = {
      ...setup,
      vehicles: setup.vehicles.length
        ? setup.vehicles
        : [createVehicle(setup.vehicleNumber || "Fahrzeug 1", setup.vehicleNumber || "")],
      defaultVehicleId: setup.defaultVehicleId || setup.vehicles[0]?.id || "",
      drivers: [],
    };
    
    saveSetup(normalizedSetup, user.companyId);
    navigate("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10 sm:py-14">
      <header className="mb-10 flex flex-col items-center">
        <RoofSign litSegments={litSegments} />
      </header>

      <section className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-700 uppercase tracking-wide text-cream">
          Unternehmen einrichten
        </h1>
        <p className="mb-8 text-sm text-muted">
          Erfassen Sie Ihr Unternehmen und Fahrzeuge. Fahrer werden später im Dashboard hinzugefügt.
        </p>

        <form
          className="flex flex-col gap-7 rounded-lg border border-line bg-panel p-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleContinue();
          }}
        >
          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted uppercase tracking-signage">
              Unternehmen *
            </label>
            <input
              id="companyName"
              type="text"
              required
              value={setup.companyName}
              onChange={(e) => update("companyName")(e.target.value)}
              placeholder="z. B. Stadttaxi München eG"
              autoComplete="organization"
              className="w-full rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-muted uppercase tracking-signage">
              Fahrzeug-Nr. (optional)
            </label>
            <input
              id="vehicleNumber"
              type="text"
              value={setup.vehicleNumber}
              onChange={(e) => update("vehicleNumber")(e.target.value)}
              placeholder="z. B. M-TX 1234"
              className="w-full rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
            />
          </div>

          <div className="rounded-md border border-line p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-700 uppercase tracking-wide text-cream">Fahrzeuge</h2>
              <button type="button" onClick={addVehicle} className="rounded-md border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-signage text-cream hover:border-amber transition">
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
                  <button type="button" onClick={() => removeVehicle(vehicle.id)} className="rounded-md border border-alert px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-signage text-alert hover:bg-alert/10 transition">
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

          <button
            type="submit"
            disabled={!complete}
            className="mt-1 w-full rounded-md bg-amber py-3.5 font-display text-lg font-700 uppercase tracking-signage text-asphalt transition-opacity disabled:cursor-not-allowed disabled:bg-line disabled:text-muted hover:bg-amber/90 transition"
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
