import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { PlusIcon } from '../ui/Icons';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const hideFab = location.pathname.startsWith('/trips/new') || location.pathname.includes('/edit');

  return (
    <div className="min-h-screen bg-cream-200">
      <div className="mx-auto max-w-xl pb-28">
        <Outlet />
      </div>

      {!hideFab && (
        <button
          onClick={() => navigate('/trips/new')}
          className="fixed bottom-24 left-1/2 z-40 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-amber-400 text-asphalt-950 shadow-[0_8px_24px_rgba(226,149,42,0.55)] ring-4 ring-cream-200 transition active:scale-95"
          aria-label="Neue Fahrt"
        >
          <PlusIcon width={30} height={30} strokeWidth={2.4} />
        </button>
      )}

      <BottomNav />
    </div>
  );
}
