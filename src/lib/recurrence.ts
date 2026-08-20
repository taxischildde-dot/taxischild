import type { Weekday } from '../types';

const weekdayByDayIndex: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function weekdayForDate(date: Date): Weekday {
  return weekdayByDayIndex[date.getDay()]!;
}

export function recurringOccurrenceDates({
  firstScheduledAt,
  endDate,
  weekdays,
  maximumOccurrences = 180,
}: {
  firstScheduledAt: Date;
  endDate: string;
  weekdays: Weekday[];
  maximumOccurrences?: number;
}): Date[] {
  if (!endDate || weekdays.length === 0 || Number.isNaN(firstScheduledAt.getTime())) return [];
  const end = new Date(`${endDate}T23:59:59.999`);
  if (Number.isNaN(end.getTime()) || end < firstScheduledAt) return [];

  const selection = new Set(weekdays);
  const cursor = new Date(firstScheduledAt);
  const occurrences: Date[] = [];
  while (cursor <= end && occurrences.length < maximumOccurrences) {
    if (selection.has(weekdayForDate(cursor))) occurrences.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return occurrences;
}

export function hasEquivalentTrip(
  trips: Array<Pick<import('../types').Trip, 'customerName' | 'pickupAddress' | 'destinationAddress' | 'scheduledAt'>>,
  candidate: Pick<import('../types').Trip, 'customerName' | 'pickupAddress' | 'destinationAddress' | 'scheduledAt'>,
): boolean {
  return trips.some((trip) =>
    trip.customerName.trim().toLowerCase() === candidate.customerName.trim().toLowerCase() &&
    trip.pickupAddress.trim().toLowerCase() === candidate.pickupAddress.trim().toLowerCase() &&
    trip.destinationAddress.trim().toLowerCase() === candidate.destinationAddress.trim().toLowerCase() &&
    new Date(trip.scheduledAt).getTime() === new Date(candidate.scheduledAt).getTime(),
  );
}
