import { describe, expect, it } from 'vitest';
import type { DailyLog } from '../types';
import { getFahrberichtHeaders } from './pdf';
import { buildTimesheetRows, filterDailyLogsByPeriod, listDateKeys } from './timesheet';

const logs: DailyLog[] = [
  {
    id: 'log-mon',
    companyId: 'company-1',
    driverId: 'driver-1',
    date: '2026-08-03',
    workStart: '07:00',
    workEnd: '16:00',
    breakMinutes: 60,
    createdAt: '2026-08-03T06:00:00.000Z',
    updatedAt: '2026-08-03T06:00:00.000Z',
  },
  {
    id: 'log-sat',
    companyId: 'company-1',
    driverId: 'driver-1',
    date: '2026-08-08',
    workStart: '08:00',
    workEnd: '12:00',
    breakMinutes: 0,
    createdAt: '2026-08-08T07:00:00.000Z',
    updatedAt: '2026-08-08T07:00:00.000Z',
  },
];

describe('timesheet period and report separation', () => {
  it('generates the exact calendar dates for a Monday-to-Friday range', () => {
    expect(listDateKeys('2026-08-03', '2026-08-07')).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
    ]);
  });
  it('keeps a Monday-to-Friday period out of the Saturday row and deducts the break', () => {
    const filtered = filterDailyLogsByPeriod(logs, '2026-08-03', '2026-08-07');
    expect(filtered.map((log) => log.id)).toEqual(['log-mon']);
    expect(buildTimesheetRows(filtered, (date) => date)[0].totalMinutes).toBe(8 * 60);
  });

  it('does not put work-time columns into the daily Fahrbericht by default', () => {
    expect(getFahrberichtHeaders()).not.toEqual(expect.arrayContaining(['Beginn', 'Ende', 'Pause', 'Gesamtzeit']));
  });
});
