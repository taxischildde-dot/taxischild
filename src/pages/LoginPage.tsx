import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Field, Input } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { seedDemoAndLogin } from '../seed/demoData';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-asphalt-950 px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-400 text-3xl font-black text-asphalt-950 shadow-[0_8px_24px_rgba(226,149,42,0.4)]">
            TS
          </div>
          <h1 className="font-display text-2xl font-extrabold text-cream-100">TaxiSchild</h1>
          <p className="mt-1 text-sm text-cream-100/50">Das digitale Fahrtenbuch für Ihr Unternehmen</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-cream-200 p-6 shadow-2xl">
          <Field label="E-Mail-Adresse">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@firma.de"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Passwort">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>
          {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
          <Button type="submit" fullWidth size="lg">
            Anmelden
          </Button>
        </form>

        <button
          onClick={seedDemoAndLogin}
          className="mt-4 w-full rounded-2xl border border-cream-100/15 bg-cream-100/5 py-3.5 text-sm font-bold text-cream-100/80 transition hover:bg-cream-100/10"
        >
          Mit Beispieldaten testen
        </button>

        <p className="mt-6 text-center text-sm text-cream-100/50">
          Neues Unternehmen?{' '}
          <Link to="/register" className="font-bold text-amber-400">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
