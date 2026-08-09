export type AccountRole = "owner" | "driver";

export type DriverStatus = "available" | "busy" | "resting" | "offday" | "sick";

export type CompanyVehicle = {
  id: string;
  label: string;
  registration: string;
  notes: string;
};

export type CompanyDriver = {
  id: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  status: DriverStatus;
  offDates: string[];
};

export type AccountProfile = {
  companyName: string;
  vehicleNumber: string;
  driverName: string;
  companyId: string;
  role: AccountRole;
  inviteCode: string;
  inviteCodeUsed: boolean;
  vehicles: CompanyVehicle[];
  drivers: CompanyDriver[];
  defaultVehicleId?: string;
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
  inviteCodeUsed: boolean;
  vehicles: CompanyVehicle[];
  drivers: CompanyDriver[];
  defaultVehicleId?: string;
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

function createVehicle(label: string, registration: string): CompanyVehicle {
  return {
    id: createId("vehicle"),
    label: label || "Fahrzeug 1",
    registration: registration || "",
    notes: "",
  };
}

function createDriver(name: string, email = "", phone = ""): CompanyDriver {
  return {
    id: createId("driver"),
    name: name || "Hauptfahrer",
    email,
    phone,
    active: true,
    status: "available",
    offDates: [],
  };
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
      (candidate) =>
        candidate.role === "owner" &&
        !candidate.inviteCodeUsed &&
        candidate.inviteCode.toLowerCase() === inviteCodeInput.toLowerCase()
    );

    if (!owner) {
      return { ok: false, error: "Einladungscode ist ungültig oder wurde bereits verwendet." };
    }

    const driverCompanyName = owner.companyName || companyName || "TaxiSchild Betrieb";
    const user: UserAccount = {
      id: createId("tenant"),
      email,
      password,
      createdAt: Date.now(),
      companyName: driverCompanyName,
      vehicleNumber: owner.vehicleNumber || vehicleNumber,
      driverName: driverName || owner.driverName || email,
      companyId: owner.companyId,
      role: "driver",
      inviteCode: "",
      inviteCodeUsed: true,
      vehicles: owner.vehicles,
      drivers: owner.drivers,
      defaultVehicleId: owner.defaultVehicleId,
    };

    const nextUsers = [...users, user];
    const nextOwner = {
      ...owner,
      inviteCodeUsed: true,
      inviteCode: "",
      drivers: [...owner.drivers, createDriver(driverName || email, email)],
    };
    const nextUsersWithOwner = nextUsers.map((candidate) =>
      candidate.id === owner.id ? nextOwner : candidate
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
      inviteCodeUsed: user.inviteCodeUsed,
      vehicles: user.vehicles,
      drivers: user.drivers,
      defaultVehicleId: user.defaultVehicleId,
      createdAt: user.createdAt,
    });

    return { ok: true, user };
  }

  const companyId = createId("company");
  const inviteCode = createInviteCode();
  const ownerVehicles = vehicleNumber ? [createVehicle(vehicleNumber, vehicleNumber)] : [];
  const ownerDrivers = driverName ? [createDriver(driverName, email)] : [];
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
    inviteCodeUsed: false,
    vehicles: ownerVehicles,
    drivers: ownerDrivers,
    defaultVehicleId: ownerVehicles[0]?.id,
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
    inviteCodeUsed: user.inviteCodeUsed,
    vehicles: user.vehicles,
    drivers: user.drivers,
    defaultVehicleId: user.defaultVehicleId,
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
    inviteCodeUsed: user.inviteCodeUsed,
    vehicles: user.vehicles,
    drivers: user.drivers,
    defaultVehicleId: user.defaultVehicleId,
    createdAt: user.createdAt,
  });

  return { ok: true, user };
}

export function updateUserProfile(userId: string, profile: Omit<AccountProfile, "companyId" | "role" | "inviteCode" | "inviteCodeUsed" | "vehicles" | "drivers" | "defaultVehicleId">) {
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
