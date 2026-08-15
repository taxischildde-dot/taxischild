import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { computeWorkMinutes, formatDateKey, formatDurationMinutes } from '../../lib/format';
import { exportStundenzettelPdf } from '../../lib/pdf';
import { Card } from '../ui/Card';
import { Field, Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { DownloadIcon } from '../ui/Icons';

function currentMonthValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabelDe(monthValue: string): string {
  const [y, m] = monthValue.split('-').map(Number);
  return new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

export function StundenzettelCard() {
  const { user, company } = useAuth();
  const isAdmin = user?.role === 'admin';

  const drivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );

  const [driverId, setDriverId] = useState(isAdmin ? drivers[0]?.id ?? '' : user?.id ?? '');
  const [monthValue, setMonthValue] = useState(currentMonthValue());

  if (!company || (isAdmin && drivers.length === 0)) return null;

  const driver = db.users.getForCompany(company.id, driverId);
  const logs = driver ? db.dailyLogs.byDriver(company.id, driver.id) : [];
  const monthLogs = logs
    .filter((l) => l.date.startsWith(monthValue))
    .sort((a, b) => a.date.localeCompare(b.date));

  const rows = monthLogs.map((l) => ({
    dateLabel: formatDateKey(l.date),
    workStart: l.workStart,
    workEnd: l.workEnd,
    breakMinutes: l.breakMinutes,
    totalMinutes: computeWorkMinutes(l.workStart, l.workEnd, l.breakMinutes ?? 0),
    notes: l.notes,
  }));
  const totalMinutes = rows.reduce((s, r) => s + r.totalMinutes, 0);

  const handleExport = () => {
    if (!driver) return;
    exportStundenzettelPdf({
      companyName: company.name,
      driver,
      monthLabel: monthLabelDe(monthValue),
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
        <Field label="Monat">
          <Input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
        </Field>
      </div>

      <p className="mt-3 text-sm text-ink/60">
        {rows.length} erfasste Tag(e) · Gesamt {formatDurationMinutes(totalMinutes)}
      </p>

      <Button
        fullWidth
        className="mt-3"
        icon={<DownloadIcon width={18} height={18} />}
        onClick={handleExport}
        disabled={!driver || rows.length === 0}
      >
        Stundenzettel PDF erstellen
      </Button>
    </Card>
  );
}
