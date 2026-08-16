import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Field, Input } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.rpc('get_driver_invite', { invite_token: token }).then(({ data, error: requestError }) => {
      if (!active) return;
      const record = Array.isArray(data) ? data[0] : data;
      if (requestError || !record) setError('Diese Fahrereinladung ist ungültig oder abgelaufen.');
      else setInvite(record as InviteRecord);
      setLoading(false);
    });
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
    const { data, error: signupError } = await supabase.auth.signUp({
      email: invite.driver_email,
      password,
      options: { data: { invite_token: token, name: invite.driver_name } },
    });
    setSaving(false);
    if (signupError) {
      setError(signupError.message);
      return;
    }
    if (data.session) navigate('/');
    else navigate('/login?registered=1');
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
          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-cream-200 p-6 shadow-2xl">
            <p className="rounded-xl bg-ink/5 px-3 py-2 text-sm text-ink/70">
              Willkommen, <strong>{invite.driver_name}</strong>. Ihr Zugang lautet {invite.driver_email}.
            </p>
            <Field label="Passwort" hint="mindestens 8 Zeichen" required>
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
            </Field>
            {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
            <Button type="submit" fullWidth size="lg" disabled={saving}>{saving ? 'Konto wird erstellt…' : 'Fahrerzugang aktivieren'}</Button>
          </form>
        ) : (
          <div className="rounded-3xl bg-cream-200 p-6 text-center text-sm font-semibold text-danger">{error}</div>
        )}
      </div>
    </div>
  );
}
