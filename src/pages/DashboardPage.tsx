import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import BrandFooter from "../components/BrandFooter";
import { TaxiSetup, emptySetup, loadSetup, isSetupComplete } from "../lib/setup-storage";

const placeholderCards = [
  { label: "Aktuelle Fahrt", value: "Keine aktive Fahrt", eyebrow: "Status" },
  { label: "Fahrzeugstatus", value: "Bereit", eyebrow: "Fahrzeug" },
  { label: "Tagesumsatz", value: "0,00 €", eyebrow: "Heute" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState<TaxiSetup>(emptySetup);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loaded = loadSetup();
    if (!isSetupComplete(loaded)) {
      navigate("/", { replace: true });
      return;
    }
    setSetup(loaded);
    setChecked(true);
  }, [navigate]);

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
          <p className="font-mono text-[10px] uppercase tracking-signage text-muted">
            White-Label-Betreiber
          </p>
          <h1 className="truncate font-display text-2xl font-700 uppercase tracking-wide text-cream">
            {setup.companyName}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-cream">
              {setup.vehicleNumber}
            </span>
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-xs text-cream">
              {setup.driverName}
            </span>
          </div>
        </div>
        <Link
          to="/"
          className="shrink-0 rounded-md border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-signage text-muted transition-colors hover:border-amber hover:text-amber"
        >
          Einstellungen
        </Link>
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
            <p className="font-mono text-[10px] uppercase tracking-signage text-muted">
              Reports &amp; Export
            </p>
            <span className="font-display text-lg font-700 uppercase tracking-wide text-cream">
              Fahrbericht &amp; Stundenzettel
            </span>
          </div>
          <span className="font-display text-2xl text-muted" aria-hidden="true">
            →
          </span>
        </Link>

        {placeholderCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-line bg-panel px-4 py-3.5">
            <p className="font-mono text-[10px] uppercase tracking-signage text-muted">
              {card.eyebrow}
            </p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-body text-sm text-cream">{card.label}</span>
              <span className="font-mono text-sm text-amber">{card.value}</span>
            </div>
          </div>
        ))}

        <Link
          to="/support"
          className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-4 transition-colors hover:border-amber"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Hilfe</p>
            <span className="font-display text-lg font-700 uppercase tracking-wide text-cream">
              Support &amp; Feedback
            </span>
          </div>
          <span className="font-display text-2xl text-muted" aria-hidden="true">
            →
          </span>
        </Link>
      </section>

      <p className="mt-8 text-center text-xs text-muted">
        Dies ist das Grundlayout des Dashboards — weitere Module folgen.
      </p>

      <BrandFooter />
    </main>
  );
}
