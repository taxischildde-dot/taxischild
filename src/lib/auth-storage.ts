import { loadSetup, saveSetup } from "./setup-storage";
export type AccountRole = "owner" | "driver";

export type CompanyVehicle = {
  id: string;
  label: string;
  registration: string;
  notes: string;
};

export type CompanyDriver = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  active: boolean;
};

export type AccountProfile = {
  companyName: string;
  vehicleNumber: string;
  driverName: string;
  companyId: string;
  role: AccountRole;
  inviteCode: string;
  vehicles: CompanyVehicle[];
  drivers: CompanyDriver[];
};

export type UserAccount = {
  id: string;
  email: string;
  password: string;
  createdAt: number;
} & AccountProfile;

type AuthSession = {
  userId: string;
  email: string;
  companyName: string;
  vehicleNumber: string;
  driverName: string;
  companyId: string;
  role: AccountRole;
  inviteCode: string;
  vehicles: CompanyVehicle[];
  drivers: CompanyDriver[];
  createdAt: number;
};

const USERS_KEY = "taxiFlotte.auth.users";
const SESSION_KEY = "taxiFlotte.auth.session";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createInviteCode(): string {
  return `TX-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createVehicle(registration: string): CompanyVehicle {
  return {
    id: createId("vehicle"),
    label: registration || "Fahrzeug 1",
    registration: registration || "",
    notes: "",
  };
}

function createDriver(name: string): CompanyDriver {
  return {
    id: createId("driver"),
    name: name || "Hauptfahrer",
    email: "",
    phone: "",
    active: true,
  };
}

export function getAllUsers(): UserAccount[] {
  return readStorage(USERS_KEY, []);
}

export function getActiveUser(): UserAccount | null {
  const session = readStorage<AuthSession | null>(SESSION_KEY, null);
  if (!session) return null;
  const users = getAllUsers();
  return users.find((user) => user.id === session.userId) ?? null;
}

export function getCompanyUsers(companyId?: string): UserAccount[] {
  const scope = companyId ?? getActiveUser()?.companyId;
  if (!scope) return [];
  return getAllUsers().filter((user) => user.companyId === scope);
}

export function registerAccount(input: {
  email: string;
  password: string;
  companyName?: string;
  vehicleNumber?: string;
  driverName?: string;
  inviteCode?: string;
  role?: AccountRole;
}): { ok: boolean; user?: UserAccount; error?: string } {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const companyName = (input.companyName ?? "").trim();
  const vehicleNumber = (input.vehicleNumber ?? "").trim();
  const driverName = (input.driverName ?? "").trim();
  const inviteCodeInput = (input.inviteCode ?? "").trim();
  const role = input.role === "driver" ? "driver" : "owner";

  if (!email || !password) {
    return { ok: false, error: "E-Mail und Passwort sind erforderlich." };
  }

  const users = getAllUsers();
  if (users.some((user) => user.email === email)) {
    return { ok: false, error: "Diese E-Mail ist bereits registriert." };
  }

  if (role === "driver") {
    const owner = users.find(
      (candidate) => candidate.role === "owner" && candidate.inviteCode.toLowerCase() === inviteCodeInput.toLowerCase()
    );

    if (!owner) {
      return { ok: false, error: "Einladungscode ist ungültig oder nicht vorhanden." };
    }

    const user: UserAccount = {
      id: createId("tenant"),
      email,
      password,
      createdAt: Date.now(),
      companyName: owner.companyName,
      vehicleNumber: owner.vehicleNumber,
      driverName: driverName || owner.driverName,
      companyId: owner.companyId,
      role: "driver",
      inviteCode: owner.inviteCode,
      vehicles: owner.vehicles,
      drivers: owner.drivers,
    };

    const nextUsers = [...users, user];
    const nextOwnerDrivers = [...owner.drivers, createDriver(driverName || email)];
    const nextUsersWithOwner = nextUsers.map((candidate) =>
      candidate.id === owner.id ? { ...candidate, drivers: nextOwnerDrivers } : candidate
    );

    writeStorage(USERS_KEY, nextUsersWithOwner);
    writeStorage(SESSION_KEY, {
      userId: user.id,
      email: user.email,
      companyName: user.companyName,
      vehicleNumber: user.vehicleNumber,
      driverName: user.driverName,
      companyId: user.companyId,
      role: user.role,
      inviteCode: user.inviteCode,
      vehicles: user.vehicles,
      drivers: user.drivers,
      createdAt: user.createdAt,
    });

    return { ok: true, user };
  }

  const companyId = createId("company");
  const inviteCode = createInviteCode();
  const user: UserAccount = {
    id: createId("tenant"),
    email,
    password,
    createdAt: Date.now(),
    companyName: companyName || "TaxiSchild Betrieb",
    vehicleNumber,
    driverName: driverName || companyName || "Hauptfahrer",
    companyId,
    role: "owner",
    inviteCode,
    vehicles: vehicleNumber ? [createVehicle(vehicleNumber)] : [],
    drivers: driverName || companyName ? [createDriver(driverName || companyName || "Hauptfahrer")] : [],
  };

  const nextUsers = [...users, user];
  writeStorage(USERS_KEY, nextUsers);
  writeStorage(SESSION_KEY, {
    userId: user.id,
    email: user.email,
    companyName: user.companyName,
    vehicleNumber: user.vehicleNumber,
    driverName: user.driverName,
    companyId: user.companyId,
    role: user.role,
    inviteCode: user.inviteCode,
    vehicles: user.vehicles,
    drivers: user.drivers,
    createdAt: user.createdAt,
  });

  return { ok: true, user };
}

export function signIn(input: { email: string; password: string }): { ok: boolean; user?: UserAccount; error?: string } {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!email || !password) {
    return { ok: false, error: "Bitte E-Mail und Passwort eingeben." };
  }

  const user = getAllUsers().find((candidate) => candidate.email === email);
  if (!user || user.password !== password) {
    return { ok: false, error: "E-Mail oder Passwort ist ungültig." };
  }

  writeStorage(SESSION_KEY, {
    userId: user.id,
    email: user.email,
    companyName: user.companyName,
    vehicleNumber: user.vehicleNumber,
    driverName: user.driverName,
    companyId: user.companyId,
    role: user.role,
    inviteCode: user.inviteCode,
    vehicles: user.vehicles,
    drivers: user.drivers,
    createdAt: user.createdAt,
  });

  return { ok: true, user };
}

export function updateUserProfile(userId: string, profile: Partial<AccountProfile>) {
  const users = getAllUsers();
  const nextUsers = users.map((user) => (user.id === userId ? { ...user, ...profile } : user));
  writeStorage(USERS_KEY, nextUsers);

  const session = readStorage<AuthSession | null>(SESSION_KEY, null);
  if (session?.userId === userId) {
    writeStorage(SESSION_KEY, {
      ...session,
      ...profile,
    });
  }
}

export function signOut() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getTenantStorageScope(tenantId?: string): string {
  const activeUser = getActiveUser();
  return tenantId ?? activeUser?.companyId ?? activeUser?.id ?? "default";
}

// ========== DRIVER MANAGEMENT BY OWNER ==========

const TEMP_PASSWORD_PREFIX = "TX-TEMP-";

export function generateTempPassword(): string {
  return `${TEMP_PASSWORD_PREFIX}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function createDriverAccount(input: {
  ownerId: string;
  email: string;
  name: string;
  phone?: string;
  tempPassword: string;
}): { ok: boolean; user?: UserAccount; error?: string } {
  const owner = getAllUsers().find((u) => u.id === input.ownerId && u.role === "owner");
  if (!owner) {
    return { ok: false, error: "Nur Unternehmer können Fahrer erstellen." };
  }

  const email = normalizeEmail(input.email);
  if (!email || !input.tempPassword) {
    return { ok: false, error: "E-Mail und Passwort sind erforderlich." };
  }

  const users = getAllUsers();
  if (users.some((user) => user.email === email)) {
    return { ok: false, error: "Diese E-Mail ist bereits registriert." };
  }

  const driverUser: UserAccount = {
    id: createId("driver"),
    email,
    password: input.tempPassword,
    createdAt: Date.now(),
    companyName: owner.companyName,
    vehicleNumber: "",
    driverName: input.name,
    companyId: owner.companyId,
    role: "driver",
    inviteCode: owner.inviteCode,
    vehicles: owner.vehicles,
    drivers: owner.drivers,
  };

  const newDriver: CompanyDriver = {
    id: createId("driver-profile"),
    name: input.name,
    email,
    phone: input.phone || "",
    active: true,
  };

  const nextUsers = [...users, driverUser];
  const nextOwnerDrivers = [...owner.drivers, newDriver];
  const nextUsersWithOwner = nextUsers.map((candidate) =>
    candidate.id === owner.id ? { ...candidate, drivers: nextOwnerDrivers } : candidate
  );

   writeStorage(USERS_KEY, nextUsersWithOwner);

  const setup = loadSetup(owner.companyId);
  const updatedSetup = {
    ...setup,
    drivers: [...setup.drivers, newDriver]
  };
  saveSetup(updatedSetup, owner.companyId);

  return { ok: true, user: driverUser };
}

export function changePassword(input: {
  userId: string;
  oldPassword: string;
  newPassword: string;
}): { ok: boolean; error?: string } {
  const users = getAllUsers();
  const user = users.find((u) => u.id === input.userId);
  if (!user) return { ok: false, error: "Benutzer nicht gefunden." };
  if (user.password !== input.oldPassword) {
    return { ok: false, error: "Altes Passwort ist falsch." };
  }
  if (!input.newPassword || input.newPassword.length < 4) {
    return { ok: false, error: "Neues Passwort muss mindestens 4 Zeichen haben." };
  }

  const nextUsers = users.map((u) => (u.id === input.userId ? { ...u, password: input.newPassword } : u));
  writeStorage(USERS_KEY, nextUsers);

  const session = readStorage<AuthSession | null>(SESSION_KEY, null);
  if (session?.userId === input.userId) {
    writeStorage(SESSION_KEY, { ...session, password: input.newPassword });
  }

  return { ok: true };
}

export function isTempPassword(password: string): boolean {
  return password.startsWith(TEMP_PASSWORD_PREFIX);
}
