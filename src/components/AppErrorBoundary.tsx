import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[TaxiSchild] Unhandled app error', error);
  }

  private recover = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-cream-200 px-6 py-10">
        <section className="w-full max-w-md rounded-3xl border border-cream-400 bg-cream-100 p-6 text-center shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-ink">Die Ansicht konnte nicht geladen werden</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Ihre gespeicherten Daten bleiben erhalten. Öffnen Sie die Startseite erneut oder laden Sie die Anwendung neu.
          </p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={this.recover} className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-asphalt-950">
              Zur Startseite
            </button>
            <button type="button" onClick={() => window.location.reload()} className="flex-1 rounded-xl bg-ink px-4 py-3 text-sm font-extrabold text-cream-100">
              Neu laden
            </button>
          </div>
        </section>
      </main>
    );
  }
}
