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
  onError,
}: {
  actor: User | null;
  company: Company | null;
  onChange: () => void;
  onError?: (message: string) => void;
}) {
  const canManage = (trip: Trip) => {
    if (!actor || !company || trip.companyId !== company.id) return false;
    return actor.role === 'admin' || trip.driverId === actor.id;
  };

  const advance = (trip: Trip) => {
    if (!canManage(trip)) return;
    const next = flow[trip.status];
    if (!next) return;
    try {
      const updated = db.trips.updateForCompany(company!.id, trip.id, { status: next });
      if (!updated) throw new Error('Die Fahrt konnte nicht gefunden werden.');
      onChange();
    } catch (error) {
      console.error('[TaxiSchild] Trip status update failed', error);
      onError?.('Die Fahrt konnte nicht aktualisiert werden. Bitte erneut versuchen.');
    }
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
    try {
      const updated = db.trips.updateForCompany(company!.id, trip.id, {
        status: 'cancelled',
        cancellationReason,
        cancelledAt: new Date().toISOString(),
      });
      if (!updated) throw new Error('Die Fahrt konnte nicht gefunden werden.');
      onChange();
    } catch (error) {
      console.error('[TaxiSchild] Trip cancellation failed', error);
      onError?.('Die Fahrt konnte nicht storniert werden. Bitte erneut versuchen.');
    }
  };

  return { advance, cancel };
}
