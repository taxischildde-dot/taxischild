import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getResponsibleDriverIds } from '../../types';
import { db } from '../../lib/db';
import { toDateKey, formatDateKey, formatMoney } from '../../lib/format';
import { exportFahrberichtPdf } from '../../lib/pdf';
import { Card } from '../ui/Card';
import { Field, Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { DownloadIcon } from '../ui/Icons';

export function FahrberichtCard() {
  const { user, company } = useAuth();
  const isAdmin = user?.role === 'admin';

  const drivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );

  const [driverId, setDriverId] = useState(isAdmin ? drivers[0]?.id ?? '' : user?.id ?? '');
  const [dateKey, setDateKey] = useState(toDateKey());

  if (!company || (isAdmin && drivers.length === 0)) return null;

  const driver = db.users.getForCompany(company.id, driverId);
  const trips = driver
    ? db.trips
        .byCompany(company.id)
        .filter((t) => t.driverId === driver.id && toDateKey(new Date(t.scheduledAt)) === dateKey)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    : [];
  const dailyLog = driver ? db.dailyLogs.byDriverAndDate(company.id, driver.id, dateKey) : undefined;
  const vehicle = dailyLog?.vehicleId
    ? db.vehicles.getForCompany(company.id, dailyLog.vehicleId)
    : db.vehicles
        .byCompany(company.id)
        .find((v) => (driver ? getResponsibleDriverIds(v).includes(driver.id) : false));
  const activeTrips = trips.filter((t) => t.status !== 'cancelled');
  const total = activeTrips.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const openPriceCount = activeTrips.filter((trip) => trip.price == null).length;

  const handleExport = () => {
    if (!driver) return;
    exportFahrberichtPdf({
      companyName: company.name,
      driver,
      vehicle,
      dateLabel: formatDateKey(dateKey),
      trips,
      odometerStart: dailyLog?.odometerStart,
      odometerEnd: dailyLog?.odometerEnd,
    });
  };

  return (
    <Card>
      <h3 className="mb-1 font-display text-sm font-extrabold text-ink">Fahrbericht (Tagesbericht)</h3>
      <p className="mb-3 text-xs text-ink/50">
        Tagesbericht je Fahrer mit Fahrtenliste, Kilometerständen sowie Feldern für Unterschrift und Stempel.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isAdmin && (
          <Field label="Fahrer">
            <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Datum">
          <Input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
          />
        </Field>
      </div>

      <p className="mt-3 text-sm text-ink/60">
        {trips.length} Fahrt(en) · Bekannte Summe {formatMoney(total)}
        {openPriceCount > 0 ? ` · ${openPriceCount} Preis(e) offen` : ''}
      </p>

      <Button
        fullWidth
        className="mt-3"
        icon={<DownloadIcon width={18} height={18} />}
        onClick={handleExport}
        disabled={!driver}
      >
        Fahrbericht PDF erstellen
      </Button>
    </Card>
  );
}
