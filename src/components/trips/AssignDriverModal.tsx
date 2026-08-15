import React, { useMemo, useState } from 'react';
import type { Trip } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { Modal } from '../ui/Modal';
import { Field, Select } from '../ui/Field';
import { Button } from '../ui/Button';

export function AssignDriverModal({
  trip,
  onClose,
  onAssigned,
}: {
  trip: Trip | null;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const { user, company } = useAuth();
  const drivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );
  const [driverId, setDriverId] = useState('');

  if (!trip) return null;

  const handleAssign = () => {
    if (!driverId || !company || user?.role !== 'admin' || trip.companyId !== company.id) return;
    const driver = db.users.getForCompany(company.id, driverId);
    if (!driver || driver.role !== 'driver') return;
    db.trips.updateForCompany(company.id, trip.id, { driverId });
    onAssigned();
    setDriverId('');
  };

  return (
    <Modal open={!!trip} onClose={onClose} title="Fahrer zuweisen">
      <div className="space-y-4">
        <p className="text-sm text-ink/60">
          Fahrt für <span className="font-bold text-ink">{trip.customerName}</span> ({trip.pickupAddress} →{' '}
          {trip.destinationAddress}) einem Fahrer zuweisen.
        </p>
        <Field label="Fahrer" required>
          <Select value={driverId} onChange={(e) => setDriverId(e.target.value)} autoFocus>
            <option value="">Fahrer auswählen</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="button" fullWidth disabled={!driverId} onClick={handleAssign}>
            Zuweisen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
