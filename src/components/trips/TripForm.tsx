import React, { useMemo, useState } from 'react';
import type { PaymentMethod, Trip, Weekday } from '../../types';
import { ALL_WEEKDAYS, isVehicleAssignedToUser } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/db';
import { syncTripToCloud, updateTripInCloud, writeAuditLog } from '../../lib/cloudSync';
import { DEFAULT_CURRENCY } from '../../lib/format';
import { toLocalInputValue } from '../../lib/format';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';
import { PAYMENT_METHOD_LABEL } from '../../lib/labels';
import { hasEquivalentTrip, recurringOccurrenceDates, weekdayForDate } from '../../lib/recurrence';

interface TripFormProps {
  existingTrip?: Trip;
  defaultDriverId?: string;
  onSaved: (trip: Trip) => void;
  onCancel: () => void;
}

export function TripForm({ existingTrip, defaultDriverId, onSaved, onCancel }: TripFormProps) {
  const { user, company } = useAuth();
  const isEdit = !!existingTrip;
  const lockBillingFields = isEdit && user?.role === 'driver';

  const companyDrivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );
  const companyVehicles = useMemo(() => (company ? db.vehicles.byCompany(company.id) : []), [company]);
  const availableVehicles = useMemo(
    () => user?.role === 'driver' ? companyVehicles.filter((vehicle) => isVehicleAssignedToUser(vehicle, user)) : companyVehicles,
    [companyVehicles, user],
  );

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
  const [driverId, setDriverId] = useState(existingTrip?.driverId ?? defaultDriverId ?? (user?.role === 'driver' ? user.id : ''));
  const [vehicleId, setVehicleId] = useState(
    existingTrip?.vehicleId ?? (user?.role === 'driver' && availableVehicles.length === 1 ? availableVehicles[0].id : ''),
  );
  const [notes, setNotes] = useState(existingTrip?.notes ?? '');
  const [hasReturnTrip, setHasReturnTrip] = useState(false);
  const [returnScheduledAt, setReturnScheduledAt] = useState('');
  const [returnDriverId, setReturnDriverId] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatEndDate, setRepeatEndDate] = useState('');
  const [repeatWeekdays, setRepeatWeekdays] = useState<Weekday[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const suggestionTrips = useMemo(() => {
    if (!company || !user) return [];
    return user.role === 'admin' ? db.trips.byCompany(company.id) : db.trips.byDriver(company.id, user.id);
  }, [company, user]);
  const customerSuggestions = [...new Set(suggestionTrips.map((trip) => trip.customerName).filter(Boolean))].slice(0, 100);
  const pickupSuggestions = [...new Set(suggestionTrips.map((trip) => trip.pickupAddress).filter(Boolean))].slice(0, 100);
  const destinationSuggestions = [...new Set(suggestionTrips.map((trip) => trip.destinationAddress).filter(Boolean))].slice(0, 100);

  const handleCustomerChange = (name: string) => {
    setCustomerName(name);
    const matched = suggestionTrips.find((t) => t.customerName.toLowerCase() === name.trim().toLowerCase());
    if (matched) {
      setCustomerPhone(matched.customerPhone || '');
      setPickupAddress(matched.pickupAddress || '');
      setDestinationAddress(matched.destinationAddress || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (repeatWeekly && hasReturnTrip) {
      setError('Bitte legen Sie eine Rückfahrt als eigene Serie an. So können Hin- und Rückfahrt separat geplant werden.');
      return;
    }
    if (repeatWeekly && (!repeatEndDate || repeatWeekdays.length === 0)) {
      setError('Bitte wählen Sie für die Serienbuchung mindestens einen Wochentag und ein Enddatum.');
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
      price: lockBillingFields ? existingTrip?.price : numericPrice,
      currency: DEFAULT_CURRENCY,
      paymentMethod: lockBillingFields ? existingTrip?.paymentMethod ?? paymentMethod : paymentMethod,
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
    const cloudResult = isEdit ? await updateTripInCloud(saved) : await syncTripToCloud(saved);
    if (!cloudResult.ok) {
      setSaving(false);
      setError(`Die Fahrt wurde lokal gespeichert, aber nicht in der Cloud: ${cloudResult.error}`);
      return;
    }

    if (!isEdit && hasReturnTrip && returnScheduledAt) {
      const returnPayload = {
        companyId: company.id,
        driverId: user.role === 'driver' ? user.id : (returnDriverId || finalDriverId),
        vehicleId: vehicleId || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        pickupAddress: destinationAddress.trim(), // Rückfahrt: Ziel wird Abholort
        destinationAddress: pickupAddress.trim(),  // Rückfahrt: Abholort wird Ziel
        destinationCode: destinationCode.trim() || undefined,
        scheduledAt: new Date(returnScheduledAt).toISOString(),
        price: numericPrice,
        currency: DEFAULT_CURRENCY,
        paymentMethod: paymentMethod,
        notes: notes.trim() ? `Rückfahrt zu ${saved.id} — ${notes.trim()}` : `Rückfahrt zu ${saved.id}`,
      };
      const returnTrip = db.trips.create({
        ...returnPayload,
        status: 'scheduled',
        entrySource: user.role === 'driver' ? 'driver_phone' : 'central',
        createdBy: user.id,
      });
      await syncTripToCloud(returnTrip);
    }

    if (!isEdit && repeatWeekly) {
      const occurrences = recurringOccurrenceDates({
        firstScheduledAt: new Date(scheduledAt),
        endDate: repeatEndDate,
        weekdays: repeatWeekdays,
      });
      const knownTrips = db.trips.byCompany(company.id);
      for (const occurrence of occurrences) {
        if (occurrence.getTime() === new Date(saved.scheduledAt).getTime()) continue;
        const recurringPayload = { ...payload, scheduledAt: occurrence.toISOString() };
        if (hasEquivalentTrip(knownTrips, recurringPayload)) continue;
        const recurringTrip = db.trips.create({
          ...recurringPayload,
          notes: notes.trim() ? `Serienbuchung — ${notes.trim()}` : 'Serienbuchung',
          status: 'scheduled',
          entrySource: 'central',
          createdBy: user.id,
        });
        const recurringCloudResult = await syncTripToCloud(recurringTrip);
        if (!recurringCloudResult.ok) {
          setSaving(false);
          setError(`Die Serienfahrt am ${occurrence.toLocaleDateString('de-DE')} wurde nicht in der Cloud gespeichert: ${recurringCloudResult.error}`);
          return;
        }
        knownTrips.push(recurringTrip);
      }
    }

    setSaving(false);
    void writeAuditLog({
      companyId: company.id,
      actorId: user.id,
      action: isEdit ? 'trip.updated' : 'trip.created',
      entityType: 'trip',
      entityId: saved.id,
      metadata: { driverId: saved.driverId ?? null, customerName: saved.customerName },
    });
    onSaved(saved);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Kundenname &amp; Stammkunden-Auswahl" required hint="Wählen Sie aus der Liste oder tippen Sie einen neuen Namen">
          <Input
            value={customerName}
            onChange={(e) => handleCustomerChange(e.target.value)}
            placeholder="z. B. Hans Weber"
            list="taxischild-customer-suggestions"
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
            list="taxischild-pickup-suggestions"
          />

      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="Ziel" required>
          <Input
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            placeholder="Adresse oder Ort"
            list="taxischild-destination-suggestions"
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
        <Field label="Preis (EUR)" hint={lockBillingFields ? 'Wird von der Geschäftsführung verwaltet' : 'optional — kann später durch die Geschäftsführung ergänzt werden'}>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preis offen"
            inputMode="decimal"
            disabled={lockBillingFields}
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
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} disabled={lockBillingFields}>
            {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        {user?.role === 'admin' && (
          <Field label="Fahrer" hint="optional — kann später zugewiesen werden">
            <Select
              value={driverId}
              onChange={(e) => {
                const nextDriverId = e.target.value;
                setDriverId(nextDriverId);
                if (!vehicleId && nextDriverId) {
                  const selectedDriver = companyDrivers.find((driver) => driver.id === nextDriverId);
                  const responsibleVehicles = selectedDriver
                    ? companyVehicles.filter((vehicle) => isVehicleAssignedToUser(vehicle, selectedDriver))
                    : [];
                  if (responsibleVehicles.length === 1) setVehicleId(responsibleVehicles[0].id);
                }
              }}
            >
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

      {availableVehicles.length > 0 && (
        <Field label="Fahrzeug" hint="optional">
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Kein Fahrzeug zugewiesen</option>
            {availableVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} — {v.model}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <datalist id="taxischild-customer-suggestions">{customerSuggestions.map((value) => <option key={value} value={value} />)}</datalist>
      <datalist id="taxischild-pickup-suggestions">{pickupSuggestions.map((value) => <option key={value} value={value} />)}</datalist>
      <datalist id="taxischild-destination-suggestions">{destinationSuggestions.map((value) => <option key={value} value={value} />)}</datalist>

      <Field label="Notizen" hint="optional">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Weitere Details..." />
      </Field>

      {!isEdit && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-4">
          <label className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <input
              type="checkbox"
              checked={hasReturnTrip}
              onChange={(e) => {
                setHasReturnTrip(e.target.checked);
                if (e.target.checked && !returnScheduledAt) {
                  const d = new Date(scheduledAt || Date.now());
                  d.setHours(d.getHours() + 2);
                  setReturnScheduledAt(toLocalInputValue(d));
                }
              }}
              className="h-4 w-4 rounded border-cream-400 accent-amber-500"
            />
            Rückfahrt automatisch einplanen (gleicher Kunde)
          </label>
          {hasReturnTrip && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Rückfahrt-Zeitpunkt" required>
                <Input
                  type="datetime-local"
                  value={returnScheduledAt}
                  onChange={(e) => setReturnScheduledAt(e.target.value)}
                />
              </Field>
              {user?.role === 'admin' && (
                <Field label="Fahrer für Rückfahrt" hint="optional">
                  <Select value={returnDriverId} onChange={(e) => setReturnDriverId(e.target.value)}>
                    <option value="">Wie Hinfahrt / Nicht zugewiesen</option>
                    {companyDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
          )}
        </div>
      )}

      {!isEdit && user?.role === 'admin' && (
        <div className="rounded-2xl border border-asphalt-900/15 bg-asphalt-900/[0.03] p-4">
          <label className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <input
              type="checkbox"
              checked={repeatWeekly}
              onChange={(e) => {
                const enabled = e.target.checked;
                setRepeatWeekly(enabled);
                if (enabled) {
                  const first = new Date(scheduledAt || Date.now());
                  setRepeatWeekdays((current) => current.length > 0 ? current : [weekdayForDate(first)]);
                  if (!repeatEndDate) {
                    const end = new Date(first);
                    end.setMonth(end.getMonth() + 1);
                    setRepeatEndDate(end.toISOString().slice(0, 10));
                  }
                }
              }}
              className="h-4 w-4 rounded border-cream-400 accent-amber-500"
            />
            Wöchentliche Serienbuchung anlegen
          </label>
          {repeatWeekly && (
            <div className="mt-3 space-y-3">
              <p className="text-xs leading-relaxed text-ink/60">Es werden normal bearbeitbare Einzelbuchungen für die gewählten Wochentage erstellt. Bereits vorhandene gleiche Fahrten werden nicht doppelt angelegt.</p>
              <div className="flex flex-wrap gap-2">
                {ALL_WEEKDAYS.map((weekday) => {
                  const selected = repeatWeekdays.includes(weekday);
                  const labels: Record<Weekday, string> = { mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So' };
                  return (
                    <button
                      key={weekday}
                      type="button"
                      onClick={() => setRepeatWeekdays((current) => selected ? current.filter((day) => day !== weekday) : [...current, weekday])}
                      className={`rounded-pill border px-3 py-1.5 text-xs font-extrabold transition ${selected ? 'border-asphalt-900 bg-asphalt-900 text-cream-100' : 'border-cream-400 bg-white text-ink/60'}`}
                    >
                      {labels[weekday]}
                    </button>
                  );
                })}
              </div>
              <Field label="Serie endet am" required>
                <Input type="date" value={repeatEndDate} min={scheduledAt.slice(0, 10)} onChange={(e) => setRepeatEndDate(e.target.value)} />
              </Field>
            </div>
          )}
        </div>
      )}

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
