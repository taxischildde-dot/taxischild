import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { formatDateKey, formatDurationMinutes } from '../../lib/format';
import { buildTimesheetRows, filterDailyLogsByPeriod } from '../../lib/timesheet';
import { exportStundenzettelPdf } from '../../lib/pdf';
import { Card } from '../ui/Card';
import { Field, Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { DownloadIcon } from '../ui/Icons';

function currentDateValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function firstDayOfCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function periodLabelDe(start: string, end: string): string {
  return `${formatDateKey(start)} – ${formatDateKey(end)}`;
}

export function StundenzettelCard() {
  const { user, company } = useAuth();
  const isAdmin = user?.role === 'admin';

  const drivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );

  const [driverId, setDriverId] = useState(isAdmin ? drivers[0]?.id ?? '' : user?.id ?? '');
  const [periodStart, setPeriodStart] = useState(firstDayOfCurrentMonth());
  const [periodEnd, setPeriodEnd] = useState(currentDateValue());

  if (!company || (isAdmin && drivers.length === 0)) return null;

  const driver = db.users.getForCompany(company.id, driverId);
  const logs = driver ? db.dailyLogs.byDriver(company.id, driver.id) : [];
  const validPeriod = periodStart <= periodEnd;
  const periodLogs = filterDailyLogsByPeriod(logs, periodStart, periodEnd);
  const rows = buildTimesheetRows(periodLogs, formatDateKey);
  const totalMinutes = rows.reduce((s, r) => s + r.totalMinutes, 0);

  const handleExport = () => {
    if (!driver) return;
    exportStundenzettelPdf({
      companyName: company.name,
      driver,
      monthLabel: periodLabelDe(periodStart, periodEnd),
      rows,
    });
  };

  return (
    <Card>
      <h3 className="mb-1 font-display text-sm font-extrabold text-ink">Stundenzettel (Monat)</h3>
      <p className="mb-3 text-xs text-ink/50">Arbeitszeiten je Tag mit Pausen und Monatssumme.</p>

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
        <Field label="Von">
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </Field>
        <Field label="Bis">
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </Field>
      </div>

      {!validPeriod && <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">Das Enddatum muss am oder nach dem Startdatum liegen.</p>}
      <p className="mt-3 text-sm text-ink/60">
        {rows.length} erfasste Tag(e) · Zeitraum {periodStart} bis {periodEnd} · Gesamt {formatDurationMinutes(totalMinutes)}
      </p>

      <Button
        fullWidth
        className="mt-3"
        icon={<DownloadIcon width={18} height={18} />}
        onClick={handleExport}
        disabled={!driver || !validPeriod || rows.length === 0}
      >
        Stundenzettel PDF erstellen
      </Button>
    </Card>
  );
}
