import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { hydrateCompanyCache } from '../lib/cloudSync';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { TopBar } from '../components/layout/TopBar';
import { StatCard } from '../components/dashboard/StatCard';
import { DailyLogCard } from '../components/dashboard/DailyLogCard';
import { DriverStatusBoard } from '../components/dashboard/DriverStatusBoard';
import { TripCard } from '../components/trips/TripCard';
import { AssignDriverModal } from '../components/trips/AssignDriverModal';
import { Card, EmptyState } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTripActions } from '../hooks/useTripActions';
import { formatMoney, startOfDay, startOfMonth, tomorrowDateKey, toDateKey } from '../lib/format';
import { maybeNotifyNewDriverTrips, maybeNotifyTomorrow } from '../lib/reminders';
import { TripIcon, PlusIcon } from '../components/ui/Icons';
import { isVehicleAssignedToUser } from '../types';
import type { Trip } from '../types';

export default function DashboardPage() {
  const { user, company } = useAuth();
  const navigate = useNavigate();
  const [, setRefreshTick] = useState(0);
  const [actionError, setActionError] = useState('');
  const forceRefresh = () => setRefreshTick((n) => n + 1);
  const { advance, cancel } = useTripActions({ actor: user, company, onChange: forceRefresh, onError: setActionError });
  const [assigningTrip, setAssigningTrip] = useState<Trip | null>(null);

  const trips = !company || !user ? [] : user.role === 'admin'
    ? db.trips.byCompany(company.id)
    : db.trips.byDriver(company.id, user.id);

  const companyId = company?.id;
  const userId = user?.id;
  const userRole = user?.role;
  const vehicles = companyId ? db.vehicles.byCompany(companyId) : [];
  const drivers = companyId ? db.users.byCompany(companyId).filter((u) => u.role === 'driver') : [];

  useEffect(() => {
    if (!companyId || !userId || !isSupabaseConfigured || userRole !== 'driver') return;
    const refreshTrips = () => {
      void hydrateCompanyCache(companyId, { userRole: 'driver', userId })
        .catch((error) => console.warn('[TaxiSchild] Dashboard trip refresh skipped', error))
        .finally(() => forceRefresh());
    };
    const channel = supabase
      .channel(`driver-trips-${companyId}-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `company_id=eq.${companyId}` }, refreshTrips)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, userId, userRole]);

  useEffect(() => {
    if (!user) return;
    maybeNotifyTomorrow(trips, user.role === 'admin' ? 'gesamtes Unternehmen' : 'Ihre Fahrten');
    if (user.role === 'driver') maybeNotifyNewDriverTrips(trips, user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips.length, user?.id]);

  const today = startOfDay();
  const todayKey = toDateKey(today);
  const monthStart = startOfMonth();
  const tomorrowKey = tomorrowDateKey();

  const completedTrips = trips.filter((t) => t.status === 'completed');
  const todayTrips = trips.filter((t) => toDateKey(new Date(t.scheduledAt)) === todayKey);
  const todayCompleted = completedTrips.filter((t) => toDateKey(new Date(t.scheduledAt)) === todayKey);
  const monthCompleted = completedTrips.filter((t) => new Date(t.scheduledAt) >= monthStart);
  const tomorrowTrips = trips.filter(
    (t) => toDateKey(new Date(t.scheduledAt)) === tomorrowKey && t.status === 'scheduled',
  );
  const unassignedTrips = trips.filter((t) => !t.driverId && t.status !== 'cancelled');

  const todayRevenue = todayCompleted.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const monthRevenue = monthCompleted.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
  const driverVehicles = user?.role === 'driver' ? vehicles.filter((vehicle) => isVehicleAssignedToUser(vehicle, user)) : [];

  const activeTrips = trips.filter((t) => t.status === 'scheduled' || t.status === 'ongoing').slice(0, 6);

  return (
    <div>
      <TopBar
        title={`Hallo, ${user?.name?.split(' ')[0] ?? ''}`}
        subtitle={user?.role === 'admin' ? 'Überblick über Ihr Unternehmen heute' : 'Ihre heutigen Fahrten'}
      />

      <div className="space-y-5 px-4 pt-4">
        {actionError && <div className="flex items-center justify-between gap-3 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger"><span>{actionError}</span><button type="button" onClick={() => setActionError('')} className="font-extrabold underline">Schließen</button></div>}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Fahrten heute" value={String(todayTrips.length)} tone="dark" />
          <StatCard label="Umsatz heute (bekannt)" value={formatMoney(todayRevenue)} tone="amber" />
          {user?.role === 'admin' ? (
            <>
              <StatCard label="Umsatz Monat (bekannt)" value={formatMoney(monthRevenue)} />
              <StatCard
                label="Fahrzeuge aktiv"
                value={`${activeVehicles} / ${vehicles.length}`}
                hint={`${drivers.length} Fahrer`}
              />
            </>
          ) : (
            <>
              <StatCard label="Abgeschlossen heute" value={String(todayCompleted.length)} />
              <StatCard
                label="Mein Fahrzeug"
                value={String(user?.role === 'driver' ? vehicles.filter((vehicle) => isVehicleAssignedToUser(vehicle, user)).length : 0)}
              />
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

        {user?.role === 'driver' && (
          <>
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-extrabold text-ink">Mein Fahrzeug</h2>
                  <p className="mt-1 text-xs text-ink/50">Nur die Ihnen zugewiesenen Fahrzeuge</p>
                </div>
                <button onClick={() => navigate('/fleet')} className="text-sm font-bold text-amber-700 underline">Öffnen</button>
              </div>
              <div className="mt-3 space-y-2">
                {driverVehicles.length === 0 ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-ink/60">Noch kein Fahrzeug zugewiesen.</p>
                ) : (
                  driverVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="rounded-xl border border-cream-400 bg-cream-100 px-3 py-2">
                      <p className="font-bold text-ink">{vehicle.plate} · {vehicle.model}</p>
                      <p className="text-xs text-ink/50">{vehicle.status === 'active' ? 'Einsatzbereit' : 'Bitte Geschäftsführung kontaktieren'}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
            <DailyLogCard />
          </>
        )}
        {user?.role === 'admin' && company && <DriverStatusBoard companyId={company.id} />}

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
