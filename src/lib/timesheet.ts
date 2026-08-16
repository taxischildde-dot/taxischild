import type { DailyLog } from '../types';
import { computeWorkMinutes } from './format';

export interface TimesheetRow {
  dateLabel: string;
  workStart?: string;
  workEnd?: string;
  breakMinutes?: number;
  totalMinutes: number;
  notes?: string;
}

export function filterDailyLogsByPeriod(logs: DailyLog[], periodStart: string, periodEnd: string): DailyLog[] {
  if (periodStart > periodEnd) return [];
  return logs
    .filter((log) => log.date >= periodStart && log.date <= periodEnd)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildTimesheetRows(logs: DailyLog[], formatDate: (date: string) => string): TimesheetRow[] {
  return logs.map((log) => ({
    dateLabel: formatDate(log.date),
    workStart: log.workStart,
    workEnd: log.workEnd,
    breakMinutes: log.breakMinutes,
    totalMinutes: computeWorkMinutes(log.workStart, log.workEnd, log.breakMinutes ?? 0),
    notes: log.notes,
  }));
}
