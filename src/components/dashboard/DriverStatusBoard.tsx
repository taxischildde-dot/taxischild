import React, { useState } from 'react';
import type { DriverAvailabilityStatus, User } from '../../types';
import { db } from '../../lib/db';
import { getDriverDashboardState } from '../../lib/driverStatus';
import { Card } from '../ui/Card';
import { Select } from '../ui/Field';
import { TripIcon, UsersIcon } from '../ui/Icons';

const statusOptions: Array<{ value: DriverAvailabilityStatus; label: string }> = [
  { value: 'available', label: 'Wartet / verfügbar' },
  { value: 'break', label: 'In Pause' },
  { value: 'sick', label: 'Krank' },
  { value: 'leave', label: 'Urlaub' },
  { value: 'holiday', label: 'Feiertag / frei' },
];


export function DriverStatusBoard({ companyId }: { companyId: string }) {
  const [, forceRefresh] = useState(0);
  const orderedDrivers = db.users
    .byCompany(companyId)
    .filter((user) => user.role === 'driver')
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  if (orderedDrivers.length === 0) return null;

  const updateStatus = (driver: User, status: DriverAvailabilityStatus) => {
    db.users.updateForCompany(companyId, driver.id, { availabilityStatus: status });
    forceRefresh((value) => value + 1);
  };

  return (
    <Card className="border-ink/10 bg-cream-100/80">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60">
            <UsersIcon width={18} height={18} />
          </div>
          <div>
            <h2 className="font-display text-base font-extrabold text-ink">Fahrer heute</h2>
            <p className="text-xs text-ink/45">Live-Übersicht und Verfügbarkeit</p>
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
              <div className="flex items-start justify-between gap-3">
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
              </div>
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
            </div>
          );
        })}
      </div>
    </Card>
  );
}
