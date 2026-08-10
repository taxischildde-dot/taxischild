import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveUser } from "../lib/auth-storage";
import { loadTrips, Trip } from "../lib/trips-storage";
import { loadNotifications, Notification, markNotificationRead, markAllNotificationsRead } from "../lib/notifications-storage";
import { loadPassengers, SavedPassenger } from "../lib/passengers-storage";
import StatusBadge from "../components/StatusBadge";
import BrandFooter from "../components/BrandFooter";

export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState(getActiveUser());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [passengers, setPassengers] = useState<SavedPassenger[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filter, setFilter] = useState<"today" | "tomorrow" | "upcoming">("today");

  useEffect(() => {
    const user = getActiveUser();
    if (!user) { navigate("/login", { replace: true }); return; }
    if (user.role === "owner") { navigate("/dashboard", { replace: true }); return; }
    setActiveUser(user);
    const allTrips = loadTrips();
    const myTrips = allTrips.filter(t => t.driverId === user.id || t.driverName === user.driverName);
    setTrips(myTrips);
    setNotifications(loadNotifications().filter(n => n.userId === user.id));
    setPassengers(loadPassengers());
  }, [navigate]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

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

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const handleMarkAllRead = () => {
    if (!activeUser) return;
    markAllNotificationsRead(activeUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!activeUser) return null;

  return (
    <div className="min-h-dvh bg-asphalt text-cream font-body">
      <header className="sticky top-0 z-20 bg-panel/95 backdrop-blur border-b border-line">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-signage uppercase text-cream">Fahrer-App</h1>
            <p className="text-sm text-muted mt-0.5">{activeUser.driverName} · {activeUser.companyName}</p>
          </div>
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 rounded-lg hover:bg-asphalt transition active:scale-95 text-xl">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-alert text-cream text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-panel animate-pulse">{unreadCount}</span>
            )}
          </button>
        </div>
      </header>

      {showNotifications && (
        <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 h-full w-80 bg-panel border-l border-line shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-panel border-b border-line p-4 flex items-center justify-between z-10">
              <h2 className="font-display text-xl font-bold tracking-signage">Benachrichtigungen</h2>
              <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-asphalt rounded-lg transition text-muted">✕</button>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="m-4 w-full py-2.5 text-sm font-semibold bg-amber/10 text-amber border border-amber/20 rounded-lg hover:bg-amber/20 transition">✅ Alle als gelesen markieren</button>
            )}
            <div className="p-4 space-y-3">
              {notifications.length === 0 ? <p className="text-muted text-center py-8">Keine Benachrichtigungen</p> : notifications.map(notif => (
                <div key={notif.id} onClick={() => handleMarkRead(notif.id)} className={`p-4 rounded-xl border-r-4 cursor-pointer transition ${notif.read ? "bg-asphalt border-muted opacity-60" : "bg-amber/5 border-amber shadow-sm"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 text-lg ${notif.type === "new_trip" || notif.type === "assigned_trip" ? "bg-emerald-500/10 text-emerald-400" : notif.type === "cancelled_trip" ? "bg-alert/10 text-alert" : "bg-amber/10 text-amber"}`}>
                      {notif.type === "new_trip" && "➕"}{notif.type === "assigned_trip" && "🧭"}{notif.type === "cancelled_trip" && "⚠️"}{notif.type === "updated_trip" && "🕐"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cream leading-snug">{notif.message}</p>
                      <p className="text-xs text-muted mt-1">{new Date(notif.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-amber rounded-full mt-2 shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Heute", value: trips.filter(t => t.date === new Date().toISOString().split("T")[0] && t.status !== "storniert").length, color: "text-emerald-400" },
            { label: "Aktiv", value: trips.filter(t => t.status === "aktiv").length, color: "text-amber" },
            { label: "Erledigt", value: trips.filter(t => t.status === "erledigt").length, color: "text-muted" },
          ].map(stat => (
            <div key={stat.label} className="bg-panel p-4 rounded-xl border border-line text-center hover:border-amber/30 transition">
              <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted font-medium mt-1 uppercase tracking-signage">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-panel p-1.5 rounded-xl border border-line flex">
          {([{ key: "today", label: "Heute" }, { key: "tomorrow", label: "Morgen" }, { key: "upcoming", label: "Kommend" }] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all uppercase tracking-signage ${filter === f.key ? "bg-amber text-asphalt shadow-lamp" : "text-muted hover:text-cream hover:bg-asphalt"}`}>{f.label}</button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-signage uppercase text-cream">Fahrten</h2>
            <span className="text-xs text-muted bg-asphalt px-2 py-1 rounded-lg border border-line">{filteredTrips.length} Fahrt{filteredTrips.length !== 1 ? "en" : ""}</span>
          </div>
          {filteredTrips.length === 0 ? (
            <div className="text-center py-16 bg-panel rounded-2xl border border-line"><p className="text-4xl mb-4">📅</p><p className="text-muted font-medium">Keine Fahrten für diesen Zeitraum</p></div>
          ) : filteredTrips.map(trip => (
            <div key={trip.id} className="bg-panel p-5 rounded-xl border border-line hover:border-amber/30 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber to-amberDim rounded-xl flex items-center justify-center text-asphalt font-bold text-lg font-display shadow-lamp">{trip.customerName.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="font-bold text-cream text-base">{trip.customerName}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap"><StatusBadge status={trip.status} />{trip.prebooked && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber/10 text-amber border border-amber/20 uppercase tracking-signage">Vorbestellung</span>}</div>
                  </div>
                </div>
                <div className="text-right bg-asphalt px-3 py-2 rounded-lg border border-line"><p className="text-xl font-bold text-amber font-mono">{trip.pickupTime}</p></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm"><div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-lg">📍</div><div><p className="text-xs text-muted uppercase tracking-signage">Abholung</p><p className="text-cream font-medium">{trip.pickupAddress}</p></div></div>
                <div className="flex items-center gap-3 text-sm"><div className="w-8 h-8 rounded-lg bg-alert/10 flex items-center justify-center shrink-0 text-lg">🧭</div><div><p className="text-xs text-muted uppercase tracking-signage">Ziel</p><p className="text-cream font-medium">{trip.destination}</p></div></div>
                {trip.phoneNumber && <div className="flex items-center gap-4 pt-2 border-t border-line"><a href={`tel:${trip.phoneNumber}`} className="flex items-center gap-1.5 text-sm text-amber hover:underline">📞 {trip.phoneNumber}</a></div>}
                {trip.notes && <div className="flex items-start gap-3 p-3 bg-amber/5 border border-amber/10 rounded-lg"><span className="text-lg">⚠️</span><p className="text-sm text-amber/90 font-medium">{trip.notes}</p></div>}
              </div>
            </div>
          ))}
        </div>

        {passengers.length > 0 && (
          <div className="bg-panel rounded-xl border border-line p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold tracking-signage uppercase text-cream">Stammkunden</h2>
              <span className="text-xs text-muted bg-asphalt px-2 py-1 rounded-lg border border-line">{passengers.length}</span>
            </div>
            <div className="space-y-2">
              {passengers.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-asphalt rounded-lg border border-line hover:border-amber/30 transition">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-panel rounded-full flex items-center justify-center border border-line text-lg">👤</div><div><p className="font-bold text-cream text-sm">{p.name}</p><p className="text-xs text-muted">{p.pickupAddress}</p></div></div>
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-signage ${p.frequency === "daily" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber/10 text-amber"}`}>{p.frequency === "daily" ? "Täglich" : p.frequency === "weekly" ? "Wöchentlich" : "Gelegentlich"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <BrandFooter />
      </main>
    </div>
  );
}
