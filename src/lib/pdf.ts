import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Trip, User, Vehicle } from '../types';

// ملاحظة هندسية مهمة: مكتبة jsPDF لا تدعم عرض النص العربي بشكل صحيح
// (لا تدعم تشكيل الحروف المتصلة ولا اتجاه الكتابة من اليمين لليسار) بدون
// دمج مكتبات تشكيل خط إضافية ثقيلة. لضمان مستند PDF مضبوط وقابل للقراءة
// 100% من قبل المحاسب، يتم إخراج التقرير بتسميات ألمانية/إنجليزية (وهي
// اللغة المعتادة للمستندات المحاسبية في ألمانيا) بينما تبقى بيانات
// الرحلات (الأسماء والعناوين) كما أُدخلت تماماً.

const PAYMENT_LABEL_DE: Record<Trip['paymentMethod'], string> = {
  cash: 'Bar',
  card: 'Karte',
  invoice: 'Rechnung',
  health_insurance: 'Krankenkasse / Kostenträger',
  municipality_school: 'Gemeinde / Schulbeförderung',
};

const STATUS_LABEL_DE: Record<Trip['status'], string> = {
  scheduled: 'Geplant',
  ongoing: 'Laufend',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
};

const ENTRY_LABEL_DE: Record<Trip['entrySource'], string> = {
  central: 'Zentrale',
  driver_phone: 'Fahrer (Direktanruf)',
};

