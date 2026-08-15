import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { User, Weekday } from '../types';
import { ALL_WEEKDAYS } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Field, Input } from '../components/ui/Field';
import { weekdayLabel } from '../lib/format';
import { notificationPermission, requestNotificationPermission } from '../lib/reminders';
import { BackupIcon, BuildingIcon, EditIcon, LogoutIcon, PlusIcon, SupportIcon, UsersIcon } from '../components/ui/Icons';

const emptyDriverForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  employeeNumber: '',
  licenseType: '',
  workDays: [] as Weekday[],
};

export default function SettingsPage() {
  const { user, company, logout, updateCompanyName, updateProfile, addDriver } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState(company?.name ?? '');
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profilePhone, setProfilePhone] = useState(user?.phone ?? '');
  const [savedMsg, setSavedMsg] = useState('');

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverForm, setDriverForm] = useState(emptyDriverForm);
  const [driverError, setDriverError] = useState('');

  const [, forceTick] = useState(0);
  const [permission, setPermission] = useState(notificationPermission());

  const drivers = useMemo(
    () => (company ? db.users.byCompany(company.id).filter((u) => u.role === 'driver') : []),
    [company],
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveProfile = () => {
    updateProfile({ name: profileName.trim(), phone: profilePhone.trim() });
    if (user?.role === 'admin') updateCompanyName(companyName);
    setSavedMsg('Änderungen gespeichert');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const toggleWorkDay = (day: Weekday) => {
    setDriverForm((f) => ({
      ...f,
      workDays: f.workDays.includes(day) ? f.workDays.filter((d) => d !== day) : [...f.workDays, day],
    }));
  };

  const openAddDriver = () => {
    setEditingDriverId(null);
    setDriverForm(emptyDriverForm);
    setDriverError('');
    setDriverModalOpen(true);
  };

  const openEditDriver = (d: User) => {
    setEditingDriverId(d.id);
    setDriverForm({
      name: d.name,
      email: d.email,
      phone: d.phone ?? '',
      password: '',
      employeeNumber: d.employeeNumber ?? '',
      licenseType: d.licenseType ?? '',
      workDays: d.workDays ?? [],
    });
    setDriverError('');
    setDriverModalOpen(true);
  };

  const handleSubmitDriver = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDriverId) {
      if (driverForm.password && driverForm.password.length < 4) {
        setDriverError('Das Passwort muss mindestens 4 Zeichen lang sein');
        return;
      }
      if (!company || user?.role !== 'admin') {
        setDriverError('Nur die Geschäftsführung kann Fahrerdaten ändern');
        return;
      }
      db.users.updateForCompany(company.id, editingDriverId, {
        name: driverForm.name.trim(),
        phone: driverForm.phone.trim() || undefined,
        employeeNumber: driverForm.employeeNumber.trim() || undefined,
        licenseType: driverForm.licenseType.trim() || undefined,
        workDays: driverForm.workDays.length > 0 ? driverForm.workDays : undefined,
        ...(driverForm.password ? { password: driverForm.password } : {}),
      });
      setDriverModalOpen(false);
      forceTick((n) => n + 1);
      return;
    }

    if (driverForm.password.length < 4) {
      setDriverError('Das Passwort muss mindestens 4 Zeichen lang sein');
      return;
    }
    const result = addDriver(driverForm);
    if (!result.ok) {
      setDriverError(result.error);
      return;
    }
    setDriverModalOpen(false);
    setDriverForm(emptyDriverForm);
    setDriverError('');
  };

  const handleBackup = () => {
    if (!company) return;
    const data = db.exportForCompany(company.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeCompanyName = company.name.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'unternehmen';
    a.download = `${safeCompanyName}-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEnableReminders = async () => {
    const result = await requestNotificationPermission();
    if (result !== 'unsupported') setPermission(result);
  };

  return (
    <div>
      <TopBar title="Einstellungen" subtitle="Ihr Konto und Unternehmen" />

      <div className="space-y-5 px-4 pt-4 pb-6">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60">
              <BuildingIcon width={17} height={17} />
            </div>
            <h3 className="font-display text-sm font-extrabold text-ink">Kontodaten</h3>
          </div>
          <div className="space-y-3">
            {user?.role === 'admin' && (
              <Field label="Firmenname">
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </Field>
            )}
            <Field label="Ihr Name">
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </Field>
            <Field label="Ihre Telefonnummer">
              <Input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
            </Field>
            <Field label="E-Mail-Adresse">
              <Input value={user?.email ?? ''} disabled className="opacity-60" />
            </Field>
            <Button fullWidth onClick={handleSaveProfile}>
              Änderungen speichern
            </Button>
            {savedMsg && <p className="text-center text-sm font-bold text-success">{savedMsg}</p>}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60">
              <SupportIcon width={17} height={17} />
            </div>
            <h3 className="font-display text-sm font-extrabold text-ink">Erinnerungen</h3>
          </div>
          <p className="mb-3 text-sm text-ink/55">
            Beim Öffnen der App erhalten Sie einmal täglich einen Hinweis, wenn für morgen Fahrten geplant sind.
          </p>
          {permission === 'granted' ? (
            <p className="text-sm font-bold text-success">Erinnerungen sind aktiviert</p>
          ) : permission === 'denied' ? (
            <p className="text-sm font-bold text-danger">
              Blockiert — bitte Benachrichtigungen für diese Seite in den Browser-Einstellungen erlauben
            </p>
          ) : permission === 'unsupported' ? (
            <p className="text-sm text-ink/45">Ihr Browser unterstützt keine Benachrichtigungen</p>
          ) : (
            <Button variant="secondary" fullWidth onClick={handleEnableReminders}>
              Erinnerungen aktivieren
            </Button>
          )}
        </Card>

        {user?.role === 'admin' && (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60">
                  <UsersIcon width={17} height={17} />
                </div>
                <h3 className="font-display text-sm font-extrabold text-ink">Fahrerzugänge ({drivers.length})</h3>
              </div>
              <button
                onClick={openAddDriver}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-400 px-3 text-xs font-extrabold text-asphalt-950"
                aria-label="Fahrerzugang anlegen"
              >
                <PlusIcon width={16} height={16} />
                Fahrerzugang
              </button>
            </div>
            <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-ink/60">
              Die Geschäftsführung legt hier pro Fahrer ein eigenes Konto mit E-Mail und Passwort an. Der Fahrer meldet sich anschließend mit diesen Zugangsdaten an und sieht nur seine zugewiesenen Fahrten. Da TaxiSchild offline-first mit localStorage arbeitet, gibt es keinen automatischen E-Mail-Versand; Zugangsdaten müssen sicher direkt übergeben werden.
            </p>
            {drivers.length === 0 ? (
              <p className="text-sm text-ink/45">Es wurden noch keine Fahrerzugänge angelegt</p>
            ) : (
              <div className="divide-y divide-cream-400/50">
                {drivers.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">
                        {d.name}
                        {d.employeeNumber && <span className="ml-1.5 font-meter text-xs text-ink/40">#{d.employeeNumber}</span>}
                      </p>
                      <p className="truncate text-xs text-ink/45">{d.email}</p>
                      {d.workDays && d.workDays.length > 0 && d.workDays.length < 7 && (
                        <p className="mt-0.5 text-[0.7rem] text-ink/40">
                          {d.workDays.map(weekdayLabel).join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openEditDriver(d)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/50 hover:bg-ink/10"
                      aria-label="Fahrer bearbeiten"
                    >
                      <EditIcon width={14} height={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/5 text-ink/60">
              <BackupIcon width={17} height={17} />
            </div>
            <h3 className="font-display text-sm font-extrabold text-ink">Datensicherung</h3>
          </div>
          <p className="mb-3 text-sm text-ink/55">
            Sichern Sie alle Daten Ihres Unternehmens (Fahrten, Fahrer, Fuhrpark) als JSON-Datei — der digitale Ersatz für das Papier-Fahrtenbuch.
          </p>
          <Button variant="secondary" fullWidth onClick={handleBackup}>
            Sicherungskopie herunterladen
          </Button>
        </Card>

        <Button variant="danger" fullWidth size="lg" icon={<LogoutIcon width={18} height={18} />} onClick={handleLogout}>
          Abmelden
        </Button>
      </div>

      <Modal
        open={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        title={editingDriverId ? 'Fahrer bearbeiten' : 'Neuen Fahrer hinzufügen'}
      >
        <form onSubmit={handleSubmitDriver} className="space-y-4">
          <Field label="Name des Fahrers" required>
            <Input
              value={driverForm.name}
              onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
              required
            />
          </Field>
          <Field label="E-Mail-Adresse" required hint={editingDriverId ? 'kann nicht geändert werden' : undefined}>
            <Input
              type="email"
              value={driverForm.email}
              onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
              disabled={!!editingDriverId}
              className={editingDriverId ? 'opacity-60' : ''}
              required
            />
          </Field>
          <Field label="Telefonnummer" hint="optional">
            <Input value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fahrer-Nr." hint="optional">
              <Input
                value={driverForm.employeeNumber}
                onChange={(e) => setDriverForm({ ...driverForm, employeeNumber: e.target.value })}
                placeholder="z. B. 12"
              />
            </Field>
            <Field label="Führerschein/Schein" hint="optional">
              <Input
                value={driverForm.licenseType}
                onChange={(e) => setDriverForm({ ...driverForm, licenseType: e.target.value })}
                placeholder="P-Schein"
              />
            </Field>
          </div>
          <Field label="Arbeitstage" hint="leer = alle Tage">
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWorkDay(day)}
                  className={`h-9 w-11 rounded-xl text-xs font-bold transition ${
                    driverForm.workDays.includes(day)
                      ? 'bg-asphalt-900 text-cream-100'
                      : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
                  }`}
                >
                  {weekdayLabel(day)}
                </button>
              ))}
            </div>
          </Field>
          <Field
            label={editingDriverId ? 'Neues Passwort' : 'Passwort für den Fahrer'}
            hint={editingDriverId ? 'leer lassen, um es nicht zu ändern' : 'Nach dem Speichern sicher an den Fahrer übergeben'}
            required={!editingDriverId}
          >
            <Input
              type="password"
              value={driverForm.password}
              onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
              required={!editingDriverId}
            />
          </Field>
          {driverError && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{driverError}</p>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setDriverModalOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" fullWidth>
              {editingDriverId ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
