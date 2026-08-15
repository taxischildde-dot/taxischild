// Lokale "Datenbank" für TaxiSchild.
// Jede Funktion hier ist die einzige Schnittstelle zur Speicherschicht — bei
// einer späteren Anbindung an Supabase o. ä. genügt es, ausschließlich den
// Inhalt dieser Datei zu ersetzen (gleiche Signaturen, gleiche Typen), ohne
// eine einzige Seite oder Komponente der App anzufassen.

import type { Company, User, Trip, Vehicle, DailyLog } from '../types';
import { readAll, writeAll, uid } from './storage';

const KEYS = {
  companies: 'companies',
  users: 'users',
  trips: 'trips',
  vehicles: 'vehicles',
  dailyLogs: 'dailyLogs',
} as const;

export const db = {
  companies: {
    all: (): Company[] => readAll<Company>(KEYS.companies),
    get: (id: string): Company | undefined => db.companies.all().find((c) => c.id === id),
    create: (name: string): Company => {
      const company: Company = { id: uid('co'), name, createdAt: new Date().toISOString() };
      writeAll(KEYS.companies, [...db.companies.all(), company]);
      return company;
    },
    update: (id: string, patch: Partial<Company>): Company | undefined => {
      const all = db.companies.all();
      const idx = all.findIndex((c) => c.id === id);
      if (idx === -1) return undefined;
      all[idx] = { ...all[idx], ...patch };
      writeAll(KEYS.companies, all);
      return all[idx];
    },
  },

  users: {
    all: (): User[] => readAll<User>(KEYS.users),
    byCompany: (companyId: string): User[] => db.users.all().filter((u) => u.companyId === companyId),
    byEmail: (email: string): User | undefined =>
      db.users.all().find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),
    get: (id: string): User | undefined => db.users.all().find((u) => u.id === id),
    getForCompany: (companyId: string, id: string): User | undefined =>
      db.users.all().find((u) => u.id === id && u.companyId === companyId),
    create: (user: Omit<User, 'id' | 'createdAt'>): User => {
      const newUser: User = { ...user, id: uid('usr'), createdAt: new Date().toISOString() };
      writeAll(KEYS.users, [...db.users.all(), newUser]);
      return newUser;
    },
    update: (id: string, patch: Partial<User>): User | undefined => {
      const all = db.users.all();
      const idx = all.findIndex((u) => u.id === id);
      if (idx === -1) return undefined;
      all[idx] = { ...all[idx], ...patch };
      writeAll(KEYS.users, all);
      return all[idx];
    },
    updateForCompany: (companyId: string, id: string, patch: Partial<User>): User | undefined => {
      const current = db.users.getForCompany(companyId, id);
      return current ? db.users.update(id, patch) : undefined;
    },
  },

  trips: {
    all: (): Trip[] => readAll<Trip>(KEYS.trips),
    byCompany: (companyId: string): Trip[] =>
      db.trips
        .all()
        .filter((t) => t.companyId === companyId)
        .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
    byDriver: (companyId: string, driverId: string): Trip[] =>
      db.trips.byCompany(companyId).filter((t) => t.driverId === driverId),
    unassigned: (companyId: string): Trip[] =>
      db.trips.byCompany(companyId).filter((t) => !t.driverId && t.status !== 'cancelled'),
    get: (id: string): Trip | undefined => db.trips.all().find((t) => t.id === id),
    getForCompany: (companyId: string, id: string): Trip | undefined =>
      db.trips.all().find((t) => t.id === id && t.companyId === companyId),
    create: (trip: Omit<Trip, 'id' | 'createdAt'>): Trip => {
      const newTrip: Trip = { ...trip, id: uid('trp'), createdAt: new Date().toISOString() };
      writeAll(KEYS.trips, [...db.trips.all(), newTrip]);
      return newTrip;
    },
    update: (id: string, patch: Partial<Trip>): Trip | undefined => {
      const all = db.trips.all();
      const idx = all.findIndex((t) => t.id === id);
      if (idx === -1) return undefined;
      all[idx] = { ...all[idx], ...patch };
      writeAll(KEYS.trips, all);
      return all[idx];
    },
    updateForCompany: (companyId: string, id: string, patch: Partial<Trip>): Trip | undefined => {
      const current = db.trips.getForCompany(companyId, id);
      return current ? db.trips.update(id, patch) : undefined;
    },
    remove: (id: string): void => {
      writeAll(KEYS.trips, db.trips.all().filter((t) => t.id !== id));
    },
  },

  vehicles: {
    all: (): Vehicle[] => readAll<Vehicle>(KEYS.vehicles),
    byCompany: (companyId: string): Vehicle[] => db.vehicles.all().filter((v) => v.companyId === companyId),
    get: (id: string): Vehicle | undefined => db.vehicles.all().find((v) => v.id === id),
    getForCompany: (companyId: string, id: string): Vehicle | undefined =>
      db.vehicles.all().find((v) => v.id === id && v.companyId === companyId),
    create: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Vehicle => {
      const newVehicle: Vehicle = { ...vehicle, id: uid('veh'), createdAt: new Date().toISOString() };
      writeAll(KEYS.vehicles, [...db.vehicles.all(), newVehicle]);
      return newVehicle;
    },
    update: (id: string, patch: Partial<Vehicle>): Vehicle | undefined => {
      const all = db.vehicles.all();
      const idx = all.findIndex((v) => v.id === id);
      if (idx === -1) return undefined;
      all[idx] = { ...all[idx], ...patch };
      writeAll(KEYS.vehicles, all);
      return all[idx];
    },
    updateForCompany: (companyId: string, id: string, patch: Partial<Vehicle>): Vehicle | undefined => {
      const current = db.vehicles.getForCompany(companyId, id);
      return current ? db.vehicles.update(id, patch) : undefined;
    },
    remove: (id: string): void => {
      writeAll(KEYS.vehicles, db.vehicles.all().filter((v) => v.id !== id));
    },
    removeForCompany: (companyId: string, id: string): void => {
      const current = db.vehicles.getForCompany(companyId, id);
      if (current) db.vehicles.remove(id);
    },
  },

  // Tagesdatensätze (Kilometerstände + Arbeitszeiten) — Basis für Fahrbericht & Stundenzettel
  dailyLogs: {
    all: (): DailyLog[] => readAll<DailyLog>(KEYS.dailyLogs),
    byCompany: (companyId: string): DailyLog[] => db.dailyLogs.all().filter((l) => l.companyId === companyId),
    byDriver: (companyId: string, driverId: string): DailyLog[] =>
      db.dailyLogs.byCompany(companyId).filter((l) => l.driverId === driverId),
    byDriverAndDate: (companyId: string, driverId: string, date: string): DailyLog | undefined =>
      db.dailyLogs.all().find((l) => l.companyId === companyId && l.driverId === driverId && l.date === date),
    // legt einen Eintrag an oder aktualisiert den bestehenden für (Fahrer, Datum)
    upsert: (params: {
      companyId: string;
      driverId: string;
      date: string;
      patch: Partial<Omit<DailyLog, 'id' | 'companyId' | 'driverId' | 'date' | 'createdAt' | 'updatedAt'>>;
    }): DailyLog => {
      const { companyId, driverId, date, patch } = params;
      const all = db.dailyLogs.all();
      const idx = all.findIndex((l) => l.companyId === companyId && l.driverId === driverId && l.date === date);
      const now = new Date().toISOString();
      if (idx === -1) {
        const created: DailyLog = {
          id: uid('log'),
          companyId,
          driverId,
          date,
          createdAt: now,
          updatedAt: now,
          ...patch,
        };
        writeAll(KEYS.dailyLogs, [...all, created]);
        return created;
      }
      all[idx] = { ...all[idx], ...patch, updatedAt: now };
      writeAll(KEYS.dailyLogs, all);
      return all[idx];
    },
  },

  // Vollständige Sicherung — wird auf der Einstellungen-Seite verwendet
  exportForCompany: (companyId: string) => ({
    companies: db.companies.all().filter((company) => company.id === companyId),
    users: db.users.byCompany(companyId),
    trips: db.trips.byCompany(companyId),
    vehicles: db.vehicles.byCompany(companyId),
    dailyLogs: db.dailyLogs.byCompany(companyId),
    exportedAt: new Date().toISOString(),
  }),
};
