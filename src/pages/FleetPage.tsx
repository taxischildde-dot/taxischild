import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { getResponsibleDriverIds, isVehicleAssignedToUser } from '../types';
import { deleteVehicleFromCloud, hydrateCompanyCache, syncVehicleToCloud, writeAuditLog } from '../lib/cloudSync';
import { supabase } from '../lib/supabase';
import type { User, Vehicle, VehicleStatus } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { VehicleCard } from '../components/fleet/VehicleCard';
import { EmptyState } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Field, Input, Select } from '../components/ui/Field';
import { FleetIcon, PlusIcon } from '../components/ui/Icons';
import { VEHICLE_STATUS_LABEL } from '../lib/labels';

interface PendingInvite {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const emptyForm = {
  plate: '',
  model: '',
  year: '',
  status: 'active' as VehicleStatus,
  assignedDriverIds: [] as string[],
  notes: '',
};

export default function FleetPage() {
  const { user, company } = useAuth();
  const [refreshTick, setRefreshTick] = useState(0);
  const forceRefresh = () => setRefreshTick((n) => n + 1);
  const canManage = user?.role === 'admin';
  const companyId = company?.id;
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [syncError, setSyncError] = useState('');
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  useEffect(() => {
    if (!companyId) return;
    void hydrateCompanyCache(companyId, user?.role === 'driver' && user.id ? { userRole: 'driver', userId: user.id } : {}).then(() => setRefreshTick((n) => n + 1));
  }, [companyId, user?.id, user?.role]);

  useEffect(() => {
    if (!companyId || user?.role !== 'admin') {
      setPendingInvites([]);
      return;
    }
    void supabase
      .from('driver_invites')
      .select('id,name,email,created_at')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPendingInvites((data ?? []).map((row) => ({ id: String(row.id), name: String(row.name), email: String(row.email), createdAt: String(row.created_at) }))));
  }, [companyId, user?.role, refreshTick]);

  const vehicles = companyId
    ? db.vehicles.byCompany(companyId).filter((vehicle) => user?.role === 'admin' || (user ? isVehicleAssignedToUser(vehicle, user) : false))
    : [];
  const drivers = user?.role === 'admin' && companyId ? db.users.byCompany(companyId).filter((u) => u.role === 'driver') : [];
  const pendingDrivers: User[] = pendingInvites.map((invite) => ({
    id: `email:${invite.email.toLowerCase()}`,
    companyId: companyId ?? '',
    role: 'driver',
    name: invite.name,
    email: invite.email,
    createdAt: invite.createdAt,
  }));
  const assignableDrivers = [...drivers, ...pendingDrivers];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSyncError('');
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      plate: v.plate,
      model: v.model,
      year: v.year ? String(v.year) : '',
      status: v.status,
      assignedDriverIds: getResponsibleDriverIds(v),
      notes: v.notes ?? '',
    });
    setSyncError('');
    setModalOpen(true);
  };

  const handleDelete = async (v: Vehicle) => {
    if (!company || !canManage || v.companyId !== company.id) return;
    if (!window.confirm(`Fahrzeug ${v.plate} wirklich löschen?`)) return;
    db.vehicles.removeForCompany(company.id, v.id);
    const result = await deleteVehicleFromCloud(company.id, v.id);
    if (!result.ok) {
      setSyncError(`Das Fahrzeug wurde lokal entfernt, aber nicht aus der Cloud: ${result.error}`);
      return;
    }
    void writeAuditLog({ companyId: company.id, actorId: user.id, action: 'vehicle.deleted', entityType: 'vehicle', entityId: v.id, metadata: { plate: v.plate } });
    await hydrateCompanyCache(company.id);
    forceRefresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !canManage) return;
    const payload = {
      companyId: company.id,
      plate: form.plate.trim(),
      model: form.model.trim(),
      year: form.year ? Number(form.year) : undefined,
      status: form.status,
      assignedDriverIds: form.assignedDriverIds.length > 0 ? form.assignedDriverIds : undefined,
      // Clear the legacy field as well, so older localStorage records can be unassigned cleanly.
      assignedDriverId: undefined,
      notes: form.notes.trim() || undefined,
    };
    const saved = editing
      ? db.vehicles.updateForCompany(company.id, editing.id, payload)
      : db.vehicles.create(payload);
    if (!saved) {
      setSyncError('Das Fahrzeug konnte lokal nicht gespeichert werden.');
      return;
    }
    setModalOpen(false);
    forceRefresh();
    const result = await syncVehicleToCloud(saved);
    if (!result.ok) {
      setSyncError(`Das Fahrzeug wurde lokal gespeichert, aber nicht in der Cloud: ${result.error}`);
      return;
    }
    void writeAuditLog({
      companyId: company.id,
      actorId: user.id,
      action: editing ? 'vehicle.updated' : 'vehicle.created',
      entityType: 'vehicle',
      entityId: saved.id,
      metadata: { plate: saved.plate, assignedDriverIds: saved.assignedDriverIds ?? [] },
    });
    const hydration = await hydrateCompanyCache(company.id);
    if (!hydration.ok) {
      setSyncError(`Das Fahrzeug wurde gespeichert, aber die Aktualisierung konnte nicht geladen werden: ${hydration.error}`);
      return;
    }
    setSyncError('');
    forceRefresh();
  };

  return (
    <div>
      <TopBar title="Fuhrpark" subtitle={`${vehicles.length} Fahrzeuge`} />

      <div className="space-y-4 px-4 pt-4">
        {syncError && <p className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{syncError}</p>}

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
                                  responsibleDrivers={assignableDrivers.filter((driver) => isVehicleAssignedToUser(v, driver))}

                canManage={canManage}
                onEdit={openEdit}
                onDelete={(vehicle) => void handleDelete(vehicle)}
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
          <div>
            <div className="mb-1.5 flex items-baseline gap-1 text-sm font-semibold text-ink/80">
              Zuständige Fahrer
            </div>
            <div className="space-y-2 rounded-xl border border-cream-400 bg-white/70 p-3">
              {assignableDrivers.length === 0 ? (
                <p className="text-sm text-ink/50">Legen Sie zuerst Fahrer im Benutzerbereich an oder senden Sie eine Einladung.</p>
              ) : (
                assignableDrivers.map((driver) => {
                  const selected = isVehicleAssignedToUser({ assignedDriverIds: form.assignedDriverIds }, driver);
                  const limitReached = form.assignedDriverIds.length >= 2 && !selected;
                  return (
                    <label
                      key={driver.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition ${
                        limitReached ? 'cursor-not-allowed opacity-45' : 'hover:bg-cream-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={limitReached}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            assignedDriverIds: selected
                              ? current.assignedDriverIds.filter((id) => id !== driver.id && id !== `email:${driver.email.toLowerCase()}`)
                              : [...current.assignedDriverIds, driver.id],
                          }))
                        }
                        className="h-4 w-4 rounded border-cream-400 accent-amber-500"
                      />
                      <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{driver.name}</span>
                      {selected && <span className="text-xs font-bold text-amber-700">{pendingDrivers.some((pending) => pending.id === driver.id) ? 'Einladung offen' : 'Verantwortlich'}</span>}
                    </label>
                  );
                })
              )}
              <div className="flex items-center justify-between gap-3 border-t border-cream-400/70 pt-2">
                <span className="text-xs text-ink/50">Bis zu zwei Fahrer pro Fahrzeug</span>
                {form.assignedDriverIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, assignedDriverIds: [] }))}
                    className="text-xs font-bold text-danger hover:underline"
                  >
                    Zuweisung aufheben
                  </button>
                )}
              </div>
            </div>
          </div>
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
