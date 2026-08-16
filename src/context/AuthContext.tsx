import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Company, User, Weekday } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hydrateCompanyCache } from '../lib/cloudSync';
import { getLoginErrorMessage, getResendErrorMessage } from '../lib/authMessages';

interface AuthState {
  user: User | null;
  company: Company | null;
  loading: boolean;
}

type AuthResult = { ok: true; message?: string; inviteUrl?: string } | { ok: false; error: string };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  registerCompany: (params: {
    companyName: string;
    adminName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  addDriver: (params: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    employeeNumber?: string;
    licenseType?: string;
    workDays?: Weekday[];
  }) => Promise<AuthResult>;
  updateCompanyName: (name: string) => void;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'phone'>>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type SupabaseProfile = {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver';
  driver_number?: string | null;
  license_type?: string | null;
  working_days?: Weekday[] | null;
  availability_status?: User['availabilityStatus'] | null;
  created_at: string;
};

type SupabaseCompany = { id: string; name: string; created_at: string };

function mapCompany(row: SupabaseCompany): Company {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

function mapProfile(row: SupabaseProfile): User {
  return {
    id: row.id,
    companyId: row.company_id,
    role: row.role,
    name: row.name,
    email: row.email,
    employeeNumber: row.driver_number ?? undefined,
    licenseType: row.license_type ?? undefined,
    workDays: row.working_days ?? undefined,
    availabilityStatus: row.availability_status ?? 'available',
    createdAt: row.created_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, company: null, loading: true });

  const loadAuthenticatedUser = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profileError || !profile) {
      setState({ user: null, company: null, loading: false });
      return;
    }
    const typedProfile = profile as SupabaseProfile;
    const { data: company } = await supabase.from('companies').select('*').eq('id', typedProfile.company_id).single();
    await hydrateCompanyCache(typedProfile.company_id);
    setState({ user: mapProfile(typedProfile), company: company ? mapCompany(company as SupabaseCompany) : null, loading: false });
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ user: null, company: null, loading: false });
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user) void loadAuthenticatedUser(data.session.user.id);
      else setState({ user: null, company: null, loading: false });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) void loadAuthenticatedUser(session.user.id);
      else setState({ user: null, company: null, loading: false });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login: AuthContextValue['login'] = async (email, password) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase ist noch nicht konfiguriert' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return { ok: false, error: getLoginErrorMessage(error) };
    await loadAuthenticatedUser(data.user.id);
    return { ok: true };
  };

  const resendConfirmation: AuthContextValue['resendConfirmation'] = async (email) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase ist noch nicht konfiguriert' };
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return { ok: false, error: 'Bitte geben Sie zuerst Ihre E-Mail-Adresse ein.' };

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) return { ok: false, error: getResendErrorMessage(error) };
    return { ok: true, message: 'Eine neue Bestätigungs-E-Mail wurde versendet. Prüfen Sie bitte auch den Spam-Ordner.' };
  };

  const registerCompany: AuthContextValue['registerCompany'] = async ({ companyName, adminName, email, password }) => {
    if (!isSupabaseConfigured) return { ok: false, error: 'Supabase ist noch nicht konfiguriert' };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { company_name: companyName.trim(), name: adminName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { ok: false, error: error.message };
    if (data.session?.user) await loadAuthenticatedUser(data.session.user.id);
    return {
      ok: true,
      message: data.session ? undefined : 'Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden.',
    };
  };

  const addDriver: AuthContextValue['addDriver'] = async ({ name, email, employeeNumber, licenseType, workDays }) => {
    if (!state.company || !state.user || state.user.role !== 'admin') return { ok: false, error: 'Nur die Geschäftsführung kann Fahrer einladen' };
    const token = crypto.randomUUID();
    const { error } = await supabase.from('driver_invites').insert({
      company_id: state.company.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      token,
      status: 'pending',
    });
    if (error) return { ok: false, error: 'Die Fahrereinladung konnte nicht gespeichert werden' };
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    return { ok: true, inviteUrl, message: `Einladung erstellt für ${name.trim()}` };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState({ user: null, company: null, loading: false });
  };

  const updateCompanyName = (name: string) => {
    if (!state.company || state.user?.role !== 'admin') return;
    void supabase.from('companies').update({ name: name.trim() }).eq('id', state.company.id).then(({ error }) => {
      if (!error) setState((current) => ({ ...current, company: current.company ? { ...current.company, name: name.trim() } : null }));
    });
  };

  const updateProfile: AuthContextValue['updateProfile'] = (patch) => {
    if (!state.user) return;
    void supabase.from('profiles').update({ name: patch.name, phone: patch.phone }).eq('id', state.user.id).then(({ error }) => {
      if (!error) setState((current) => ({ ...current, user: current.user ? { ...current.user, ...patch } : null }));
    });
  };

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, resendConfirmation, registerCompany, logout, addDriver, updateCompanyName, updateProfile }),
    // The auth handlers intentionally close over the current authenticated state.
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
