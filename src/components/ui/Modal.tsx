import React from 'react';
import { XIcon } from './Icons';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-asphalt-950/60 backdrop-blur-sm sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-200 p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-ink/5 p-2 text-ink/60 hover:bg-ink/10"
            aria-label="Schließen"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
