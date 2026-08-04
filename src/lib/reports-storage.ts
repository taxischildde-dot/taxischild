export type DailyReport = {
  date: string; // YYYY-MM-DD
  startKm: number | null;
  endKm: number | null;
  workStart: string; // HH:MM
  workEnd: string; // HH:MM
  breakMinutes: number | null;
};

export const REPORTS_STORAGE_KEY = "taxiFlotte.reports";

export function emptyReport(date: string): DailyReport {
  return { date, startKm: null, endKm: null, workStart: "", workEnd: "", breakMinutes: null };
}

export function loadReports(): DailyReport[] {
  try {
    const raw = window.localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveReports(reports: DailyReport[]) {
  window.localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
}

export function upsertReport(reports: DailyReport[], updated: DailyReport): DailyReport[] {
  const idx = reports.findIndex((r) => r.date === updated.date);
  if (idx === -1) return [...reports, updated];
  const copy = [...reports];
  copy[idx] = updated;
  return copy;
}

export function getReport(reports: DailyReport[], date: string): DailyReport {
  return reports.find((r) => r.date === date) ?? emptyReport(date);
}

export function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return formatDateKey(dt);
}

/** Monday-start week (as used in Germany) containing the given date. */
export function getWeekDates(dateKey: string): string[] {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dayOfWeek = dt.getDay(); // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(dt);
  monday.setDate(dt.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return formatDateKey(day);
  });
}

export function distanceKm(report: DailyReport): number | null {
  if (report.startKm == null || report.endKm == null) return null;
  const diff = report.endKm - report.startKm;
  return diff >= 0 ? diff : null;
}

/** Total worked minutes, net of break. Handles shifts that cross midnight. */
export function workedMinutes(report: DailyReport): number | null {
  if (!report.workStart || !report.workEnd) return null;
  const [sh, sm] = report.workStart.split(":").map(Number);
  const [eh, em] = report.workEnd.split(":").map(Number);
  let total = eh * 60 + em - (sh * 60 + sm);
  if (total < 0) total += 24 * 60;
  total -= report.breakMinutes ?? 0;
  return total >= 0 ? total : null;
}

export function formatHoursLabel(minutes: number | null): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")} h`;
}

export function formatDateShort(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatDateFull(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateCompact(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
