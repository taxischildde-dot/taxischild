import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, TripIcon, FleetIcon, ReportIcon, SupportIcon } from '../ui/Icons';

const items = [
  { to: '/', label: 'Start', icon: HomeIcon, end: true },
  { to: '/trips', label: 'Fahrten', icon: TripIcon, end: false },
  { to: '/fleet', label: 'Fuhrpark', icon: FleetIcon, end: false },
  { to: '/reports', label: 'Berichte', icon: ReportIcon, end: false },
  { to: '/support', label: 'Support', icon: SupportIcon, end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/40 bg-asphalt-900 pb-[env(safe-area-inset-bottom)] shadow-nav lg:hidden">
      <ul className="mx-auto flex w-full max-w-2xl items-stretch justify-between px-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-bold transition-colors ${
                  isActive ? 'text-amber-400' : 'text-cream-100/45 hover:text-cream-100/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute top-0 h-[3px] w-8 rounded-full transition-all ${
                      isActive ? 'bg-amber-400' : 'bg-transparent'
                    }`}
                  />
                  <Icon width={22} height={22} strokeWidth={isActive ? 2.1 : 1.7} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
