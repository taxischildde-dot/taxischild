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
type ReportPanel = 'financial' | 'fahrbericht' | 'stundenzettel' | null;

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'today', label: 'Heute' },
  { key: 'week', label: 'Diese Woche' },
  { key: 'month', label: 'Dieser Monat' },
  { key: 'all', label: 'Alle' },
];

export default function ReportsPage() {
  const { user, company } = useAuth();
  const [period, setPeriod] = useState<Period>(user?.role === 'driver' ? 'today' : 'month');
  const [openPanel, setOpenPanel] = useState<ReportPanel>(null);

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
  const completedWithPrice = completed.filter((t) => t.price != null);
  const totalRevenue = completedWithPrice.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const openPriceCount = filteredTrips.filter((t) => t.status !== 'cancelled' && t.price == null).length;

  const byPayment = completedWithPrice.reduce<Record<string, number>>((acc, trip) => {
    acc[trip.paymentMethod] = (acc[trip.paymentMethod] ?? 0) + (trip.price ?? 0);
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

  const togglePanel = (panel: Exclude<ReportPanel, null>) => {
    setOpenPanel((current) => current === panel ? null : panel);
  };

  return (
    <div>
      <TopBar title="Berichte" subtitle={user?.role === 'admin' ? 'Nur bei Bedarf öffnen' : 'Ihre Tages- und Arbeitsunterlagen'} />

      <div className="space-y-5 px-4 pt-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => togglePanel('financial')}
            className={`rounded-2xl border p-4 text-left transition ${openPanel === 'financial' ? 'border-asphalt-900 bg-asphalt-900 text-cream-100' : 'border-cream-400 bg-cream-100 text-ink hover:border-amber-400'}`}
          >
            <ReportIcon width={22} height={22} />
            <p className="mt-3 font-display text-base font-extrabold">Fahrtenbericht</p>
            <p className={`mt-1 text-xs ${openPanel === 'financial' ? 'text-cream-100/60' : 'text-ink/50'}`}>Zeitraum und PDF</p>
          </button>
          <button
            type="button"
            onClick={() => togglePanel('fahrbericht')}
            className={`rounded-2xl border p-4 text-left transition ${openPanel === 'fahrbericht' ? 'border-asphalt-900 bg-asphalt-900 text-cream-100' : 'border-cream-400 bg-cream-100 text-ink hover:border-amber-400'}`}
          >
            <ReportIcon width={22} height={22} />
            <p className="mt-3 font-display text-base font-extrabold">Fahrbericht</p>
            <p className={`mt-1 text-xs ${openPanel === 'fahrbericht' ? 'text-cream-100/60' : 'text-ink/50'}`}>Ein Fahrer, ein Tag</p>
          </button>
          <button
            type="button"
            onClick={() => togglePanel('stundenzettel')}
            className={`rounded-2xl border p-4 text-left transition ${openPanel === 'stundenzettel' ? 'border-asphalt-900 bg-asphalt-900 text-cream-100' : 'border-cream-400 bg-cream-100 text-ink hover:border-amber-400'}`}
          >
            <ReportIcon width={22} height={22} />
            <p className="mt-3 font-display text-base font-extrabold">Stundenzettel</p>
            <p className={`mt-1 text-xs ${openPanel === 'stundenzettel' ? 'text-cream-100/60' : 'text-ink/50'}`}>Monat und Arbeitstage</p>
          </button>
        </div>

        {openPanel === null && (
          <Card className="border-amber-300/70 bg-amber-50/70">
            <p className="text-sm font-bold text-ink">Wählen Sie einen Bericht aus.</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">Die ausführlichen Monats- und PDF-Funktionen bleiben geschlossen, bis Sie sie ausdrücklich öffnen.</p>
          </Card>
        )}

        {openPanel === 'financial' && (
          <section className="space-y-5" aria-label="Fahrtenbericht">
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
              <StatCard label="Umsatz (bekannt)" value={formatMoney(totalRevenue)} tone="amber" />
              <StatCard label="Preise offen" value={String(openPriceCount)} />
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
                        {t.price != null ? formatMoney(t.price, t.currency) : 'Preis offen'}
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
          </section>
        )}

        {openPanel === 'fahrbericht' && <FahrberichtCard />}
        {openPanel === 'stundenzettel' && <StundenzettelCard />}
      </div>
    </div>
  );
}
