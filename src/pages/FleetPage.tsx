import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Vehicle, VehicleStatus } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { VehicleCard } from '../components/fleet/VehicleCard';
import { EmptyState } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Field, Input, Select } from '../components/ui/Field';
import { FleetIcon, PlusIcon } from '../components/ui/Icons';
import { VEHICLE_STATUS_LABEL } from '../lib/labels';

const emptyForm = { plate: '', model: '', year: '', status: 'active' as VehicleStatus, assignedDriverId: '', notes: '' };

export default function FleetPage() {
  const { user, company } = useAuth();
  const [refreshTick, setRefreshTick] = useState(0);
  const forceRefresh = () => setRefreshTick((n) => n + 1);
  const canManage = user?.role === 'admin';

  const vehicles = company ? db.vehicles.byCompany(company.id) : [];
  const drivers = company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      plate: v.plate,
      model: v.model,
      year: v.year ? String(v.year) : '',
      status: v.status,
      assignedDriverId: v.assignedDriverId ?? '',
      notes: v.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleDelete = (v: Vehicle) => {
    if (!company || !canManage || v.companyId !== company.id) return;
    if (!window.confirm(`Fahrzeug ${v.plate} wirklich löschen?`)) return;
    db.vehicles.removeForCompany(company.id, v.id);
    forceRefresh();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !canManage) return;
    const payload = {
      companyId: company.id,
      plate: form.plate.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : undefined,
      status: form.status,
      assignedDriverId: form.assignedDriverId || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editing) {
      db.vehicles.updateForCompany(company.id, editing.id, payload);
    } else {
      db.vehicles.create(payload);
    }
    setModalOpen(false);
    forceRefresh();
  };

  return (
    <div>
      <TopBar title="Fuhrpark" subtitle={`${vehicles.length} Fahrzeuge`} />

      <div className="space-y-4 px-4 pt-4">
        {canManage && (
          <Button fullWidth icon={<PlusIcon width={18} height={18} />} onClick={openCreate}>
            Fahrzeug hinzufügen
          </Button>
        )}

        {vehicles.length === 0 ? (
          <EmptyState
            icon={<FleetIcon width={36} height={36} />}
            title="Noch keine Fahrzeuge erfasst"
            description={canManage ? 'Fügen Sie Ihr erstes Fahrzeug hinzu' : 'Es wurden noch keine Fahrzeuge angelegt'}
          />
        ) : (
          <div className="space-y-3 pb-4">
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                driver={v.assignedDriverId && company ? db.users.getForCompany(company.id, v.assignedDriverId) : undefined}
                canManage={canManage}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Kennzeichen" required>
            <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} required />
          </Field>
          <Field label="Modell" required>
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Baujahr" hint="optional">
              <Input
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Technischer Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
              >
                {Object.entries(VEHICLE_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Zuständiger Fahrer" hint="optional">
            <Select
              value={form.assignedDriverId}
              onChange={(e) => setForm({ ...form, assignedDriverId: e.target.value })}
            >
              <option value="">Kein Fahrer zugewiesen</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Technische Notizen" hint="optional">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="z. B. Ölwechsel fällig" />
          </Field>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" fullWidth>
              Speichern
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
