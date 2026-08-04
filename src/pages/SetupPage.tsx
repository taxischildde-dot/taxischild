import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoofSign from "../components/RoofSign";
import FormField from "../components/FormField";
import BrandFooter from "../components/BrandFooter";
import { TaxiSetup, emptySetup, loadSetup, saveSetup, isSetupComplete } from "../lib/setup-storage";

export default function SetupPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<TaxiSetup>(emptySetup);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSetup(loadSetup());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSetup(setup);
  }, [setup, hydrated]);

  const update = (field: keyof TaxiSetup) => (value: string) =>
    setSetup((prev) => ({ ...prev, [field]: value }));

  const litSegments = [setup.companyName, setup.vehicleNumber, setup.driverName].filter(
    (v) => v.trim().length > 0
  ).length;
  const complete = isSetupComplete(setup);

  const handleContinue = () => {
    if (!complete) return;
    saveSetup(setup);
    navigate("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10 sm:py-14">
      <header className="mb-10 flex flex-col items-center">
        <RoofSign litSegments={litSegments} />
      </header>

      <section className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-700 uppercase tracking-wide text-cream">
          Fahrzeug einrichten
        </h1>
        <p className="mb-8 text-sm text-muted">
          Diese Angaben personalisieren Ihr Dashboard. Alles wird nur auf diesem Gerät
          gespeichert.
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
          <FormField
            id="vehicleNumber"
            label="Fahrzeug-Nr."
            placeholder="z. B. M-TX 1234"
            value={setup.vehicleNumber}
            onChange={update("vehicleNumber")}
            mono
          />
          <FormField
            id="driverName"
            label="Fahrername"
            placeholder="Vor- und Nachname"
            value={setup.driverName}
            onChange={update("driverName")}
            autoComplete="name"
          />

          <div className="rounded-md border border-dashed border-line px-3 py-2.5">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-signage text-muted">
              Vorschau
            </p>
            <p className="truncate font-mono text-sm text-cream">
              {setup.companyName.trim() || "—"} · {setup.vehicleNumber.trim() || "—"} ·{" "}
              {setup.driverName.trim() || "—"}
            </p>
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
