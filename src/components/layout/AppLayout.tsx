import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { hydrateCompanyCache } from '../../lib/cloudSync';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { BottomNav } from './BottomNav';
import { PlusIcon, TripIcon } from '../ui/Icons';

const seenTripsKey = (driverId: string) => `taxischild_seen_driver_trips_${driverId}`;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [tripAlert, setTripAlert] = useState('');
  const companyId = company?.id;
  const userId = user?.id;
  const isDriver = user?.role === 'driver';

  const hideFab = location.pathname.startsWith('/trips/new') || location.pathname.includes('/edit');

  useEffect(() => {
    if (!companyId || !userId || !isDriver || !isSupabaseConfigured) return;

    const storageKey = seenTripsKey(userId);
    let active = true;
    let firstSync = true;

    const refreshDriverTrips = async () => {
      await hydrateCompanyCache(companyId);
      if (!active) return;
      const trips = db.trips.byDriver(companyId, userId).filter((trip) => trip.status !== 'cancelled');
      const seen = new Set<string>(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]') as string[]);
      const unseen = firstSync && seen.size === 0 ? [] : trips.filter((trip) => !seen.has(trip.id));

      if (unseen.length > 0) {
        setTripAlert(unseen.length === 1 ? 'Eine neue Fahrt wurde Ihnen zugewiesen.' : `${unseen.length} neue Fahrten wurden Ihnen zugewiesen.`);
        if ('Notification' in window && Notification.permission === 'granted') {
          const firstTrip = unseen[0];
          new Notification('TaxiSchild — Neue Fahrt', {
            body: unseen.length === 1
              ? `${firstTrip.customerName} um ${new Date(firstTrip.scheduledAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}.`
              : `${unseen.length} neue Fahrten stehen für Sie bereit.`,
            icon: '/icons/icon-192.png',
          });
        }
      }

      window.localStorage.setItem(storageKey, JSON.stringify([...new Set([...seen, ...trips.map((trip) => trip.id)])].slice(-200)));
      firstSync = false;
    };

    void refreshDriverTrips();
    const interval = window.setInterval(() => void refreshDriverTrips(), 30000);
    const channel = supabase
      .channel(`driver-alerts-${companyId}-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `company_id=eq.${companyId}` }, () => void refreshDriverTrips())
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [companyId, userId, isDriver]);

  return (
    <div className="min-h-screen bg-cream-200">
      {tripAlert && user?.role === 'driver' && (
        <div className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 shadow-xl">
          <div className="flex min-w-0 items-center gap-2">
            <TripIcon width={20} height={20} className="shrink-0 text-amber-800" />
            <p className="text-sm font-bold text-amber-900">{tripAlert}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTripAlert('');
              navigate('/trips');
            }}
            className="shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-xs font-extrabold text-asphalt-950"
          >
            Ansehen
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-[1440px] px-3 pb-28 sm:px-6 lg:px-8 lg:pb-10">
        <Outlet />
      </div>

      {!hideFab && (
        <button
          onClick={() => navigate('/trips/new')}
          className="fixed bottom-24 left-1/2 z-40 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-amber-400 text-asphalt-950 shadow-[0_8px_24px_rgba(226,149,42,0.55)] ring-4 ring-cream-200 transition active:scale-95 lg:bottom-8 lg:left-auto lg:right-8 lg:translate-x-0"
          aria-label={user?.role === 'driver' ? 'Direktfahrt erfassen' : 'Neue Fahrt'}
        >
          <PlusIcon width={30} height={30} strokeWidth={2.4} />
        </button>
      )}

      <BottomNav />
    </div>
  );
}
