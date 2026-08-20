import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { TopBar } from '../components/layout/TopBar';
import { TripCard } from '../components/trips/TripCard';
import { AssignDriverModal } from '../components/trips/AssignDriverModal';
import { EmptyState } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Field';
import { useTripActions } from '../hooks/useTripActions';
import { SearchIcon } from '../components/ui/Icons';
import type { Trip, TripStatus } from '../types';
import { TRIP_STATUS_LABEL } from '../lib/labels';
import { startOfWeek, toDateKey, tomorrowDateKey } from '../lib/format';
import { hydrateCompanyCache } from '../lib/cloudSync';

type FilterKey = 'all' | TripStatus | 'unassigned';
type ArchivePeriod = 'all' | 'upcoming' | 'today' | 'tomorrow' | 'week' | 'month';

export default function TripsPage() {
  const { user, company } = useAuth();
  const { cloudRefreshTick } = useOutletContext<{ cloudRefreshTick: number }>();
  const navigate = useNavigate();
  const [refreshTick, setRefreshTick] = useState(0);
  const [actionError, setActionError] = useState('');
  const forceRefresh = () => setRefreshTick((n) => n + 1);
  const { advance, cancel } = useTripActions({ actor: user, company, onChange: forceRefresh, onError: setActionError });

  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [assigningTrip, setAssigningTrip] = useState<Trip | null>(null);
  const [archivePeriod, setArchivePeriod] = useState<ArchivePeriod>('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!company?.id || !user?.id || user.role !== 'admin') return;
    let active = true;
    setHistoryLoading(true);
    void hydrateCompanyCache(company.id, { userRole: 'admin', userId: user.id, includeHistory: true })
      .catch((error) => console.warn('[TaxiSchild] Trip archive history hydration failed', error))
      .finally(() => {
        if (active) {
          setHistoryLoading(false);
          forceRefresh();
        }
      });
    return () => {
      active = false;
    };
  }, [company?.id, user?.id, user?.role]);

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
          if (user.role !== 'admin') return true;
          const tripDate = toDateKey(new Date(t.scheduledAt));
          if (archivePeriod === 'today' && tripDate !== todayKey) return false;
          if (archivePeriod === 'tomorrow' && tripDate !== tomorrowDateKey()) return false;
          if (archivePeriod === 'week') {
            const weekStart = startOfWeek().getTime();
            const weekEnd = new Date(startOfWeek()).setDate(startOfWeek().getDate() + 7);
            const scheduled = new Date(t.scheduledAt).getTime();
            if (scheduled < weekStart || scheduled >= weekEnd) return false;
          }
          if (archivePeriod === 'upcoming' && new Date(t.scheduledAt).getTime() < new Date(`${todayKey}T00:00:00`).getTime()) return false;
          if (archivePeriod === 'month') {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
            const scheduled = new Date(t.scheduledAt).getTime();
            if (scheduled < monthStart || scheduled >= monthEnd) return false;
          }
          if (fromDate && tripDate < fromDate) return false;
          if (toDate && tripDate > toDate) return false;
          if (driverFilter === 'unassigned' && t.driverId) return false;
          if (driverFilter !== 'all' && driverFilter !== 'unassigned' && t.driverId !== driverFilter) return false;
          return true;
        })
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
    <div data-cloud-refresh={cloudRefreshTick}>
      <TopBar
        title={user?.role === 'driver' ? 'Meine Fahrten heute' : 'Fahrtenarchiv'}
        subtitle={user?.role === 'driver' ? `${trips.length} Fahrten heute` : `${trips.length} von ${allCompanyTrips.length} Buchungen`}
      />

      <div className="space-y-4 px-4 pt-4">
        {actionError && <div className="flex items-center justify-between gap-3 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger"><span>{actionError}</span><button type="button" onClick={() => setActionError('')} className="font-extrabold underline">Schließen</button></div>}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche nach Kunde, Adresse oder Telefon"
        />

        {user?.role === 'admin' && (
          <div className="rounded-card border border-cream-400/70 bg-cream-100 p-3 shadow-card">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-ink">Alle Buchungen verwalten</p>
                <p className="mt-0.5 text-xs text-ink/50">Vergangene und zukünftige Fahrten durchsuchen, bearbeiten, zuweisen oder stornieren.</p>
              </div>
              {historyLoading && <span className="shrink-0 text-xs font-bold text-amber-700">Archiv wird geladen…</span>}
            </div>
            <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
              {([
                ['today', 'Heute'],
                ['tomorrow', 'Morgen'],
                ['week', 'Diese Woche'],
                ['upcoming', 'Kommende'],
                ['all', 'Alle Buchungen'],
              ] as Array<[ArchivePeriod, string]>).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setArchivePeriod(value)}
                  className={`shrink-0 rounded-pill border px-3 py-1.5 text-xs font-extrabold transition ${archivePeriod === value ? 'border-asphalt-900 bg-asphalt-900 text-cream-100' : 'border-cream-400 bg-white text-ink/60 hover:bg-cream-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <Select value={archivePeriod} onChange={(e) => setArchivePeriod(e.target.value as ArchivePeriod)} aria-label="Zeitraum filtern">
                <option value="all">Alle Zeiträume</option>
                <option value="upcoming">Kommende Fahrten</option>
                <option value="today">Heute</option>
                <option value="tomorrow">Morgen</option>
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
              </Select>
              <Select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} aria-label="Fahrer filtern">
                <option value="all">Alle Fahrer</option>
                <option value="unassigned">Nur nicht zugewiesen</option>
                {company && db.users.byCompany(company.id).filter((member) => member.role === 'driver').map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </Select>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="Von Datum" />
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="Bis Datum" />
              {(archivePeriod !== 'all' || driverFilter !== 'all' || fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setArchivePeriod('all');
                    setDriverFilter('all');
                    setFromDate('');
                    setToDate('');
                  }}
                  className="rounded-xl border border-cream-400 bg-white/70 px-4 py-3 text-sm font-bold text-ink/65 transition hover:bg-cream-200"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </div>
        )}

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
