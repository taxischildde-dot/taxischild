import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Company, User, Weekday } from '../types';
import { db } from '../lib/db';
import { readOne, writeOne, removeKey } from '../lib/storage';

interface AuthState {
  user: User | null;
  company: Company | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  registerCompany: (params: {
    companyName: string;
    adminName: string;
    email: string;
    password: string;
    phone?: string;
  }) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  addDriver: (params: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    employeeNumber?: string;
    licenseType?: string;
    workDays?: Weekday[];
  }) => { ok: true } | { ok: false; error: string };
  updateCompanyName: (name: string) => void;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'phone'>>) => void;
}

const SESSION_KEY = 'session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, company: null, loading: true });

  useEffect(() => {
    const session = readOne<{ userId: string }>(SESSION_KEY);
    if (session) {
      const user = db.users.get(session.userId);
      if (user) {
        const company = db.companies.get(user.companyId) ?? null;
        setState({ user, company, loading: false });
        return;
      }
    }
    setState({ user: null, company: null, loading: false });
  }, []);

  const login: AuthContextValue['login'] = (email, password) => {
    const user = db.users.byEmail(email);
    if (!user || user.password !== password) {
      return { ok: false, error: 'E-Mail-Adresse oder Passwort ist falsch' };
    }
    const company = db.companies.get(user.companyId) ?? null;
    writeOne(SESSION_KEY, { userId: user.id });
    setState({ user, company, loading: false });
    return { ok: true };
  };

  const registerCompany: AuthContextValue['registerCompany'] = ({
    companyName,
    adminName,
    email,
    password,
    phone,
  }) => {
    if (db.users.byEmail(email)) {
      return { ok: false, error: 'Diese E-Mail-Adresse wird bereits verwendet' };
    }
    const company = db.companies.create(companyName.trim());
    const admin = db.users.create({
      companyId: company.id,
      role: 'admin',
      name: adminName.trim(),
      email: email.trim(),
      password,
      phone,
    });
    writeOne(SESSION_KEY, { userId: admin.id });
    setState({ user: admin, company, loading: false });
    return { ok: true };
  };

  const addDriver: AuthContextValue['addDriver'] = ({
    name,
    email,
    password,
    phone,
    employeeNumber,
    licenseType,
    workDays,
  }) => {
    if (!state.company) return { ok: false, error: 'Kein aktives Unternehmen gefunden' };
    if (db.users.byEmail(email)) {
      return { ok: false, error: 'Diese E-Mail-Adresse wird bereits verwendet' };
    }
    db.users.create({
      companyId: state.company.id,
      role: 'driver',
      name: name.trim(),
      email: email.trim(),
      password,
      phone,
      employeeNumber: employeeNumber?.trim() || undefined,
      licenseType: licenseType?.trim() || undefined,
      workDays: workDays && workDays.length > 0 ? workDays : undefined,
    });
    return { ok: true };
  };

  const logout = () => {
    removeKey(SESSION_KEY);
    setState({ user: null, company: null, loading: false });
  };

  const updateCompanyName = (name: string) => {
    if (!state.company) return;
    const updated = db.companies.update(state.company.id, { name: name.trim() });
    if (updated) setState((s) => ({ ...s, company: updated }));
  };

  const updateProfile: AuthContextValue['updateProfile'] = (patch) => {
    if (!state.user) return;
    const updated = db.users.update(state.user.id, patch);
    if (updated) setState((s) => ({ ...s, user: updated }));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      registerCompany,
      logout,
      addDriver,
      updateCompanyName,
      updateProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
