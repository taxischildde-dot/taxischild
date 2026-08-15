import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Field, Input } from '../components/ui/Field';
import { Button } from '../components/ui/Button';

export default function RegisterPage() {
  const { registerCompany } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('Das Passwort muss mindestens 4 Zeichen lang sein');
      return;
    }
    const result = registerCompany({ companyName, adminName, email, password, phone });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-asphalt-950 px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-extrabold text-cream-100">Unternehmen registrieren</h1>
          <p className="mt-1 text-sm text-cream-100/50">
            Ihre Daten und die Ihrer Fahrer sind vollständig von anderen Unternehmen getrennt
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-cream-200 p-6 shadow-2xl">
          <Field label="Firmenname" required>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Taxi GmbH" required />
          </Field>
          <Field label="Ihr Name (Geschäftsführung)" required>
            <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Vor- und Nachname" required />
          </Field>
          <Field label="E-Mail-Adresse" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@firma.de" required />
          </Field>
          <Field label="Telefonnummer" hint="optional">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0170-1234567" />
          </Field>
          <Field label="Passwort" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </Field>
          {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
          <Button type="submit" fullWidth size="lg">
            Konto erstellen &amp; starten
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-cream-100/50">
          Bereits registriert?{' '}
          <Link to="/login" className="font-bold text-amber-400">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
