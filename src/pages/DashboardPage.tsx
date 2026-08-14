import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveUser, CompanyDriver, CompanyVehicle, generateTempPassword, createDriverAccount } from "../lib/auth-storage";
import { loadTrips, saveTrips, Trip, createTripId, todayKey, updateTrip, deleteTrip } from "../lib/trips-storage";
import { loadSetup, saveSetup, TaxiSetup } from "../lib/setup-storage";
import { saveNotifications, loadNotifications } from "../lib/notifications-storage";
import { loadPassengers, SavedPassenger } from "../lib/passengers-storage";
import StatusBadge from "../components/StatusBadge";
import BrandFooter from "../components/BrandFooter";

type DriverStatus = "available" | "busy" | "break";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState(getActiveUser());
  const [setup, setSetup] = useState<TaxiSetup>(loadSetup());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showDriverDetail, setShowDriverDetail] = useState<string | null>(null);
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [newDriverEmail, setNewDriverEmail] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");
  const [createdDriverInfo, setCreatedDriverInfo] = useState<{email: string; tempPassword: string} | null>(null);
  const [filter, setFilter] = useState<"today" | "tomorrow" | "upcoming">("today");
  const [error, setError] = useState("");
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [reassigningTrip, setReassigningTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const user = getActiveUser();
    if (!user) { navigate("/login", { replace: true }); return; }
    if (user.role === "driver") { navigate("/driver", { replace: true }); return; }
    setActiveUser(user);
    setSetup(loadSetup(user.companyId));
    setTrips(loadTrips(user.companyId));
  }, [navigate]);

  const activeDrivers = useMemo(() => {
    return setup.drivers
      .filter(d => d.active)
      .map(d => {
        const driverTrips = trips.filter(t => t.driverId === d.id && t.date === todayKey() && t.status !== "storniert" && t.status !== "erledigt");
        let status: DriverStatus = "available";
        let color = "bg-emerald-500";
        let icon = "🟢";
        if (driverTrips.some(t => t.status === "aktiv")) { status = "busy"; color = "bg-alert"; icon = "🔴"; }
        return { ...d, status, color, icon };
      });
  }, [setup.drivers, trips]);

  const inactiveDrivers = useMemo(() => setup.drivers.filter(d => !d.active), [setup.drivers]);

  const filteredTrips = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    return trips.filter(trip => {
      const t = new Date(trip.date); t.setHours(0,0,0,0);
      if (filter === "today") return t.getTime() === today.getTime();
      if (filter === "tomorrow") return t.getTime() === tomorrow.getTime();
      return t >= today;
    }).sort((a, b) => a.pickupTime.localeCompare(b.pickupTime));
  }, [trips, filter]);

  const handleAddTrip = (trip: Trip) => {
    const all = [...trips, trip];
    saveTrips(all, activeUser?.companyId);
    setTrips(all);
    if (trip.driverId) {
      const notifs = loadNotifications(activeUser?.companyId);
      const newNotif = {
        id: `notif_${Date.now()}`,
        userId: trip.driverId,
        type: "assigned_trip" as const,
        message: `Neue Fahrt: ${trip.customerName} um ${trip.pickupTime}`,
        tripId: trip.id,
        read: false,
        createdAt: Date.now(),
      };
      saveNotifications([...notifs, newNotif], activeUser?.companyId);
    }
    setShowAddTrip(false);
    setEditingTrip(null);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setShowAddTrip(true);
  };

  const handleReassignTrip = (trip: Trip) => {
    setReassigningTrip(trip);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (!confirm("Sind Sie sicher? Diese Fahrt wird gelöscht.")) return;
    deleteTrip(tripId, activeUser?.companyId);
    setTrips(loadTrips(activeUser?.companyId));
  };

  const toggleDriverActive = (driverId: string) => {
    const next = {
      ...setup,
      drivers: setup.drivers.map(d => d.id === driverId ? { ...d, active: !d.active } : d)
    };
    saveSetup(next, activeUser?.companyId);
    setSetup(next);
  };

  const handleCreateDriver = () => {
    if (!newDriverEmail.trim() || !newDriverName.trim()) {
      setError("E-Mail und Name sind erforderlich.");
      return;
    }
    const tempPassword = generateTempPassword();
    const result = createDriverAccount({
      ownerId: activeUser!.id,
      email: newDriverEmail,
      name: newDriverName,
      phone: newDriverPhone,
      tempPassword,
    });
    
    if (!result.ok) {
      setError(result.error ?? "Fehler beim Erstellen.");
      return;
    }
    
    setCreatedDriverInfo({ email: newDriverEmail, tempPassword });
    setSetup(loadSetup(activeUser?.companyId));
    setNewDriverEmail("");
    setNewDriverName("");
    setNewDriverPhone("");
    setError("");
  };

  if (!activeUser) return null;

  return (
    <div className="min-h-dvh bg-asphalt text-cream font-body">
      <header className="sticky top-0 z-20 bg-panel/95 backdrop-blur border-b border-line">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-signage uppercase text-cream">{setup.companyName || activeUser.companyName}</h1>
            <p className="text-sm text-muted mt-0.5">Flottenmanagement · {activeDrivers.length} Fahrer aktiv</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingTrip(null); setShowAddTrip(true); }} className="px-4 py-2.5 bg-amber text-asphalt font-bold rounded-lg hover:bg-amber/90 transition shadow-lamp active:scale-95 text-sm uppercase tracking-signage">
              ➕ Fahrt
            </button>
            <button onClick={() => navigate("/fahrten")} className="p-2.5 rounded-lg hover:bg-asphalt transition text-muted" title="Fahrtenliste">📋</button>
            <button onClick={() => navigate("/berichte")} className="p-2.5 rounded-lg hover:bg-asphalt transition text-muted" title="Berichte">📊</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-panel p-4 rounded-xl border border-line flex items-center justify-between">
          <div>
            <p className="text-xs text-muted uppercase tracking-signage">Einladungscode</p>
            <p className="font-mono text-lg text-amber font-bold tracking-wider">{setup.inviteCode || activeUser.inviteCode}</p>
          </div>
          <button onClick={() => navigator.clipboard.writeText(setup.inviteCode || activeUser.inviteCode)} className="px-3 py-2 bg-asphalt border border-line rounded-lg text-sm text-cream hover:border-amber/50 transition">
            Kopieren
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold tracking-signage uppercase text-cream">Fahrer-Status</h2>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" />Verfügbar</span>
              <span className="flex items-center gap-1 text-alert"><span className="w-2 h-2 rounded-full bg-alert" />Auf Fahrt</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeDrivers.map(driver => (
              <button key={driver.id} onClick={() => setShowDriverDetail(driver.id)} className="bg-panel p-4 rounded-xl border border-line hover:border-amber/30 transition text-left relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1 ${driver.color}`} />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-asphalt border border-line flex items-center justify-center text-lg">👤</div>
                  <div className="min-w-0">
                    <p className="font-bold text-cream text-sm truncate">{driver.name}</p>
                    <p className="text-[10px] text-muted uppercase tracking-signage">{driver.icon} {driver.status === "busy" ? "Auf Fahrt" : "Verfügbar"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{trips.filter(t => t.driverId === driver.id && t.date === todayKey()).length} Fahrten</span>
                </div>
              </button>
            ))}
            <button onClick={() => setShowCreateDriver(true)} className="bg-panel p-4 rounded-xl border border-dashed border-line hover:border-amber/50 transition text-center text-muted hover:text-cream">
              <p className="text-2xl mb-1">➕</p>
              <p className="text-xs font-bold uppercase tracking-signage">Fahrer erstellen</p>
            </button>
          </div>
        </div>

        {inactiveDrivers.length > 0 && (
          <div className="bg-panel/50 p-4 rounded-xl border border-line/50">
            <p className="text-xs text-muted uppercase tracking-signage mb-3">Abwesend — automatisch ausgeblendet</p>
            <div className="flex flex-wrap gap-2">
              {inactiveDrivers.map(d => (
                <span key={d.id} className="px-3 py-1.5 bg-asphalt border border-line rounded-lg text-xs text-muted line-through">{d.name}</span>
              ))}
            </div>
          </div>
        )}

        {showCreateDriver && (
          <div className="fixed inset-0 z-30 flex items-center justify-center p-4" onClick={() => setShowCreateDriver(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-panel rounded-2xl w-full max-w-md border border-line shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold tracking-signage uppercase">Neuer Fahrer</h2>
                <button onClick={() => setShowCreateDriver(false)} className="p-2 hover:bg-asphalt rounded-lg transition text-muted">✕</button>
              </div>
              
              {createdDriverInfo ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-emerald-400 font-bold mb-2">✅ Fahrer erstellt!</p>
                    <p className="text-sm text-cream mb-1">E-Mail: <span className="font-mono">{createdDriverInfo.email}</span></p>
                    <p className="text-sm text-cream">Temp. Passwort: <span className="font-mono text-amber">{createdDriverInfo.tempPassword}</span></p>
                  </div>
                  <button onClick={() => { setCreatedDriverInfo(null); setShowCreateDriver(false); }} className="w-full py-3 bg-amber text-asphalt rounded-xl font-bold hover:bg-amber/90 transition">
                    Schließen
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-signage mb-1.5">Name *</label>
                    <input value={newDriverName} onChange={e => setNewDriverName(e.target.value)} className="w-full p-3 bg-asphalt border border-line rounded-lg text-cream outline-none focus:border-amber" placeholder="Max Mustermann" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-signage mb-1.5">E-Mail *</label>
                    <input type="email" value={newDriverEmail} onChange={e => setNewDriverEmail(e.target.value)} className="w-full p-3 bg-asphalt border border-line rounded-lg text-cream outline-none focus:border-amber" placeholder="fahrer@firma.de" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted uppercase tracking-signage mb-1.5">Telefon</label>
                    <input type="tel" value={newDriverPhone} onChange={e => setNewDriverPhone(e.target.value)} className="w-full p-3 bg-asphalt border border-line rounded-lg text-cream outline-none focus:border-amber" placeholder="+49..." />
                  </div>
                  {error && <p className="text-sm text-alert">⚠️ {error}</p>}
                  <button onClick={handleCreateDriver} className="w-full py-3 bg-amber text-asphalt rounded-xl font-bold hover:bg-amber/90 transition shadow-lamp">
                    Fahrer erstellen & Zugangsdaten anzeigen
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showAddTrip && (
          <QuickTripForm 
            drivers={activeDrivers} 
            vehicles={setup.vehicles} 
            passengers={loadPassengers()}
            editingTrip={editingTrip}
            onAdd={handleAddTrip} 
            onClose={() => { setShowAddTrip(false); setEditingTrip(null); }}
          />
        )}

        {reassigningTrip && (
          <ReassignModal
            trip={reassigningTrip}
            drivers={activeDrivers}
            onReassign={(tripId, driverId, driverName) => {
              updateTrip(tripId, { driverId, driverName }, activeUser?.companyId);
              setTrips(loadTrips(activeUser?.companyId));
              setReassigningTrip(null);
            }}
            onClose={() => setReassigningTrip(null)}
          />
        )}

        {showDriverDetail && (
          <DriverDetailModal 
            driver={setup.drivers.find(d => d.id === showDriverDetail)!}
            trips={trips.filter(t => t.driverId === showDriverDetail)}
            onClose={() => setShowDriverDetail(null)}
            onToggleActive={() => toggleDriverActive(showDriverDetail)}
          />
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-signage uppercase text-cream">Fahrten-Übersicht</h2>
            <div className="bg-panel p-1 rounded-lg border border-line flex">
              {([{ key: "today", label: "Heute" }, { key: "tomorrow", label: "Morgen" }, { key: "upcoming", label: "Kommend" }] as const).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-signage ${filter === f.key ? "bg-amber text-asphalt" : "text-muted hover:text-cream"}`}>{f.label}</button>
              ))}
            </div>
          </div>
          {filteredTrips.length === 0 ? (
            <div className="text-center py-12 bg-panel rounded-xl border border-line"><p className="text-4xl mb-3">📅</p><p className="text-muted font-medium">Keine Fahrten für diesen Zeitraum</p></div>
          ) : (
            <div className="space-y-3">
              {filteredTrips.map(trip => (
                <div key={trip.id} className="bg-panel p-4 rounded-xl border border-line hover:border-amber/30 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold text-amber font-mono">{trip.pickupTime}</p>
                        <StatusBadge status={trip.status} />
                      </div>
                      <div>
                        <p className="font-bold text-cream">{trip.customerName}</p>
                        <p className="text-sm text-muted">{trip.pickupAddress} → {trip.destination}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                          {trip.driverName && <span>👤 {trip.driverName}</span>}
                          {trip.vehicleLabel && <span>🚖 {trip.vehicleLabel}</span>}
                          {trip.prebooked && <span className="text-amber">📅 Vorbestellung</span>}
                        </div>
                      </div>
                    </div>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.pickupAddress)}`} target="_blank" rel="noreferrer" className="p-2 bg-asphalt rounded-lg border border-line hover:border-amber/50 transition text-lg">🗺️</a>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
                    <button onClick={() => handleEditTrip(trip)} className="px-3 py-1.5 bg-amber/10 text-amber rounded-lg text-xs font-bold hover:bg-amber/20 transition">
                      Bearbeiten
                    </button>
                    <button onClick={() => handleReassignTrip(trip)} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition">
                      Fahrer wechseln
                    </button>
                    <button onClick={() => handleDeleteTrip(trip.id)} className="px-3 py-1.5 bg-alert/10 text-alert rounded-lg text-xs font-bold hover:bg-alert/20 transition">
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <BrandFooter />
      </main>
    </div>
  );
}

function QuickTripForm({ drivers, vehicles, passengers, editingTrip, onAdd, onClose }: {
  drivers: CompanyDriver[];
  vehicles: CompanyVehicle[];
  passengers: SavedPassenger[];
  editingTrip: Trip | null;
  onAdd: (trip: Trip) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    customerName: editingTrip?.customerName || "",
    phoneNumber: editingTrip?.phoneNumber || "",
    pickupAddress: editingTrip?.pickupAddress || "",
    destination: editingTrip?.destination || "",
    pickupTime: editingTrip?.pickupTime || "",
    dueTime: editingTrip?.dueTime || "",
    date: editingTrip?.date || todayKey(),
    driverId: editingTrip?.driverId || "",
    vehicleId: editingTrip?.vehicleId || "",
    notes: editingTrip?.notes || "",
    prebooked: editingTrip?.prebooked || false,
    wheelchair: editingTrip?.wheelchair || false,
  });

  const handlePassengerSelect = (id: string) => {
    const p = passengers.find(x => x.id === id);
    if (p) setForm(prev => ({ ...prev, customerName: p.name, pickupAddress: p.pickupAddress, destination: p.destination }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const driver = drivers.find(d => d.id === form.driverId);
    const vehicle = vehicles.find(v => v.id === form.vehicleId);
    const trip: Trip = {
      id: editingTrip?.id || createTripId(),
      date: form.date,
      pickupTime: form.pickupTime,
      dueTime: form.dueTime,
      bookingTime: editingTrip?.bookingTime || "",
      customerName: form.customerName,
      phoneNumber: form.phoneNumber,
      pickupAddress: form.pickupAddress,
      destination: form.destination,
      wheelchair: form.wheelchair,
      prebooked: form.prebooked,
      price: editingTrip?.price || "",
      notes: form.notes,
      status: editingTrip?.status || "geplant",
      createdAt: editingTrip?.createdAt || Date.now(),
      driverId: form.driverId || undefined,
      vehicleId: form.vehicleId || undefined,
      driverName: driver?.name,
      vehicleLabel: vehicle?.registration || vehicle?.label,
      passengerCount: editingTrip?.passengerCount || 1,
      serviceType: editingTrip?.serviceType || "standard",
    };
    onAdd(trip);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-panel rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-line shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-panel border-b border-line p-5 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="font-display text-xl font-bold tracking-signage uppercase">{editingTrip ? "Fahrt bearbeiten" : "Neue Fahrt"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-asphalt rounded-lg transition text-muted">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {passengers.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-signage mb-1.5">Stammkunde (optional)</label>
              <select onChange={e => handlePassengerSelect(e.target.value)} className="w-full p-3 bg-asphalt border border-line rounded-lg text-cream outline-none focus:border-amber">
                <option value="">— Stammkunde wählen —</option>
                {passengers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.frequency === "daily" ? "Täglich" : p.frequency === "weekly" ? "Wöchentlich" : "Gelegentlich"})</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-signage mb-1.5">Kundenname *</label>
              <input required value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} className="w-full p-3 bg-asphalt border border-line rounded-lg text-cream outline-none focus:border-amber" placeholder="Max Mustermann" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-signage mb-1.5">Telefon</label>
              <input type="tel" value={form.phoneNumber} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))} className="w-full p-3 bg-asphalt border border-line rounded-lg text-cream outline-none focus:border-amber" placeholder="+49..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-signage mb-1.5">Datum *</label>
              <input required type="date" value={form.date} onChange={e => set
