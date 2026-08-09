export type AccountProfile = {
  companyName: string;
  vehicleNumber: string;
  driverName: string;
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

export function getAllUsers(): UserAccount[] {
  return readStorage<UserAccount[]>(USERS_KEY, []);
}

export function getActiveUser(): UserAccount | null {
  const session = readStorage<AuthSession | null>(SESSION_KEY, null);
  if (!session) return null;
  const users = getAllUsers();
  return users.find((user) => user.id === session.userId) ?? null;
}

export function registerAccount(input: {
  email: string;
  password: string;
  companyName?: string;
  vehicleNumber?: string;
  driverName?: string;
}): { ok: boolean; user?: UserAccount; error?: string } {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const companyName = (input.companyName ?? "").trim();
  const vehicleNumber = (input.vehicleNumber ?? "").trim();
  const driverName = (input.driverName ?? "").trim();

  if (!email || !password) {
    return { ok: false, error: "E-Mail und Passwort sind erforderlich." };
  }

  const users = getAllUsers();
  if (users.some((user) => user.email === email)) {
    return { ok: false, error: "Diese E-Mail ist bereits registriert." };
  }

  const user: UserAccount = {
    id: `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    password,
    companyName,
    vehicleNumber,
    driverName,
    createdAt: Date.now(),
  };

  const nextUsers = [...users, user];
  writeStorage(USERS_KEY, nextUsers);
  writeStorage(SESSION_KEY, {
    userId: user.id,
    email: user.email,
    companyName: user.companyName,
    vehicleNumber: user.vehicleNumber,
    driverName: user.driverName,
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
    createdAt: user.createdAt,
  });

  return { ok: true, user };
}

export function updateUserProfile(userId: string, profile: AccountProfile) {
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
  return tenantId ?? activeUser?.id ?? "default";
}
