import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import RoofSign from "../components/RoofSign";
import FormField from "../components/FormField";
import BrandFooter from "../components/BrandFooter";
import { getActiveUser, updateUserProfile, type UserAccount } from "../lib/auth-storage";
import { TaxiSetup, emptySetup, loadSetup, saveSetup, isSetupComplete } from "../lib/setup-storage";

export default function SetupPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<TaxiSetup>(emptySetup);
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setActiveUser(user);
    setSetup(loadSetup(user.id));
    setHydrated(true);
  }, [navigate]);

  const update = (field: keyof TaxiSetup) => (value: string) =>
    setSetup((prev) => ({ ...prev, [field]: value }));

  const litSegments = [setup.companyName, setup.vehicleNumber, setup.driverName]
    .filter((value) => value.trim().length > 0).length;
  const complete = isSetupComplete(setup);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!activeUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (!complete) {
      setError("Bitte füllen Sie alle Felder aus, bevor Sie fortfahren.");
      return;
    }

    const profile = {
      companyName: setup.companyName.trim(),
      vehicleNumber: setup.vehicleNumber.trim(),
      driverName: setup.driverName.trim(),
    };

    updateUserProfile(activeUser.id, profile);
    saveSetup(profile, activeUser.id);
    navigate("/dashboard", { replace: true });
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-sm text-muted">Lade Profil …</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10 sm:py-14">
      <header className="mb-10 flex flex-col items-center">
        <RoofSign litSegments={litSegments} />
      </header>

      <section className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-700 uppercase tracking-wide text-cream">
          Profil & Unternehmen
        </h1>
        <p className="mb-8 text-sm text-muted">
          Diese Angaben werden für Ihren geschützten Account gespeichert und sind für andere Konten nicht sichtbar.
        </p>

        <form className="flex flex-col gap-7 rounded-lg border border-line bg-panel p-5" onSubmit={handleSubmit}>
          <FormField
            id="companyName"
            label="Unternehmen"
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

          {error && <p className="rounded-md border border-alert/50 bg-asphalt px-3 py-2 text-sm text-alert">{error}</p>}

          <button
            type="submit"
            disabled={!complete}
            className="mt-1 w-full rounded-md bg-amber py-3.5 font-display text-lg font-700 uppercase tracking-signage text-asphalt transition-opacity disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
          >
            Speichern & weiter
          </button>
        </form>
      </section>

      <BrandFooter />
    </main>
  );
}
