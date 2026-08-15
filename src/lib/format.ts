// أدوات تنسيق الأرقام والتواريخ والعملة

export const DEFAULT_CURRENCY = 'EUR';

export function formatMoney(value: number, currency: string = DEFAULT_CURRENCY): string {
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// yyyy-MM-ddTHH:mm — للاستخدام المباشر في input[type=datetime-local]
export function toLocalInputValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function startOfDay(d: Date = new Date()): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function endOfDay(d: Date = new Date()): Date {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

export function startOfMonth(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function startOfWeek(d: Date = new Date()): Date {
  const c = new Date(d);
  const day = (c.getDay() + 6) % 7; // Montag = Wochenbeginn
  c.setDate(c.getDate() - day);
  return startOfDay(c);
}

// yyyy-MM-dd — Schlüssel für Tagesdatensätze (DailyLog), unabhängig von Uhrzeit
export function toDateKey(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function tomorrowDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateKey(d);
}

export function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  );
}

// Minuten -> "Xh Ym"
export function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}:${String(m).padStart(2, '0')} h`;
}

// Arbeitszeit aus HH:mm Start/Ende abzüglich Pause in Minuten berechnen
export function computeWorkMinutes(start?: string, end?: string, breakMinutes = 0): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60; // Schicht über Mitternacht
  return Math.max(0, minutes - (breakMinutes || 0));
}

const WEEKDAY_LABEL_DE: Record<string, string> = {
  mon: 'Mo',
  tue: 'Di',
  wed: 'Mi',
  thu: 'Do',
  fri: 'Fr',
  sat: 'Sa',
  sun: 'So',
};

export function weekdayLabel(day: string): string {
  return WEEKDAY_LABEL_DE[day] ?? day;
}
