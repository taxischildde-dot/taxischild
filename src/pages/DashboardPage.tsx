import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandFooter from "../components/BrandFooter";
import { getActiveUser, signOut, type UserAccount } from "../lib/auth-storage";
import { TaxiSetup, emptySetup, loadSetup } from "../lib/setup-storage";
import { loadTrips, todayKey } from "../lib/trips-storage";
import { loadReports } from "../lib/reports-storage";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<TaxiSetup>(emptySetup);
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = getActiveUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    setActiveUser(user);
    setSetup(loadSetup(user.companyId));
    setChecked(true);
  }, [navigate]);

  const todaysTrips = useMemo(() => loadTrips().filter((trip) => trip.date === todayKey()), []);
  const reportsCount = useMemo(() => loadReports().length, []);
  const vehicleCount = setup.vehicles.length;
  const driverCount = setup.drivers.length;
  const activeTrips = todaysTrips.filter((trip) => trip.status === "aktiv").length;

  if (!checked) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-sm text-muted">Lade Fahrzeugdaten …</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8 sm:py-10">
      <header className="mb-8 flex items-start justify-between gap-4 border-b border-line pb-5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-signage text-muted">White-Label-Betreiber</p>
          <h1 className="truncate font-display text-2xl font-700 uppercase tracking-wide text-cream">
            {setup.companyName || activeUser?.companyName || "TaxiSchild"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-cream">
              {vehicleCount} Fahrzeuge
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-cream">
              {driverCount} Fahrer
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-cream">
              {setup.inviteCode || activeUser?.inviteCode || "—"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Link
            to="/setup"
            className="rounded-md border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-signage text-muted transition-colors hover:border-amber hover:text-amber"
          >
            Einstellungen
          </Link>
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate("/login", { replace: true });
            }}
            className="rounded-md border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-signage text-muted transition-colors hover:border-alert hover:text-alert"
          >
            Abmelden
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <Link
          to="/trips"
          className="flex items-center justify-between rounded-lg border border-amber bg-panel px-4 py-4"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Heute</p>
            <span className="font-display text-lg font-700 uppercase tracking-wide text-cream">
              Fahrtenliste öffnen
            </span>
          </div>
          <span className="font-display text-2xl text-amber" aria-hidden="true">
            →
          </span>
        </Link>

        <Link
          to="/reports"
          className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-4 transition-colors hover:border-amber"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Reports & Export</p>
            <span className="font-display text-lg font-700 uppercase tracking-wide text-cream">
              Fahrbericht & Stundenzettel
            </span>
          </div>
          <span className="font-display text-2xl text-muted" aria-hidden="true">
            →
          </span>
        </Link>

        <div className="rounded-lg border border-line bg-panel px-4 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Heute</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-body text-sm text-cream">Fahrten</span>
            <span className="font-mono text-sm text-amber">{todaysTrips.length}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-body text-sm text-cream">Aktive Fahrten</span>
            <span className="font-mono text-sm text-amber">{activeTrips}</span>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel px-4 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Berichte</p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-body text-sm text-cream">Gespeicherte Tage</span>
            <span className="font-mono text-sm text-amber">{reportsCount}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-body text-sm text-cream">Fahrzeugflotte</span>
            <span className="font-mono text-sm text-amber">{vehicleCount} / {driverCount}</span>
          </div>
        </div>

        <Link
          to="/support"
          className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-4 transition-colors hover:border-amber"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Hilfe</p>
            <span className="font-display text-lg font-700 uppercase tracking-wide text-cream">
              Support & Feedback
            </span>
          </div>
          <span className="font-display text-2xl text-muted" aria-hidden="true">
            →
          </span>
        </Link>
      </section>

      <p className="mt-8 text-center text-xs text-muted">
        Ihr Datenraum ist isoliert. Andere Konten sehen Ihre Fahrten und Berichte nicht.
      </p>

      <BrandFooter />
    </main>
  );
}
