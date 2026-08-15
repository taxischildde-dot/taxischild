import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SettingsIcon } from '../ui/Icons';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, company } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-cream-400/60 bg-cream-200/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.9rem)] backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-ink/40">
            {company?.name ?? 'TaxiSchild'}
          </p>
          <h1 className="font-display text-xl font-extrabold text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink/55">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/5 text-ink/70 transition hover:bg-ink/10"
            aria-label="Einstellungen"
          >
            <SettingsIcon width={20} height={20} />
          </Link>
          <div className="hidden h-11 min-w-[2.75rem] items-center justify-center rounded-2xl bg-asphalt-900 px-3 font-display text-sm font-bold text-cream-100 sm:flex">
            {user?.name?.slice(0, 1)}
          </div>
        </div>
      </div>
    </header>
  );
}
