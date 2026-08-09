import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TripForm from "../components/TripForm";
import TripCard from "../components/TripCard";
import BrandFooter from "../components/BrandFooter";
import { Trip, TripStatus, loadTrips, saveTrips, todayKey } from "../lib/trips-storage";
import { addNotification, createNotification, loadNotifications } from "../lib/notifications-storage";
import { getActiveUser } from "../lib/auth-storage";

type FilterTab = "alle" | TripStatus;

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "geplant", label: "Geplant" },
  { key: "aktiv", label: "Aktiv" },
  { key: "erledigt", label: "Erledigt" },
  { key: "storniert", label: "Storno" },
];

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("alle");
  const [activeUser, setActiveUser] = useState(getActiveUser());

  useEffect(() => {
    setActiveUser(getActiveUser());
    const savedTrips = loadTrips();
    setTrips(savedTrips);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveTrips(trips);
  }, [trips, hydrated]);

  const todaysTrips = useMemo(
    () =>
      trips
        .filter((t) => t.date === todayKey())
        .sort((a, b) => a.pickupTime.localeCompare(b.pickupTime)),
    [trips]
  );

  const visibleTrips = useMemo(
    () => (filter === "alle" ? todaysTrips : todaysTrips.filter((t) => t.status === filter)),
    [todaysTrips, filter]
  );

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = {
      alle: todaysTrips.length,
      geplant: 0,
      aktiv: 0,
      erledigt: 0,
      storniert: 0,
    };
    todaysTrips.forEach((t) => (c[t.status] += 1));
    return c;
  }, [todaysTrips]);

  const addTrip = (trip: Trip) => {
    const nextTrips = [...trips, trip];
    setTrips(nextTrips);
    setFormOpen(false);

    if (activeUser?.role === "owner" && trip.driverId) {
      const targetUserId = trip.driverId;
      addNotification(
        createNotification(
          targetUserId,
          "trip_added",
          "Neue Fahrt zugewiesen",
          `${trip.customerName} · ${trip.pickupTime} · ${trip.destination}`,
          trip.id
        )
      );
    }
  };

  const updateTrip = (updated: Trip) => {
    const nextTrips = trips.map((t) => (t.id === updated.id ? updated : t));
    setTrips(nextTrips);

    if (activeUser?.role === "owner" && updated.driverId) {
      const type = updated.status === "storniert" ? "trip_cancelled" : "trip_updated";
      addNotification(
        createNotification(
          updated.driverId,
          type,
          updated.status === "storniert" ? "Fahrt gestrichen" : "Fahrt aktualisiert",
          `${updated.customerName} · ${updated.pickupTime}`,
          updated.id
        )
      );
    }
  };

  const todayLabel = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-28 pt-8 sm:pt-10">
      <header className="mb-5 flex items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-signage text-muted">
            Fahrtenliste
          </p>
          <h1 className="font-display text-2xl font-700 uppercase tracking-wide text-cream">
            {todayLabel}
          </h1>
        </div>
        <Link
          to="/dashboard"
          className="flex h-10 shrink-0 items-center rounded-md border border-line px-3 font-mono text-xs uppercase tracking-signage text-muted transition-colors hover:border-amber hover:text-amber"
        >
          Dashboard
        </Link>
      </header>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 font-mono text-xs uppercase tracking-signage transition-colors ${
              filter === tab.key ? "border-amber bg-amber text-asphalt" : "border-line text-muted"
            }`}
          >
            {tab.label}
            <span className="opacity-70">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {formOpen && (
        <div className="mb-5">
          <TripForm onAdd={addTrip} onClose={() => setFormOpen(false)} />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visibleTrips.length === 0 && (
          <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center">
            <p className="font-mono text-sm text-muted">
              {todaysTrips.length === 0
                ? "Noch keine Fahrten für heute eingetragen."
                : "Keine Fahrten in dieser Kategorie."}
            </p>
          </div>
        )}
        {visibleTrips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onUpdate={updateTrip} />
        ))}
      </div>

      {!formOpen && (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          aria-label="Neue Fahrt eintragen"
          className="fixed bottom-6 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-amber text-3xl font-700 text-asphalt shadow-lamp"
        >
          +
        </button>
      )}

      <BrandFooter />
    </main>
  );
}
