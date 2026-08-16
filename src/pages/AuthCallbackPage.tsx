import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function readAuthError() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const description = query.get('error_description') ?? hash.get('error_description');
  return description ? decodeURIComponent(description.replace(/\+/g, ' ')) : '';
}

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [authError] = useState(readAuthError);

  useEffect(() => {
    if (!loading && user && !authError) {
      navigate('/', { replace: true });
    }
  }, [authError, loading, navigate, user]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-asphalt-950 px-6 text-center text-cream-100">
        <p className="text-sm text-cream-100/70">E-Mail-Bestätigung wird verarbeitet …</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-asphalt-950 px-6 text-center">
      <section className="w-full max-w-md rounded-3xl bg-cream-200 p-7 shadow-2xl">
        <h1 className="font-display text-2xl font-extrabold text-asphalt-950">
          {authError ? 'E-Mail-Bestätigung konnte nicht abgeschlossen werden' : 'E-Mail bestätigt'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-asphalt-800">
          {authError
            ? 'Der Bestätigungslink ist ungültig, abgelaufen oder wurde bereits verwendet. Starten Sie die Registrierung erneut oder melden Sie sich an.'
            : 'Ihre E-Mail-Adresse ist bestätigt. Sie können sich jetzt mit Ihrer E-Mail-Adresse und Ihrem Passwort anmelden.'}
        </p>
        {authError && <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-left text-xs text-danger">{authError}</p>}
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-asphalt-950 transition hover:bg-amber-300"
        >
          Zum Login
        </Link>
      </section>
    </main>
  );
}
