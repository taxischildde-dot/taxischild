import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/dashboard/StatCard';
import { DailyLogCard } from '../components/dashboard/DailyLogCard';
import { TripCard } from '../components/trips/TripCard';
import { AssignDriverModal } from '../components/trips/AssignDriverModal';
import { EmptyState } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTripActions } from '../hooks/useTripActions';
import { formatMoney, startOfDay, startOfMonth, tomorrowDateKey, toDateKey } from '../lib/format';
import { maybeNotifyTomorrow } from '../lib/reminders';
import { TripIcon, PlusIcon } from '../components/ui/Icons';
import type { Trip } from '../types';

export default function DashboardPage() {
  const { user, company } = useAuth();
  const navigate = useNavigate();
  const [refreshTick, setRefreshTick] = useState(0);
  const forceRefresh = () => setRefreshTick((n) => n + 1);
  const { advance, cancel } = useTripActions({ actor: user, company, onChange: forceRefresh });
  const [assigningTrip, setAssigningTrip] = useState<Trip | null>(null);

  const trips = !company || !user ? [] : user.role === 'admin'
    ? db.trips.byCompany(company.id)
    : db.trips.byDriver(company.id, user.id);

  const vehicles = useMemo(() => (company ? db.vehicles.byCompany(company.id) : []), [company]);
  const drivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );

  useEffect(() => {
    if (!user) return;
    maybeNotifyTomorrow(trips, user.role === 'admin' ? 'gesamtes Unternehmen' : 'Ihre Fahrten');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips.length, user?.id]);

  const today = startOfDay();
  const monthStart = startOfMonth();
  const tomorrowKey = tomorrowDateKey();

  const completedTrips = trips.filter((t) => t.status === 'completed');
  const todayTrips = trips.filter((t) => new Date(t.scheduledAt) >= today);
  const todayCompleted = completedTrips.filter((t) => new Date(t.scheduledAt) >= today);
  const monthCompleted = completedTrips.filter((t) => new Date(t.scheduledAt) >= monthStart);
  const tomorrowTrips = trips.filter(
    (t) => toDateKey(new Date(t.scheduledAt)) === tomorrowKey && t.status === 'scheduled',
  );
  const unassignedTrips = trips.filter((t) => !t.driverId && t.status !== 'cancelled');

  const todayRevenue = todayCompleted.reduce((sum, t) => sum + t.price, 0);
  const monthRevenue = monthCompleted.reduce((sum, t) => sum + t.price, 0);
  const activeVehicles = vehicles.filter((v) => v.status === 'active').length;

  const activeTrips = trips.filter((t) => t.status === 'scheduled' || t.status === 'ongoing').slice(0, 6);

  return (
    <div>
      <TopBar
        title={`Hallo, ${user?.name?.split(' ')[0] ?? ''}`}
        subtitle={user?.role === 'admin' ? 'Überblick über Ihr Unternehmen heute' : 'Ihre heutigen Fahrten'}
      />

      <div className="space-y-5 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Fahrten heute" value={String(todayTrips.length)} tone="dark" />
          <StatCard label="Umsatz heute" value={formatMoney(todayRevenue)} tone="amber" />
          {user?.role === 'admin' ? (
            <>
              <StatCard label="Umsatz Monat" value={formatMoney(monthRevenue)} />
              <StatCard
                label="Fahrzeuge aktiv"
                value={`${activeVehicles} / ${vehicles.length}`}
                hint={`${drivers.length} Fahrer`}
              />
            </>
          ) : (
            <>
              <StatCard label="Umsatz Monat" value={formatMoney(monthRevenue)} />
              <StatCard label="Fahrten abgeschlossen" value={String(completedTrips.length)} />
            </>
          )}
        </div>

        {tomorrowTrips.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-card border border-amber-400/50 bg-amber-100/60 px-4 py-3">
            <p className="text-sm font-bold text-amber-800">
              {tomorrowTrips.length} Fahrt(en) für morgen geplant
            </p>
            <button onClick={() => navigate('/trips')} className="text-sm font-bold text-amber-700 underline">
              Ansehen
            </button>
          </div>
        )}

        {user?.role === 'admin' && unassignedTrips.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/5 px-4 py-3">
            <p className="text-sm font-bold text-danger">
              {unassignedTrips.length} Fahrt(en) ohne zugewiesenen Fahrer
            </p>
            <button onClick={() => setAssigningTrip(unassignedTrips[0])} className="text-sm font-bold text-danger underline">
              Jetzt zuweisen
            </button>
          </div>
        )}

        <Button fullWidth size="lg" icon={<PlusIcon width={20} height={20} />} onClick={() => navigate('/trips/new')}>
          Neue Fahrt
        </Button>

        {user?.role === 'driver' && <DailyLogCard />}

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="font-display text-base font-extrabold text-ink">Aktive Fahrten</h2>
            <button onClick={() => navigate('/trips')} className="text-sm font-bold text-amber-600">
              Alle anzeigen
            </button>
          </div>

          {activeTrips.length === 0 ? (
            <EmptyState
              icon={<TripIcon width={36} height={36} />}
              title="Aktuell keine aktiven Fahrten"
              description="Tippen Sie auf „Neue Fahrt“, um die erste Buchung anzulegen"
            />
          ) : (
            <div className="space-y-3">
              {activeTrips.map((trip) => (
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
