import React, { useEffect, useState } from 'react';
import type { DailyLog } from '../../types';
import { db } from '../../lib/db';
import { Card } from '../ui/Card';
import { Field, Input } from '../ui/Field';
import { Button } from '../ui/Button';

interface DailyOdometerEditorProps {
  companyId: string;
  driverId?: string;
  dateKey: string;
  dailyLog?: DailyLog;
  onSaved: () => void;
}

export function DailyOdometerEditor({ companyId, driverId, dateKey, dailyLog, onSaved }: DailyOdometerEditorProps) {
  const [odometerStart, setOdometerStart] = useState('');
  const [odometerEnd, setOdometerEnd] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOdometerStart(dailyLog?.odometerStart != null ? String(dailyLog.odometerStart) : '');
    setOdometerEnd(dailyLog?.odometerEnd != null ? String(dailyLog.odometerEnd) : '');
    setSaved(false);
  }, [dailyLog?.id, dailyLog?.odometerStart, dailyLog?.odometerEnd, dateKey, driverId]);

  const handleSave = () => {
    if (!driverId) return;
    const start = odometerStart.trim() ? Number(odometerStart) : undefined;
    const end = odometerEnd.trim() ? Number(odometerEnd) : undefined;
    if ((start != null && !Number.isFinite(start)) || (end != null && !Number.isFinite(end))) return;

    db.dailyLogs.upsert({
      companyId,
      driverId,
      date: dateKey,
      patch: { odometerStart: start, odometerEnd: end },
    });
    onSaved();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  if (!driverId) return null;

  return (
    <Card className="mt-3 border-amber-400/40 bg-amber-50/50">
      <h3 className="mb-1 font-display text-sm font-extrabold text-ink">Kilometerstände für den Fahrbericht</h3>
      <p className="mb-3 text-xs text-ink/50">
        Für {dateKey} eintragen oder korrigieren. Die Werte werden dem ausgewählten Fahrer zugeordnet.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="KM-Start" hint="optional">
          <Input
            value={odometerStart}
            onChange={(event) => setOdometerStart(event.target.value)}
            inputMode="numeric"
            placeholder="z. B. 88210"
          />
        </Field>
        <Field label="KM-Ende" hint="optional">
          <Input
            value={odometerEnd}
            onChange={(event) => setOdometerEnd(event.target.value)}
            inputMode="numeric"
            placeholder="z. B. 88395"
          />
        </Field>
      </div>
      <Button fullWidth className="mt-3" onClick={handleSave}>
        Kilometerstände speichern
      </Button>
      {saved && <p className="mt-2 text-center text-sm font-bold text-success">Gespeichert</p>}
    </Card>
  );
}
