import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import OdometerCard from "../components/OdometerCard";
import HoursCard from "../components/HoursCard";
import WeekTable from "../components/WeekTable";
import BrandFooter from "../components/BrandFooter";
import { loadSetup, TaxiSetup, emptySetup } from "../lib/setup-storage";
import {
  DailyReport,
  addDays,
  formatDateFull,
  formatDateCompact,
  formatDateShort,
  getReport,
  getWeekDates,
  loadReports,
  saveReports,
  todayKey,
  upsertReport,
} from "../lib/reports-storage";
import { loadTrips, type Trip } from "../lib/trips-storage";

export default function ReportsPage() {
  const [setup, setSetup] = useState<TaxiSetup>(emptySetup);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSetup(loadSetup());
    setReports(loadReports());
    setSelectedDate(todayKey());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveReports(reports);
  }, [reports, hydrated]);

  const weekDates = useMemo(() => (selectedDate ? getWeekDates(selectedDate) : []), [selectedDate]);

  const currentReport = useMemo(
    () => (selectedDate ? getReport(reports, selectedDate) : null),
    [reports, selectedDate]
  );

  const weekTrips = useMemo(() => {
    if (!weekDates.length) return [] as Trip[];
    return loadTrips()
      .filter((trip) => weekDates.includes(trip.date))
      .sort((left, right) => left.pickupTime.localeCompare(right.pickupTime));
  }, [weekDates]);

  const weekSummary = useMemo(() => {
    const passengerCount = weekTrips.reduce((sum, trip) => sum + (trip.passengerCount ?? 0), 0);
    const priceTotal = weekTrips.reduce((sum, trip) => {
      const cleaned = (trip.price ?? "")
        .replace(/[^0-9,.-]/g, "")
        .replace(".", "")
        .replace(",", ".");
      const parsed = Number.parseFloat(cleaned);
      return sum + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);

    return {
      passengerCount,
      priceTotal,
    };
  }, [weekTrips]);

  const updateReport = (updated: DailyReport) => {
    setReports((prev) => upsertReport(prev, updated));
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const title = setup.companyName || "TaxiSchild Fahrbericht";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(title, 40, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Fahrer: ${setup.driverName || "—"}`, 40, 74);
    doc.text(`Fahrzeug: ${setup.vehicleNumber || "—"}`, 40, 92);
    doc.text(`Berichtswoche: ${formatDateCompact(weekDates[0])} – ${formatDateCompact(weekDates[6])}`, 40, 110);
    doc.text(`Fahrten: ${weekTrips.length} · Passagiere: ${weekSummary.passengerCount} · Umsatz: ${weekSummary.priceTotal.toFixed(2).replace(".", ",")} €`, 40, 128);

    autoTable(doc, {
      head: [["Datum", "Abholzeit", "Kunde", "Ziel", "Fahrer", "Fahrzeug", "Passagiere", "Preis"]],
      body: weekTrips.map((trip) => [
        formatDateShort(trip.date),
        trip.pickupTime,
        trip.customerName,
        trip.destination,
        trip.driverName || "—",
        trip.vehicleLabel || "—",
        trip.passengerCount?.toString() ?? "—",
        trip.price || "—",
      ]),
      startY: 150,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [22, 22, 22], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });

    doc.save(`fahrbericht-${selectedDate}.pdf`);
  };

  if (!hydrated || !currentReport) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-mono text-sm text-muted">Lade Berichte …</p>
      </div>
    );
  }

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-16 pt-8 sm:pt-10 print:max-w-full print:px-0 print:pt-0">
      <header className="mb-5 flex items-start justify-between gap-3 border-b border-line pb-4 print:hidden">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Reports &amp; Export</p>
          <h1 className="font-display text-2xl font-700 uppercase tracking-wide text-cream">Fahrbericht</h1>
        </div>
        <Link
          to="/dashboard"
          className="flex h-10 shrink-0 items-center rounded-md border border-line px-3 font-mono text-xs uppercase tracking-signage text-muted transition-colors hover:border-amber hover:text-amber"
        >
          Dashboard
        </Link>
      </header>

      <div className="mb-5 flex items-center justify-between gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setSelectedDate((value) => addDays(value, -1))}
          aria-label="Vorheriger Tag"
          className="flex h-11 w-11 items-center justify-center rounded-md border border-line font-mono text-lg text-cream hover:border-amber hover:text-amber"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-lg font-700 uppercase tracking-wide text-cream">
            {formatDateFull(selectedDate)}
          </p>
          {selectedDate !== todayKey() && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayKey())}
              className="font-mono text-[11px] uppercase tracking-signage text-amber"
            >
              Zu heute springen
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSelectedDate((value) => addDays(value, 1))}
          aria-label="Nächster Tag"
          className="flex h-11 w-11 items-center justify-center rounded-md border border-line font-mono text-lg text-cream hover:border-amber hover:text-amber"
        >
          ›
        </button>
      </div>

      <div className="flex flex-col gap-4 print:hidden">
        <OdometerCard report={currentReport} onChange={updateReport} />
        <HoursCard report={currentReport} onChange={updateReport} />
      </div>

      <section className="mt-6 print:mt-0">
        <div className="mb-3 flex items-baseline justify-between print:hidden">
          <h2 className="font-display text-lg font-700 uppercase tracking-wide text-cream">Wochenübersicht</h2>
          <span className="font-mono text-xs text-muted">
            {formatDateCompact(weekStart)} – {formatDateCompact(weekEnd)}
          </span>
        </div>

        <div className="hidden print:block print:mb-6">
          <p className="font-mono text-xs uppercase tracking-signage text-asphalt/70">
            {formatDateCompact(todayKey())} erstellt
          </p>
          <h1 className="font-display text-3xl font-700 uppercase tracking-wide text-asphalt">
            {setup.companyName || "Fahrbericht & Stundenzettel"}
          </h1>
          <p className="mt-1 font-mono text-sm text-asphalt">
            Fahrzeug-Nr. {setup.vehicleNumber || "—"} · Fahrer: {setup.driverName || "—"}
          </p>
          <p className="mt-1 font-mono text-sm text-asphalt">
            Berichtswoche: {formatDateCompact(weekStart)} – {formatDateCompact(weekEnd)}
          </p>
          <div className="mt-3 border-t-2 border-asphalt" />
        </div>

        <div className="mb-4 rounded-lg border border-line bg-panel p-4 print:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-signage text-muted">Wochensummary</p>
              <p className="font-display text-lg font-700 uppercase tracking-wide text-cream">{weekTrips.length} Fahrten</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] uppercase tracking-signage text-muted">Passagiere</p>
              <p className="font-mono text-sm text-amber">{weekSummary.passengerCount}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <p className="font-mono text-[11px] uppercase tracking-signage text-muted">Umsatz</p>
            <p className="font-mono text-sm text-amber">{weekSummary.priceTotal.toFixed(2).replace(".", ",")} €</p>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 print:border-0 print:bg-white print:p-0">
          <WeekTable weekDates={weekDates} reports={reports} selectedDate={selectedDate} />
        </div>

        <div className="mt-4 rounded-lg border border-line bg-panel p-4 print:hidden">
          <h3 className="font-display text-base font-700 uppercase tracking-wide text-cream">Telefonbuchungen dieser Woche</h3>
          <div className="mt-3 flex flex-col gap-2">
            {weekTrips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
                <div>
                  <p className="text-cream">{trip.customerName}</p>
                  <p className="font-mono text-[11px] uppercase tracking-signage text-muted">{trip.pickupTime} · {trip.destination}</p>
                </div>
                <span className="font-mono text-xs text-amber">{trip.price || "—"}</span>
              </div>
            ))}
            {weekTrips.length === 0 && <p className="text-sm text-muted">Noch keine Fahrten in dieser Woche.</p>}
          </div>
        </div>

        <div className="hidden print:mt-10 print:flex print:justify-between print:gap-8">
          <div className="flex-1">
            <div className="h-10 border-b border-asphalt" />
            <p className="mt-1 font-mono text-xs text-asphalt">Unterschrift Fahrer</p>
          </div>
          <div className="flex-1">
            <div className="h-10 border-b border-asphalt" />
            <p className="mt-1 font-mono text-xs text-asphalt">Datum</p>
          </div>
        </div>

        <p className="hidden print:mt-8 print:block print:font-mono print:text-[10px] print:text-asphalt/60">
          Erstellt mit TaxiSchild · ein Produkt von Schild Systems
        </p>
      </section>

      <div className="mt-6 flex flex-col gap-3 print:hidden">
        <button
          type="button"
          onClick={exportPdf}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-md bg-amber font-display text-lg font-700 uppercase tracking-signage text-asphalt"
        >
          PDF exportieren
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-md border border-line font-display text-lg font-700 uppercase tracking-signage text-cream"
        >
          Bericht drucken
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted print:hidden">
        Im Druckdialog &quot;Als PDF speichern&quot; wählen, um eine Exportdatei zu erhalten.
      </p>

      <BrandFooter />
    </main>
  );
}
