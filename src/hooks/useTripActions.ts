import type { Company, Trip, TripStatus, User } from '../types';
import { db } from '../lib/db';

const flow: Record<TripStatus, TripStatus | null> = {
  scheduled: 'ongoing',
  ongoing: 'completed',
  completed: null,
  cancelled: null,
};

// منطق تقدّم حالة الرحلة والإلغاء — مستخدم في أكثر من شاشة (الرئيسية والرحلات)
export function useTripActions({
  actor,
  company,
  onChange,
}: {
  actor: User | null;
  company: Company | null;
  onChange: () => void;
}) {
  const canManage = (trip: Trip) => {
    if (!actor || !company || trip.companyId !== company.id) return false;
    return actor.role === 'admin' || trip.driverId === actor.id;
  };

  const advance = (trip: Trip) => {
    if (!canManage(trip)) return;
    const next = flow[trip.status];
    if (!next) return;
    db.trips.updateForCompany(company!.id, trip.id, { status: next });
    onChange();
  };

  const cancel = (trip: Trip) => {
    if (!canManage(trip)) return;
    const reason = window.prompt('Bitte Stornierungsgrund eingeben:');
    if (reason === null) return;
    const cancellationReason = reason.trim();
    if (!cancellationReason) {
      window.alert('Für eine Stornierung ist ein Grund erforderlich.');
      return;
    }
    db.trips.updateForCompany(company!.id, trip.id, {
      status: 'cancelled',
      cancellationReason,
      cancelledAt: new Date().toISOString(),
    });
    onChange();
  };

  return { advance, cancel };
}
