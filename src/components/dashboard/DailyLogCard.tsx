import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { syncDailyLogToCloud } from '../../lib/cloudSync';
import { toDateKey, formatDurationMinutes, computeWorkMinutes } from '../../lib/format';
import { Card } from '../ui/Card';
import { Field, Input } from '../ui/Field';
import { Button } from '../ui/Button';

export function DailyLogCard() {
  const { user, company } = useAuth();
  const todayKey = toDateKey();

  const existing = useMemo(
    () => (user && company ? db.dailyLogs.byDriverAndDate(company.id, user.id, todayKey) : undefined),
    [company, user, todayKey],
  );

  const [odometerStart, setOdometerStart] = useState(existing?.odometerStart != null ? String(existing.odometerStart) : '');
  const [odometerEnd, setOdometerEnd] = useState(existing?.odometerEnd != null ? String(existing.odometerEnd) : '');
  const [workStart, setWorkStart] = useState(existing?.workStart ?? '');
  const [workEnd, setWorkEnd] = useState(existing?.workEnd ?? '');
  const [breakMinutes, setBreakMinutes] = useState(existing?.breakMinutes != null ? String(existing.breakMinutes) : '');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!user || !company || user.role !== 'driver') return null;

  const workedMinutes = computeWorkMinutes(workStart, workEnd, Number(breakMinutes) || 0);

  const handleSave = async () => {
    setSaveError('');
    const savedLog = db.dailyLogs.upsert({
      companyId: company.id,
      driverId: user.id,
      date: todayKey,
      patch: {
        odometerStart: odometerStart ? Number(odometerStart) : undefined,
        odometerEnd: odometerEnd ? Number(odometerEnd) : undefined,
        workStart: workStart || undefined,
        workEnd: workEnd || undefined,
        breakMinutes: breakMinutes ? Number(breakMinutes) : undefined,
      },
    });
    const cloudResult = await syncDailyLogToCloud(savedLog);
    if (!cloudResult.ok) {
      setSaveError(`Lokal gespeichert, aber nicht in der Cloud: ${cloudResult.error}`);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <Card>
      <h3 className="mb-1 font-display text-sm font-extrabold text-ink">Tagesabschluss</h3>
      <p className="mb-3 text-xs text-ink/50">
        Kilometerstand und Arbeitszeit für heute — Basis für Fahrbericht &amp; Stundenzettel.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="KM-Start">
          <Input
            value={odometerStart}
            onChange={(e) => setOdometerStart(e.target.value)}
            inputMode="numeric"
            placeholder="z. B. 88210"
          />
        </Field>
        <Field label="KM-Ende">
          <Input
            value={odometerEnd}
            onChange={(e) => setOdometerEnd(e.target.value)}
            inputMode="numeric"
            placeholder="z. B. 88395"
          />
        </Field>
        <Field label="Arbeitsbeginn">
          <Input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
        </Field>
        <Field label="Arbeitsende">
          <Input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
        </Field>
        <Field label="Pause (Min.)" className="col-span-2">
          <Input value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} inputMode="numeric" placeholder="30" />
        </Field>
      </div>

      {workedMinutes > 0 && (
        <p className="mt-3 text-sm font-bold text-ink/70">
          Arbeitszeit heute: <span className="font-meter text-amber-600">{formatDurationMinutes(workedMinutes)}</span>
        </p>
      )}

      <Button fullWidth className="mt-3" onClick={() => void handleSave()}>
        Tagesabschluss speichern
      </Button>
      {saved && <p className="mt-2 text-center text-sm font-bold text-success">Cloud-Synchronisierung abgeschlossen</p>}
      {saveError && <p className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-center text-sm font-bold text-danger">{saveError}</p>}
    </Card>
  );
}
