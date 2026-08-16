import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { computeWorkMinutes, formatDateKey, formatDurationMinutes } from '../../lib/format';
import { listDateKeys, TimesheetRow } from '../../lib/timesheet';
import { exportStundenzettelPdf } from '../../lib/pdf';
import { Card } from '../ui/Card';
import { Field, Input, Select } from '../ui/Field';
import { Button } from '../ui/Button';
import { DownloadIcon } from '../ui/Icons';

interface TimesheetDraft {
  workStart: string;
  workEnd: string;
  breakMinutes: string;
  notes: string;
}

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
  const [drafts, setDrafts] = useState<Record<string, TimesheetDraft>>({});
  const [savedDate, setSavedDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [, forceRefresh] = useState(0);

  if (!company || (isAdmin && drivers.length === 0)) return null;

  const driver = db.users.getForCompany(company.id, driverId);
  const logs = driver ? db.dailyLogs.byDriver(company.id, driver.id) : [];
  const logsByDate = new Map(logs.map((log) => [log.date, log]));
  const validPeriod = periodStart <= periodEnd;
  const periodDates = validPeriod ? listDateKeys(periodStart, periodEnd) : [];
  const rows: TimesheetRow[] = periodDates.map((date) => {
    const log = logsByDate.get(date);
    return {
      dateLabel: formatDateKey(date),
      workStart: log?.workStart,
      workEnd: log?.workEnd,
      breakMinutes: log?.breakMinutes,
      totalMinutes: computeWorkMinutes(log?.workStart, log?.workEnd, log?.breakMinutes ?? 0),
      notes: log?.notes,
    };
  });
  const totalMinutes = rows.reduce((sum, row) => sum + row.totalMinutes, 0);

  const draftFor = (date: string): TimesheetDraft => {
    const log = logsByDate.get(date);
    return drafts[date] ?? {
      workStart: log?.workStart ?? '',
      workEnd: log?.workEnd ?? '',
      breakMinutes: log?.breakMinutes != null ? String(log.breakMinutes) : '',
      notes: log?.notes ?? '',
    };
  };

  const updateDraft = (date: string, patch: Partial<TimesheetDraft>) => {
    setDrafts((current) => ({ ...current, [date]: { ...draftFor(date), ...patch } }));
    setSavedDate(null);
  };

  const saveDay = (date: string) => {
    if (!driver) return;
    const draft = draftFor(date);
    const parsedBreak = draft.breakMinutes.trim() ? Number(draft.breakMinutes) : undefined;
    if (parsedBreak != null && (!Number.isFinite(parsedBreak) || parsedBreak < 0)) {
      setError('Bitte eine gültige Pausenzeit in Minuten eingeben.');
      return;
    }
    db.dailyLogs.upsert({
      companyId: company.id,
      driverId: driver.id,
      date,
      patch: {
        workStart: draft.workStart || undefined,
        workEnd: draft.workEnd || undefined,
        breakMinutes: parsedBreak,
        notes: draft.notes.trim() || undefined,
      },
    });
    setDrafts((current) => ({ ...current, [date]: draft }));
    setError('');
    setSavedDate(date);
    forceRefresh((value) => value + 1);
  };

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
      <h3 className="mb-1 font-display text-sm font-extrabold text-ink">Stundenzettel (Arbeitszeit)</h3>
      <p className="mb-3 text-xs text-ink/50">Beginn, Ende und Pausen werden hier gepflegt. Dieser Bereich ist unabhängig vom täglichen Fahrbericht.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin && (
          <Field label="Fahrer">
            <Select value={driverId} onChange={(event) => setDriverId(event.target.value)}>
              {drivers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Von">
          <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
        </Field>
        <Field label="Bis">
          <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
        </Field>
      </div>

      {!validPeriod && <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">Das Enddatum muss am oder nach dem Startdatum liegen.</p>}
      {error && <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}

      <div className="mt-4 space-y-2">
        {periodDates.length === 0 ? (
          <p className="rounded-xl bg-ink/5 px-3 py-3 text-sm text-ink/55">Bitte einen gültigen Zeitraum auswählen.</p>
        ) : (
          periodDates.map((date) => {
            const draft = draftFor(date);
            const draftTotal = computeWorkMinutes(draft.workStart, draft.workEnd, Number(draft.breakMinutes) || 0);
            return (
              <div key={date} className="rounded-2xl border border-cream-400/70 bg-cream-100/70 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-display text-sm font-extrabold text-ink">{formatDateKey(date)}</p>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-extrabold text-amber-800">
                    Netto {formatDurationMinutes(draftTotal)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <Field label="Beginn">
                    <Input type="time" value={draft.workStart} onChange={(event) => updateDraft(date, { workStart: event.target.value })} />
                  </Field>
                  <Field label="Ende">
                    <Input type="time" value={draft.workEnd} onChange={(event) => updateDraft(date, { workEnd: event.target.value })} />
                  </Field>
                  <Field label="Pause (Min.)">
                    <Input value={draft.breakMinutes} inputMode="numeric" onChange={(event) => updateDraft(date, { breakMinutes: event.target.value })} />
                  </Field>
                  <Field label="Bemerkung">
                    <Input value={draft.notes} onChange={(event) => updateDraft(date, { notes: event.target.value })} placeholder="optional" />
                  </Field>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={() => saveDay(date)}>
                    {savedDate === date ? 'Gespeichert' : 'Tag speichern'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-3 text-sm text-ink/60">
        {periodDates.length} Tag(e) im Zeitraum · Gesamt {formatDurationMinutes(totalMinutes)}
      </p>

      <Button
        fullWidth
        className="mt-3"
        icon={<DownloadIcon width={18} height={18} />}
        onClick={handleExport}
        disabled={!driver || !validPeriod || periodDates.length === 0}
      >
        Stundenzettel PDF erstellen
      </Button>
    </Card>
  );
}
