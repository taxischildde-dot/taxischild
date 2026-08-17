import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { getAssignedVehicleSignatures, getChangedVehicleIds, vehicleAssignmentMessage } from '../../lib/vehicleAlerts';
import { hydrateCompanyCache } from '../../lib/cloudSync';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { BottomNav } from './BottomNav';
import { PlusIcon, TripIcon } from '../ui/Icons';
import { formatTime } from '../../lib/format';

const seenTripsKey = (driverId: string) => `taxischild_seen_driver_trips_${driverId}`;
const editedTripsKey = (driverId: string) => `taxischild_edited_driver_trips_${driverId}`;

function tripEditSignature(trip: { customerName: string; pickupAddress: string; destinationAddress: string; destinationCode?: string; scheduledAt: string; dueAt?: string; price?: number; paymentMethod: string }): string {
  return JSON.stringify([
    trip.customerName,
    trip.pickupAddress,
    trip.destinationAddress,
    trip.destinationCode ?? '',
    trip.scheduledAt,
    trip.dueAt ?? '',
    trip.price ?? null,
    trip.paymentMethod,
  ]);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [tripAlert, setTripAlert] = useState('');
  const [vehicleAlert, setVehicleAlert] = useState('');
  const [cloudRefreshTick, setCloudRefreshTick] = useState(0);
  const companyId = company?.id;
  const userId = user?.id;
  const userEmail = user?.email;
  const isDriver = user?.role === 'driver';

  const hideFab = location.pathname.startsWith('/trips/new') || location.pathname.includes('/edit');

  useEffect(() => {
    if (!companyId || !userId || !userEmail || !isDriver || !isSupabaseConfigured) return;

    const storageKey = seenTripsKey(userId);
    const vehicleStorageKey = `taxischild_seen_driver_vehicles_${userId}`;
    let active = true;
    let firstSync = true;

    const nativeAlertsDisabledUntil = Number(window.sessionStorage.getItem('taxischild_disable_native_alerts_until') ?? '0');
    const notifyDriver = (title: string, body: string, path: string) => {
      if (Date.now() < nativeAlertsDisabledUntil) return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      try {
        const notice = new Notification(title, { body, icon: '/icons/icon-192.png' });
        notice.onclick = () => {
          try {
            window.focus();
            notice.close();
            navigate(path);
          } catch (error) {
            console.warn('[TaxiSchild] Notification navigation fallback used', error);
            window.location.href = path;
          }
        };
      } catch (error) {
        console.warn('[TaxiSchild] Native notification was unavailable', error);
      }
    };

    const refreshDriverTrips = async () => {
      try {
        const hydration = await hydrateCompanyCache(companyId, { userRole: 'driver', userId });
        if (!hydration.ok) {
          console.warn('[TaxiSchild] Driver refresh postponed', hydration.error);
          return;
        }
      } catch (error) {
        console.warn('[TaxiSchild] Driver refresh postponed after a network error', error);
        return;
      }
      if (!active) return;
      const trips = db.trips.byDriver(companyId, userId).filter((trip) => trip.status !== 'cancelled');
      const seen = new Set<string>(readJson<string[]>(storageKey, []));
      const previousEdits = readJson<Record<string, string>>(editedTripsKey(userId), {});
      const unseen = firstSync && seen.size === 0 ? [] : trips.filter((trip) => !seen.has(trip.id));
      const changedTrips = firstSync
        ? []
        : trips.filter((trip) => previousEdits[trip.id] && previousEdits[trip.id] !== tripEditSignature(trip));

      if (unseen.length > 0) {
        setTripAlert(unseen.length === 1 ? 'Eine neue Fahrt wurde Ihnen zugewiesen.' : `${unseen.length} neue Fahrten wurden Ihnen zugewiesen.`);
        const firstTrip = unseen[0];
        notifyDriver(
          'TaxiSchild — Neue Fahrt',
          unseen.length === 1
            ? `${firstTrip.customerName} um ${formatTime(firstTrip.scheduledAt)}.`
            : `${unseen.length} neue Fahrten stehen für Sie bereit.`,
          '/trips',
        );
      } else if (changedTrips.length > 0) {
        const changedTrip = changedTrips[0];
        setTripAlert(changedTrips.length === 1 ? 'Eine Ihnen zugewiesene Fahrt wurde geändert.' : `${changedTrips.length} Ihnen zugewiesene Fahrten wurden geändert.`);
        notifyDriver(
          'TaxiSchild — Fahrt geändert',
          changedTrips.length === 1
            ? `${changedTrip.customerName} · Abholung ${formatTime(changedTrip.scheduledAt)}.`
            : `${changedTrips.length} Ihrer Fahrten wurden geändert.`,
          '/trips',
        );
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...new Set([...seen, ...trips.map((trip) => trip.id)])].slice(-200)));
        window.localStorage.setItem(
          editedTripsKey(userId),
          JSON.stringify(Object.fromEntries(trips.map((trip) => [trip.id, tripEditSignature(trip)]))),
        );
      } catch (error) {
        console.warn('[TaxiSchild] Driver trip seen-cache write skipped', error);
      }

      const assignedVehicles = db.vehicles.byCompany(companyId);
      const previousVehicleState = readJson<Record<string, string>>(vehicleStorageKey, {});
      const currentVehicleState = getAssignedVehicleSignatures(assignedVehicles, { id: userId, email: userEmail });
      const vehicleChanges = getChangedVehicleIds(previousVehicleState, currentVehicleState);
      if (!firstSync && vehicleChanges.length > 0) {
        const changedVehicle = assignedVehicles.find((vehicle) => vehicle.id === vehicleChanges[0]);
        if (changedVehicle) {
          setVehicleAlert(vehicleAssignmentMessage(changedVehicle));
          notifyDriver(
            'TaxiSchild — Fahrzeug aktualisiert',
            `${changedVehicle.plate} · ${changedVehicle.model} ist jetzt für Sie hinterlegt.`,
            '/fleet',
          );
        }
      }
      try {
        window.localStorage.setItem(vehicleStorageKey, JSON.stringify(currentVehicleState));
      } catch (error) {
        console.warn('[TaxiSchild] Driver vehicle seen-cache write skipped', error);
      }
      firstSync = false;
      setCloudRefreshTick((current) => current + 1);
    };

    void refreshDriverTrips();
    const interval = window.setInterval(() => void refreshDriverTrips(), 30000);
    const channel = supabase
      .channel(`driver-alerts-${companyId}-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `company_id=eq.${companyId}` }, () => void refreshDriverTrips())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles', filter: `company_id=eq.${companyId}` }, () => void refreshDriverTrips())
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [companyId, userId, userEmail, isDriver, navigate]);

  useEffect(() => {
    if (!companyId || !userId || user?.role !== 'admin' || !isSupabaseConfigured) return;
    let active = true;
    const refreshCompanyData = async () => {
      try {
        const hydration = await hydrateCompanyCache(companyId, { userRole: 'admin', userId });
        if (!hydration.ok) {
          console.warn('[TaxiSchild] Admin refresh postponed', hydration.error);
          return;
        }
        if (active) setCloudRefreshTick((current) => current + 1);
      } catch (error) {
        console.warn('[TaxiSchild] Admin refresh crashed', error);
      }
    };

    void refreshCompanyData();
    const interval = window.setInterval(() => void refreshCompanyData(), 30000);
    const channel = supabase
      .channel(`company-cache-${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: `company_id=eq.${companyId}` }, () => void refreshCompanyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles', filter: `company_id=eq.${companyId}` }, () => void refreshCompanyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `company_id=eq.${companyId}` }, () => void refreshCompanyData())
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [companyId, user?.role, userId]);

  return (
    <div className="min-h-screen bg-cream-200">
      {user?.role === 'driver' && (tripAlert || vehicleAlert) && (
        <div className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-xl flex-col gap-2">
          {tripAlert && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 shadow-xl">
              <div className="flex min-w-0 items-center gap-2">
                <TripIcon width={20} height={20} className="shrink-0 text-amber-800" />
                <p className="text-sm font-bold text-amber-900">{tripAlert}</p>
              </div>
              <button type="button" onClick={() => { setTripAlert(''); navigate('/trips'); }} className="shrink-0 rounded-xl bg-amber-400 px-3 py-2 text-xs font-extrabold text-asphalt-950">Fahrten</button>
            </div>
          )}
          {vehicleAlert && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-300 bg-sky-100 px-4 py-3 shadow-xl">
              <div className="flex min-w-0 items-center gap-2">
                <TripIcon width={20} height={20} className="shrink-0 text-sky-800" />
                <p className="text-sm font-bold text-sky-900">{vehicleAlert}</p>
              </div>
              <button type="button" onClick={() => { setVehicleAlert(''); navigate('/fleet'); }} className="shrink-0 rounded-xl bg-sky-300 px-3 py-2 text-xs font-extrabold text-sky-950">Fahrzeug</button>
            </div>
          )}
        </div>
      )}

      <div className="mx-auto w-full max-w-[1440px] px-3 pb-28 sm:px-6 lg:px-8 lg:pb-10">
        <Outlet context={{ cloudRefreshTick }} />
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