export function exportTripsReportPdf(params: {
  companyName: string;
  periodLabel: string;
  trips: Trip[];
  drivers: User[];
  vehicles: Vehicle[];
}) {
  const { companyName, periodLabel, trips, drivers, vehicles } = params;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const driverName = (id?: string) => (id ? drivers.find((d) => d.id === id)?.name ?? '-' : 'Nicht zugewiesen');
  const vehiclePlate = (id?: string) => (id ? vehicles.find((v) => v.id === id)?.plate ?? '-' : '-');

  doc.setFontSize(16);
  doc.setTextColor(23, 22, 21);
  doc.text(`${companyName} – Fahrtenbericht`, 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(90, 85, 78);
  doc.text(`Unternehmen: ${companyName}`, 14, 23);
  doc.text(`Zeitraum: ${periodLabel}`, 14, 28);
  doc.text(`Erstellt am: ${new Date().toLocaleString('de-DE')}`, 14, 33);

  const completed = trips.filter((t) => t.status === 'completed');
  const completedWithPrice = completed.filter((t) => t.price != null);
  const totalRevenue = completedWithPrice.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const openPriceCount = trips.filter((t) => t.status !== 'cancelled' && t.price == null).length;
  const byPayment: Record<string, number> = {};
  completedWithPrice.forEach((trip) => {
    byPayment[trip.paymentMethod] = (byPayment[trip.paymentMethod] ?? 0) + (trip.price ?? 0);
  });

  doc.setFontSize(11);
  doc.setTextColor(23, 22, 21);
  doc.text(
    `Fahrten gesamt: ${trips.length}   |   Abgeschlossen: ${completed.length}   |   Umsatz: ${totalRevenue.toFixed(
      2,
    )} EUR (bekannt)   |   Preise offen: ${openPriceCount}`,
    14,
    41,
  );
  const paymentSummary = Object.entries(byPayment)
    .map(([k, v]) => `${PAYMENT_LABEL_DE[k as Trip['paymentMethod']]}: ${v.toFixed(2)} EUR`)
    .join('   |   ');
  if (paymentSummary) {
    doc.setFontSize(9.5);
    doc.setTextColor(90, 85, 78);
    doc.text(paymentSummary, 14, 46);
  }

  autoTable(doc, {
    startY: 51,
    head: [['Datum/Zeit', 'Kunde', 'Von', 'Nach', 'Fahrer', 'Fahrzeug', 'Zahlung', 'Status', 'Quelle', 'Preis (EUR)']],
    body: trips.map((t) => [
      new Date(t.scheduledAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }),
      t.customerName,
      t.pickupAddress,
      t.destinationAddress,
      driverName(t.driverId),
      vehiclePlate(t.vehicleId),
      PAYMENT_LABEL_DE[t.paymentMethod],
      STATUS_LABEL_DE[t.status],
      ENTRY_LABEL_DE[t.entrySource],
      t.price != null ? t.price.toFixed(2) : 'offen',
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [23, 22, 21], textColor: [244, 236, 221] },
    alternateRowStyles: { fillColor: [251, 246, 236] },
    columnStyles: { 9: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const fileName = `taxischild-bericht-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function getFahrberichtHeaders(showTripTime = false): string[] {
  return showTripTime ? ['Zeit', 'Name', 'Von', 'Nach', 'Kürzel', 'Euro'] : ['Name', 'Von', 'Nach', 'Kürzel', 'Euro'];
}

export function getFahrberichtRow(trip: Trip, showTripTime = false): string[] {
  const row = [
    trip.customerName,
    trip.pickupAddress,
    trip.destinationAddress,
    trip.destinationCode ?? '-',
    trip.status === 'cancelled' ? 'storniert' : trip.price != null ? trip.price.toFixed(2) : 'offen',
  ];
  if (!showTripTime) return row;
  return [new Date(trip.scheduledAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), ...row];
}

// Tagesbericht je Fahrer (entspricht dem Papier-"Fahrbericht"): Kopfdaten,
// Fahrtenliste des Tages, Kilometerstände sowie leere Zeilen für Unterschrift
// und Firmenstempel zum Ausdrucken.
export function exportFahrberichtPdf(params: {
  companyName: string;
  driver: User;
  vehicle?: Vehicle;
  dateLabel: string;
  trips: Trip[];
  odometerStart?: number;
  odometerEnd?: number;
  showTripTime?: boolean;
}) {
  const { companyName, driver, vehicle, dateLabel, trips, odometerStart, odometerEnd, showTripTime = false } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(23, 22, 21);
  doc.text('Fahrbericht', 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(90, 85, 78);
  doc.text(`Unternehmen: ${companyName}`, 14, 23);
  doc.text(`Datum: ${dateLabel}`, 14, 28);

  doc.setFontSize(10.5);
  doc.setTextColor(23, 22, 21);
  doc.text(`Fahrer: ${driver.name}${driver.employeeNumber ? '   |   Fahrer-Nr.: ' + driver.employeeNumber : ''}`, 14, 36);
  doc.text(`Fahrzeug: ${vehicle ? `${vehicle.plate} (${vehicle.model})` : '-'}`, 14, 41.5);

  const activeTrips = trips.filter((t) => t.status !== 'cancelled');
  const total = activeTrips.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const openPriceCount = activeTrips.filter((trip) => trip.price == null).length;
  const headers = getFahrberichtHeaders(showTripTime);
  const totalKm = odometerStart != null && odometerEnd != null && odometerEnd >= odometerStart
    ? odometerEnd - odometerStart
    : undefined;

  autoTable(doc, {
    startY: 47,
    head: [headers],
    body: trips.map((trip) => getFahrberichtRow(trip, showTripTime)),
    foot: [[
      ...Array(Math.max(0, headers.length - 2)).fill(''),
      `Gesamt${openPriceCount ? ` (${openPriceCount} offen)` : ''}`,
      total.toFixed(2),
    ]],
    styles: { fontSize: 9, cellPadding: 2.2 },
    headStyles: { fillColor: [23, 22, 21], textColor: [244, 236, 221] },
    footStyles: { fillColor: [230, 210, 181], textColor: [23, 22, 21], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [251, 246, 236] },
    columnStyles: { [headers.length - 1]: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // lastAutoTable wird vom autoTable-Plugin zur Laufzeit angehängt (nicht in allen Versionen typisiert)
  let y = ((doc as any).lastAutoTable?.finalY ?? 47) + 12;

  doc.setFontSize(10.5);
  doc.setTextColor(23, 22, 21);
  doc.text(`KM Anfang: ${odometerStart != null ? odometerStart : '_______________'}`, 14, y);
  doc.text(`KM Ende: ${odometerEnd != null ? odometerEnd : '_______________'}`, 105, y);
  doc.text(`Gesamt: ${totalKm != null ? `${totalKm} km` : '_______________'}`, 14, y + 7);

  y += 24;
  doc.setDrawColor(150, 140, 125);
  doc.line(14, y, 85, y);
  doc.line(120, y, 191, y);
  doc.setFontSize(9);
  doc.setTextColor(90, 85, 78);
  doc.text('Unterschrift Fahrer', 14, y + 5);
  doc.text('Firmenstempel', 120, y + 5);

  doc.save(`fahrbericht-${driver.name.replace(/\s+/g, '-').toLowerCase()}-${dateLabel.replace(/\./g, '-')}.pdf`);
}

// Monatlicher Stundenzettel je Fahrer: Arbeitszeiten pro Tag, Pausen,
// Notizen und Monatssumme.
export function exportStundenzettelPdf(params: {
  companyName: string;
  driver: User;
  monthLabel: string;
  rows: Array<{ dateLabel: string; workStart?: string; workEnd?: string; breakMinutes?: number; totalMinutes: number; notes?: string }>;
}) {
  const { companyName, driver, monthLabel, rows } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(23, 22, 21);
  doc.text('Stundenzettel', 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(90, 85, 78);
  doc.text(`Unternehmen: ${companyName}`, 14, 23);
  doc.text(`Fahrer: ${driver.name}${driver.employeeNumber ? ' (Nr. ' + driver.employeeNumber + ')' : ''}`, 14, 28);
  doc.text(`Monat: ${monthLabel}`, 14, 33);

  const totalMinutes = rows.reduce((s, r) => s + r.totalMinutes, 0);
  const fmt = (min: number) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')} h`;

  autoTable(doc, {
    startY: 40,
    head: [['Datum', 'Beginn', 'Ende', 'Gesamtzeit', 'Pause (Min.)', 'Bemerkung']],
    body: rows.map((r) => [
      r.dateLabel,
      r.workStart ?? '-',
      r.workEnd ?? '-',
      r.totalMinutes > 0 ? fmt(r.totalMinutes) : '-',
      r.breakMinutes ? String(r.breakMinutes) : '-',
      r.notes ?? '',
    ]),
    foot: [['', '', '', fmt(totalMinutes), '', 'Gesamtstunden']],
    styles: { fontSize: 9, cellPadding: 2.2 },
    headStyles: { fillColor: [23, 22, 21], textColor: [244, 236, 221] },
    footStyles: { fillColor: [230, 210, 181], textColor: [23, 22, 21], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [251, 246, 236] },
    margin: { left: 14, right: 14 },
  });

  // lastAutoTable wird vom autoTable-Plugin zur Laufzeit angehängt (nicht in allen Versionen typisiert)
  const y = ((doc as any).lastAutoTable?.finalY ?? 40) + 16;
  doc.setDrawColor(150, 140, 125);
  doc.line(14, y, 85, y);
  doc.setFontSize(9);
  doc.setTextColor(90, 85, 78);
  doc.text('Unterschrift Fahrer', 14, y + 5);

  doc.save(`stundenzettel-${driver.name.replace(/\s+/g, '-').toLowerCase()}-${monthLabel.replace(/\s+/g, '-')}.pdf`);
}
