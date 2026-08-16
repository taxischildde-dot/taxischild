import React from 'react';
import { clearAppCache } from '../lib/storage';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[TaxiSchild] Unhandled app error', error.stack ?? error.message, window.location.href);
    try {
      window.sessionStorage.setItem('taxischild_disable_native_alerts_until', String(Date.now() + 120000));
    } catch {
      // Recovery must still work if browser storage is unavailable.
    }
  }

  private disableNativeAlerts = () => {
    try {
      window.sessionStorage.setItem('taxischild_disable_native_alerts_until', String(Date.now() + 120000));
    } catch {
      // Continue with a full navigation.
    }
  };

  private recover = () => {
    this.disableNativeAlerts();
    window.location.replace('/login');
  };

  private clearCacheAndRecover = () => {
    clearAppCache();
    this.disableNativeAlerts();
    window.location.replace('/login?recovery=cache');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-cream-200 px-6 py-10">
        <section className="w-full max-w-md rounded-3xl border border-cream-400 bg-cream-100 p-6 text-center shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-ink">Die Ansicht konnte nicht geladen werden</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Ihre Cloud-Daten und Ihr Konto bleiben erhalten. Wenn dieser Fehler wiederkommt, bereinigen Sie nur den lokalen App-Cache.
          </p>
          <div className="mt-5 grid gap-3">
            <button type="button" onClick={this.clearCacheAndRecover} className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-asphalt-950">
              Cache bereinigen und erneut öffnen
            </button>
            <div className="grid grid-cols-2 gap-3">
              <a href="/login" onClick={() => this.recover()} className="rounded-xl bg-ink/10 px-4 py-3 text-sm font-extrabold text-ink">
                Zur Anmeldung
              </a>
              <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-ink px-4 py-3 text-sm font-extrabold text-cream-100">
                Neu laden
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }
}
