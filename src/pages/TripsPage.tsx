import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { TopBar } from '../components/layout/TopBar';
import { TripCard } from '../components/trips/TripCard';
import { AssignDriverModal } from '../components/trips/AssignDriverModal';
import { EmptyState } from '../components/ui/Card';
import { Input } from '../components/ui/Field';
import { useTripActions } from '../hooks/useTripActions';
import { SearchIcon } from '../components/ui/Icons';
import type { Trip, TripStatus } from '../types';
import { TRIP_STATUS_LABEL } from '../lib/labels';
import { toDateKey } from '../lib/format';

type FilterKey = 'all' | TripStatus | 'unassigned';

export default function TripsPage() {
  const { user, company } = useAuth();
  const navigate = useNavigate();
  const [refreshTick, setRefreshTick] = useState(0);
  const [actionError, setActionError] = useState('');
  const forceRefresh = () => setRefreshTick((n) => n + 1);
  const { advance, cancel } = useTripActions({ actor: user, company, onChange: forceRefresh, onError: setActionError });

  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [assigningTrip, setAssigningTrip] = useState<Trip | null>(null);

  const allCompanyTrips = company ? db.trips.byCompany(company.id) : [];
  const todayKey = toDateKey();
  const unassignedCount = allCompanyTrips.filter((t) => !t.driverId && t.status !== 'cancelled').length;

  const filters: Array<{ key: FilterKey; label: string; badge?: number }> = useMemo(() => {
    const base: Array<{ key: FilterKey; label: string; badge?: number }> = [{ key: 'all', label: 'Alle' }];
    if (user?.role === 'admin' && unassignedCount > 0) {
      base.push({ key: 'unassigned', label: 'Nicht zugewiesen', badge: unassignedCount });
    }
    base.push(
      { key: 'scheduled', label: TRIP_STATUS_LABEL.scheduled },
      { key: 'ongoing', label: TRIP_STATUS_LABEL.ongoing },
      { key: 'completed', label: TRIP_STATUS_LABEL.completed },
      { key: 'cancelled', label: TRIP_STATUS_LABEL.cancelled },
    );
    return base;
  }, [user, unassignedCount]);

  const trips = !company || !user
    ? []
    : (user.role === 'admin'
      ? allCompanyTrips
      : allCompanyTrips.filter((t) => t.driverId === user.id && toDateKey(new Date(t.scheduledAt)) === todayKey))
        .filter((t) => {
          if (filter === 'all') return true;
          if (filter === 'unassigned') return !t.driverId && t.status !== 'cancelled';
          return t.status === filter;
        })
        .filter((t) => {
          if (!query.trim()) return true;
          const q = query.trim().toLowerCase();
          return (
            t.customerName.toLowerCase().includes(q) ||
            t.pickupAddress.toLowerCase().includes(q) ||
            t.destinationAddress.toLowerCase().includes(q) ||
            (t.customerPhone ?? '').includes(q)
          );
        });

  return (
    <div>
      <TopBar title={user?.role === 'driver' ? 'Meine Fahrten heute' : 'Fahrten'} subtitle={`${trips.length} ${user?.role === 'driver' ? 'Fahrten heute' : 'Buchungen'}`} />

      <div className="space-y-4 px-4 pt-4">
        {actionError && <div className="flex items-center justify-between gap-3 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger"><span>{actionError}</span><button type="button" onClick={() => setActionError('')} className="font-extrabold underline">Schließen</button></div>}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche nach Kunde, Adresse oder Telefon"
        />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-pill border px-4 py-2 text-sm font-bold transition ${
                filter === f.key
                  ? 'border-asphalt-900 bg-asphalt-900 text-cream-100'
                  : 'border-cream-400 bg-cream-100 text-ink/60'
              }`}
            >
              {f.label}
              {!!f.badge && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[0.65rem] font-extrabold text-asphalt-950">
                  {f.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {trips.length === 0 ? (
          <EmptyState
            icon={<SearchIcon width={32} height={32} />}
            title="Keine Ergebnisse"
            description="Filter oder Suchbegriff anpassen und erneut versuchen"
          />
        ) : (
          <div className="space-y-3 pb-4">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                driver={trip.driverId && company ? db.users.getForCompany(company.id, trip.driverId) : undefined}
                vehicle={trip.vehicleId && company ? db.vehicles.getForCompany(company.id, trip.vehicleId) : undefined}
                showDriver={user?.role === 'admin'}
                onAdvance={advance}
                onCancel={cancel}
                onEdit={(t) => navigate(`/trips/${t.id}/edit`)}
                onAssign={user?.role === 'admin' ? setAssigningTrip : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <AssignDriverModal
        trip={assigningTrip}
        onClose={() => setAssigningTrip(null)}
        onAssigned={() => {
          setAssigningTrip(null);
          forceRefresh();
        }}
      />
    </div>
  );
}
