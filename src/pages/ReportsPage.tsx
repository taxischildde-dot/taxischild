import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { TopBar } from '../components/layout/TopBar';
import { Card, EmptyState } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/dashboard/StatCard';
import { formatDateTime, formatMoney, startOfDay, startOfMonth, startOfWeek } from '../lib/format';
import { PAYMENT_METHOD_LABEL, TRIP_STATUS_LABEL } from '../lib/labels';
import { DownloadIcon, ReportIcon } from '../components/ui/Icons';
import { exportTripsReportPdf } from '../lib/pdf';
import { FahrberichtCard } from '../components/reports/FahrberichtCard';
import { StundenzettelCard } from '../components/reports/StundenzettelCard';
import type { PaymentMethod } from '../types';

type Period = 'today' | 'week' | 'month' | 'all';

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'today', label: 'Heute' },
  { key: 'week', label: 'Diese Woche' },
  { key: 'month', label: 'Dieser Monat' },
  { key: 'all', label: 'Alle' },
];

export default function ReportsPage() {
  const { user, company } = useAuth();
  const [period, setPeriod] = useState<Period>('month');

  const allTrips = useMemo(() => (company ? db.trips.byCompany(company.id) : []), [company]);
  const drivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );
  const vehicles = useMemo(() => (company ? db.vehicles.byCompany(company.id) : []), [company]);

  const scopedTrips = user?.role === 'admin' ? allTrips : allTrips.filter((t) => t.driverId === user?.id);

  const filteredTrips = useMemo(() => {
    if (period === 'all') return scopedTrips;
    const from = period === 'today' ? startOfDay() : period === 'week' ? startOfWeek() : startOfMonth();
    return scopedTrips.filter((t) => new Date(t.scheduledAt) >= from);
  }, [scopedTrips, period]);

  const completed = filteredTrips.filter((t) => t.status === 'completed');
  const totalRevenue = completed.reduce((s, t) => s + t.price, 0);
  const avgPrice = completed.length ? totalRevenue / completed.length : 0;

  const byPayment = completed.reduce<Record<string, number>>((acc, t) => {
    acc[t.paymentMethod] = (acc[t.paymentMethod] ?? 0) + t.price;
    return acc;
  }, {});

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';

  const handleExport = () => {
    if (!company) return;
    exportTripsReportPdf({
      companyName: company.name,
      periodLabel,
      trips: filteredTrips,
      drivers,
      vehicles,
    });
  };

  return (
    <div>
      <TopBar title="Berichte" subtitle="Finanzübersicht & Export für die Buchhaltung" />

      <div className="space-y-5 px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`shrink-0 rounded-pill border px-4 py-2 text-sm font-bold transition ${
                period === p.key
                  ? 'border-asphalt-900 bg-asphalt-900 text-cream-100'
                  : 'border-cream-400 bg-cream-100 text-ink/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Anzahl Fahrten" value={String(filteredTrips.length)} tone="dark" />
          <StatCard label="Abgeschlossen" value={String(completed.length)} />
          <StatCard label="Gesamtumsatz" value={formatMoney(totalRevenue)} tone="amber" />
          <StatCard label="Ø Preis pro Fahrt" value={formatMoney(avgPrice)} />
        </div>

        {Object.keys(byPayment).length > 0 && (
          <Card>
            <h3 className="mb-3 font-display text-sm font-extrabold text-ink/70">Umsatz nach Zahlungsart</h3>
            <div className="space-y-2">
              {Object.entries(byPayment).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between text-sm">
                  <span className="text-ink/60">{PAYMENT_METHOD_LABEL[method as PaymentMethod]}</span>
                  <span className="font-meter font-bold tabular-nums text-ink">{formatMoney(amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button
          fullWidth
          size="lg"
          icon={<DownloadIcon width={20} height={20} />}
          onClick={handleExport}
          disabled={filteredTrips.length === 0}
        >
          PDF-Bericht exportieren ({periodLabel})
        </Button>

        <div>
          <h3 className="mb-2.5 font-display text-base font-extrabold text-ink">Fahrtenliste</h3>
          {filteredTrips.length === 0 ? (
            <EmptyState icon={<ReportIcon width={32} height={32} />} title="Keine Daten für diesen Zeitraum" />
          ) : (
            <Card padded={false} className="divide-y divide-cream-400/50 overflow-hidden">
              {filteredTrips.slice(0, 30).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{t.customerName}</p>
                    <p className="text-xs text-ink/45">
                      {formatDateTime(t.scheduledAt)} · {TRIP_STATUS_LABEL[t.status]}
                    </p>
                  </div>
                  <span className="font-meter shrink-0 font-bold tabular-nums text-ink/80">
                    {formatMoney(t.price, t.currency)}
                  </span>
                </div>
              ))}
              {filteredTrips.length > 30 && (
                <p className="px-4 py-3 text-center text-xs text-ink/40">
                  und {filteredTrips.length - 30} weitere Fahrten — nutzen Sie den PDF-Export für die vollständige Liste
                </p>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-3 border-t border-cream-400/60 pt-5">
          <h3 className="font-display text-base font-extrabold text-ink">Fahrer-Dokumente</h3>
          <FahrberichtCard />
          <StundenzettelCard />
        </div>
      </div>
    </div>
  );
}
