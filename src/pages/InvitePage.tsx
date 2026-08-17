import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Field, Input } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { getPublicAppUrl } from '../lib/appUrl';

interface InviteRecord {
  driver_name: string;
  driver_email: string;
  company_name: string;
}

export default function InvitePage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteRecord | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error: requestError } = await supabase.rpc('get_driver_invite', { invite_token: token });
        if (!active) return;
        const record = Array.isArray(data) ? data[0] : data;
        if (requestError || !record) setError('Diese Fahrereinladung ist ungültig oder abgelaufen.');
        else setInvite(record as InviteRecord);
      } catch (error) {
        console.warn('[TaxiSchild] Invitation lookup crashed', error);
        if (active) setError('Die Einladung konnte gerade nicht geladen werden. Bitte erneut versuchen.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invite || password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: invite.driver_email,
        password,
        options: {
          data: { invite_token: token, name: invite.driver_name },
          emailRedirectTo: `${getPublicAppUrl()}/auth/callback`,
        },
      });
      if (signupError) {
        setError(signupError.message);
        return;
      }
      if (data.session) {
        navigate('/');
      } else {
        setNotice('Ihr Passwort wurde gespeichert. Bitte bestätigen Sie jetzt Ihre E-Mail-Adresse und melden Sie sich danach an. Prüfen Sie auch den Spam-Ordner.');
      }
    } catch (error) {
      console.warn('[TaxiSchild] Invitation activation crashed', error);
      setError('Die Aktivierung konnte nicht gespeichert werden. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-asphalt-950 px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-400 text-3xl font-black text-asphalt-950">TS</div>
          <h1 className="font-display text-2xl font-extrabold text-cream-100">Fahrerzugang aktivieren</h1>
          <p className="mt-1 text-sm text-cream-100/50">Sicherer Zugang für {invite?.company_name ?? 'Ihr Unternehmen'}</p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-cream-200 p-6 text-center text-sm text-ink/60">Einladung wird geprüft…</div>
        ) : invite ? (
          notice ? (
            <div className="rounded-3xl bg-cream-200 p-6 text-center shadow-2xl">
              <p className="rounded-xl bg-success/10 px-3 py-3 text-sm font-semibold leading-relaxed text-success">{notice}</p>
              <Link to="/login" className="mt-5 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-asphalt-950">
                Zum Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-cream-200 p-6 shadow-2xl">
              <p className="rounded-xl bg-ink/5 px-3 py-2 text-sm text-ink/70">
                Willkommen, <strong>{invite.driver_name}</strong>. Ihr Zugang lautet {invite.driver_email}.
              </p>
              <Field label="Neues Passwort" hint="mindestens 8 Zeichen" required>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
              </Field>
              {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
              <Button type="submit" fullWidth size="lg" disabled={saving}>{saving ? 'Konto wird erstellt…' : 'Passwort festlegen und starten'}</Button>
            </form>
          )
        ) : (
          <div className="rounded-3xl bg-cream-200 p-6 text-center text-sm font-semibold text-danger">{error}</div>
        )}
      </div>
    </div>
  );
}
