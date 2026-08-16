import React, { useMemo, useState } from 'react';
import type { DriverAvailabilityStatus, User } from '../../types';
import { db } from '../../lib/db';
import { getDriverDashboardState } from '../../lib/driverStatus';
import { computeWorkMinutes, formatDateTime, formatDurationMinutes, toDateKey } from '../../lib/format';
import { isVehicleAssignedToUser } from '../../types';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Field';
import { TripIcon, UsersIcon } from '../ui/Icons';
import { TripForm } from '../trips/TripForm';

const statusOptions: Array<{ value: DriverAvailabilityStatus; label: string }> = [
  { value: 'available', label: 'Wartet / verfügbar' },
  { value: 'break', label: 'In Pause' },
  { value: 'sick', label: 'Krank' },
  { value: 'leave', label: 'Urlaub' },
  { value: 'holiday', label: 'Feiertag / frei' },
];

export function DriverStatusBoard({ companyId }: { companyId: string }) {
  const [, forceRefresh] = useState(0);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [quickTripDriverId, setQuickTripDriverId] = useState<string | null>(null);
  const todayKey = toDateKey();
  const orderedDrivers = db.users
    .byCompany(companyId)
    .filter((user) => user.role === 'driver')
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const selectedDriver = selectedDriverId ? db.users.getForCompany(companyId, selectedDriverId) : undefined;
  const selectedDailyTrips = useMemo(
    () => (selectedDriver ? db.trips.byDriver(companyId, selectedDriver.id).filter((trip) => toDateKey(new Date(trip.scheduledAt)) === todayKey) : []),
    [companyId, selectedDriver, todayKey],
  );
  const selectedDailyLog = selectedDriver ? db.dailyLogs.byDriverAndDate(companyId, selectedDriver.id, todayKey) : undefined;
  const selectedVehicles = selectedDriver
    ? db.vehicles.byCompany(companyId).filter((vehicle) => isVehicleAssignedToUser(vehicle, selectedDriver))
    : [];
  const workedMinutes = selectedDailyLog
    ? computeWorkMinutes(selectedDailyLog.workStart, selectedDailyLog.workEnd, selectedDailyLog.breakMinutes ?? 0)
    : 0;

  if (orderedDrivers.length === 0) return null;

  const updateStatus = (driver: User, status: DriverAvailabilityStatus) => {
    db.users.updateForCompany(companyId, driver.id, { availabilityStatus: status });
    forceRefresh((value) => value + 1);
  };

  return (
    <>
      <Card className="border-ink/10 bg-cream-100/80">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60">
              <UsersIcon width={18} height={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-ink">Fahrer heute</h2>
              <p className="text-xs text-ink/45">Karte öffnen für Tagesdetails</p>
            </div>
          </div>
          <div className="text-right text-xs font-bold text-ink/45">{orderedDrivers.length} Fahrer</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {orderedDrivers.map((driver) => {
            const status = getDriverDashboardState(driver, db.trips.byDriver(companyId, driver.id));
            const presentation = {
              working: { card: 'border-danger/35 bg-danger/5', avatar: 'bg-danger text-white', badge: 'bg-danger text-white' },
              available: { card: 'border-success/30 bg-success/5', avatar: 'bg-success text-white', badge: 'bg-success text-white' },
              unavailable: { card: 'border-asphalt-950/30 bg-asphalt-950 text-cream-100', avatar: 'bg-cream-100/15 text-cream-100', badge: 'bg-cream-100/15 text-cream-100' },
            }[status.kind];
            return (
              <div key={driver.id} className={`rounded-2xl border p-3 ${presentation.card}`}>
                <button
                  type="button"
                  onClick={() => setSelectedDriverId(driver.id)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                  aria-label={`Tagesdetails von ${driver.name} öffnen`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${presentation.avatar}`}>
                      {driver.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold">{driver.name}</p>
                      <p className={`truncate text-xs ${status.kind === 'unavailable' ? 'text-cream-100/55' : 'text-ink/50'}`}>
                        {status.detail}
                      </p>
                    </div>
                  </div>
                  {status.kind === 'working' && <TripIcon width={18} height={18} className="shrink-0 text-danger" />}
                </button>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-1 text-[0.68rem] font-extrabold ${presentation.badge}`}>{status.label}</span>
                  <Select
                    value={driver.availabilityStatus ?? 'available'}
                    onChange={(event) => updateStatus(driver, event.target.value as DriverAvailabilityStatus)}
                    className={`min-w-0 flex-1 text-xs ${status.kind === 'unavailable' ? 'border-cream-100/20 bg-cream-100/10 text-cream-100' : ''}`}
                    aria-label={`Status von ${driver.name}`}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickTripDriverId(driver.id)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-extrabold text-asphalt-950 transition hover:bg-amber-500"
                >
                  <TripIcon width={14} height={14} />
                  Neue Fahrt für diesen Fahrer
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal
        open={Boolean(selectedDriver)}
        onClose={() => setSelectedDriverId(null)}
        title={selectedDriver ? `Heute — ${selectedDriver.name}` : 'Fahrerdetails'}
      >
        {selectedDriver && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-ink/5 px-3 py-2.5 text-sm text-ink/70">
              <p className="font-extrabold text-ink">Tagesübersicht für {new Date().toLocaleDateString('de-DE')}</p>
              <p className="mt-1 text-xs text-ink/55">Diese Ansicht zeigt ausschließlich den heutigen Arbeitstag.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-cream-100 px-3 py-2">
                <p className="text-[0.68rem] font-bold uppercase tracking-wide text-ink/45">Fahrten heute</p>
                <p className="mt-1 font-meter text-xl font-bold text-ink">{selectedDailyTrips.length}</p>
              </div>
              <div className="rounded-xl bg-cream-100 px-3 py-2">
                <p className="text-[0.68rem] font-bold uppercase tracking-wide text-ink/45">Arbeitszeit</p>
                <p className="mt-1 font-meter text-xl font-bold text-ink">{workedMinutes > 0 ? formatDurationMinutes(workedMinutes) : '—'}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-ink">Fahrzeug</h3>
              {selectedVehicles.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-ink/60">Kein Fahrzeug zugewiesen.</p>
              ) : (
                <div className="space-y-2">
                  {selectedVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="rounded-xl border border-cream-400 bg-cream-100 px-3 py-2">
                      <p className="font-bold text-ink">{vehicle.plate} · {vehicle.model}</p>
                      <p className="text-xs text-ink/50">{vehicle.status === 'active' ? 'Einsatzbereit' : 'Nicht verfügbar'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-ink">Tagesabschluss</h3>
              {selectedDailyLog ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-cream-100 px-3 py-2"><span className="block text-xs text-ink/45">KM-Start</span><strong>{selectedDailyLog.odometerStart ?? '—'}</strong></div>
                  <div className="rounded-xl bg-cream-100 px-3 py-2"><span className="block text-xs text-ink/45">KM-Ende</span><strong>{selectedDailyLog.odometerEnd ?? '—'}</strong></div>
                  <div className="rounded-xl bg-cream-100 px-3 py-2"><span className="block text-xs text-ink/45">Arbeitsbeginn</span><strong>{selectedDailyLog.workStart ?? '—'}</strong></div>
                  <div className="rounded-xl bg-cream-100 px-3 py-2"><span className="block text-xs text-ink/45">Arbeitsende</span><strong>{selectedDailyLog.workEnd ?? '—'}</strong></div>
                </div>
              ) : (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-ink/60">Der Fahrer hat den Tagesabschluss noch nicht eingetragen.</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-extrabold text-ink">Fahrten heute</h3>
              {selectedDailyTrips.length === 0 ? (
                <p className="rounded-xl bg-cream-100 px-3 py-2 text-sm text-ink/60">Keine Fahrten für heute.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDailyTrips.map((trip) => (
                    <div key={trip.id} className="rounded-xl border border-cream-400 bg-cream-100 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-ink">{trip.customerName}</p>
                        <span className="font-meter text-xs font-bold text-ink/55">{formatDateTime(trip.scheduledAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink/55">{trip.pickupAddress} → {trip.destinationAddress}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(quickTripDriverId)}
        onClose={() => setQuickTripDriverId(null)}
        title={quickTripDriverId ? `Neue Fahrt — ${db.users.getForCompany(companyId, quickTripDriverId)?.name ?? 'Fahrer'}` : 'Neue Fahrt'}
      >
        {quickTripDriverId && (
          <TripForm
            defaultDriverId={quickTripDriverId}
            onSaved={() => {
              setQuickTripDriverId(null);
              forceRefresh((value) => value + 1);
            }}
            onCancel={() => setQuickTripDriverId(null)}
          />
        )}
      </Modal>
    </>
  );
}
