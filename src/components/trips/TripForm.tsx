import React, { useMemo, useState } from 'react';
import type { PaymentMethod, Trip } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { DEFAULT_CURRENCY } from '../../lib/format';
import { toLocalInputValue } from '../../lib/format';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';
import { PAYMENT_METHOD_LABEL } from '../../lib/labels';

interface TripFormProps {
  existingTrip?: Trip;
  onSaved: (trip: Trip) => void;
  onCancel: () => void;
}

export function TripForm({ existingTrip, onSaved, onCancel }: TripFormProps) {
  const { user, company } = useAuth();
  const isEdit = !!existingTrip;

  const companyDrivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );
  const companyVehicles = useMemo(() => (company ? db.vehicles.byCompany(company.id) : []), [company]);

  const [customerName, setCustomerName] = useState(existingTrip?.customerName ?? '');
  const [customerPhone, setCustomerPhone] = useState(existingTrip?.customerPhone ?? '');
  const [pickupAddress, setPickupAddress] = useState(existingTrip?.pickupAddress ?? '');
  const [destinationAddress, setDestinationAddress] = useState(existingTrip?.destinationAddress ?? '');
  const [destinationCode, setDestinationCode] = useState(existingTrip?.destinationCode ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    existingTrip ? toLocalInputValue(new Date(existingTrip.scheduledAt)) : toLocalInputValue(new Date()),
  );
  const [hasDueAt, setHasDueAt] = useState(!!existingTrip?.dueAt);
  const [dueAt, setDueAt] = useState(
    existingTrip?.dueAt ? toLocalInputValue(new Date(existingTrip.dueAt)) : '',
  );
  const [price, setPrice] = useState(existingTrip?.price != null ? String(existingTrip.price) : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existingTrip?.paymentMethod ?? 'cash');
  const [driverId, setDriverId] = useState(existingTrip?.driverId ?? (user?.role === 'driver' ? user.id : ''));
  const [vehicleId, setVehicleId] = useState(existingTrip?.vehicleId ?? '');
  const [notes, setNotes] = useState(existingTrip?.notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !company) return;

    if (!customerName.trim() || !pickupAddress.trim() || !destinationAddress.trim()) {
      setError('Bitte Kundenname, Abholort und Ziel ausfüllen');
      return;
    }
    const normalizedPrice = price.trim().replace(',', '.');
    const numericPrice = normalizedPrice ? parseFloat(normalizedPrice) : undefined;
    if (normalizedPrice && (numericPrice == null || isNaN(numericPrice) || numericPrice < 0)) {
      setError('Bitte einen gültigen Preis eingeben oder das Feld leer lassen');
      return;
    }
    // Fahrer ist nur für den Fahrer selbst verpflichtend — die Geschäftsführung
    // kann eine Fahrt bewusst "nicht zugewiesen" lassen und später zuweisen.
    const finalDriverId = user.role === 'driver' ? user.id : driverId || undefined;

    setSaving(true);
    setError('');

    const payload = {
      companyId: company.id,
      driverId: finalDriverId,
      vehicleId: vehicleId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      pickupAddress: pickupAddress.trim(),
      destinationAddress: destinationAddress.trim(),
      destinationCode: destinationCode.trim() || undefined,
      scheduledAt: new Date(scheduledAt).toISOString(),
      dueAt: hasDueAt && dueAt ? new Date(dueAt).toISOString() : undefined,
      price: numericPrice,
      currency: DEFAULT_CURRENCY,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    let saved: Trip;
    if (isEdit && existingTrip) {
      saved = db.trips.updateForCompany(company.id, existingTrip.id, payload) as Trip;
    } else {
      saved = db.trips.create({
        ...payload,
        status: 'scheduled',
        entrySource: user.role === 'driver' ? 'driver_phone' : 'central',
        createdBy: user.id,
      });
    }
    setSaving(false);
    onSaved(saved);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Kundenname" required>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="z. B. Hans Weber"
            autoFocus
          />
        </Field>
        <Field label="Telefonnummer" hint="optional">
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="0170-1234567"
            inputMode="tel"
          />
        </Field>
      </div>

      <Field label="Abholort" required>
        <Input
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          placeholder="Adresse oder Ort"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="Ziel" required>
          <Input
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            placeholder="Adresse oder Ort"
          />
        </Field>
        <Field label="Ziel-Kürzel" hint="optional, z. B. ROW">
          <Input
            value={destinationCode}
            onChange={(e) => setDestinationCode(e.target.value.toUpperCase())}
            placeholder="ROW"
            className="sm:w-24"
            maxLength={8}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Abholzeit" required>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </Field>
        <Field label="Preis (EUR)" hint="optional — kann später durch die Geschäftsführung ergänzt werden">
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preis offen"
            inputMode="decimal"
          />
        </Field>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
          <input
            type="checkbox"
            checked={hasDueAt}
            onChange={(e) => {
              setHasDueAt(e.target.checked);
              if (e.target.checked && !dueAt) setDueAt(scheduledAt);
            }}
            className="h-4 w-4 rounded border-cream-400 accent-amber-500"
          />
          Abweichende Fälligkeitszeit angeben
        </label>
        {hasDueAt && (
          <Field label="Fällig bis" hint="spätester Zeitpunkt laut Auftraggeber" className="mt-2">
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Zahlungsart">
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        {user?.role === 'admin' && (
          <Field label="Fahrer" hint="optional — kann später zugewiesen werden">
            <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Nicht zugewiesen</option>
              {companyDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {companyVehicles.length > 0 && (
        <Field label="Fahrzeug" hint="optional">
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Kein Fahrzeug zugewiesen</option>
            {companyVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.model}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Notizen" hint="optional">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Weitere Details..." />
      </Field>

      {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" fullWidth disabled={saving}>
          {isEdit ? 'Änderungen speichern' : 'Fahrt speichern'}
        </Button>
      </div>
    </form>
  );
}
