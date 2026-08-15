import React from 'react';

export function Card({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`rounded-card bg-cream-100 shadow-card border border-cream-400/50 ${padded ? 'p-4' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-cream-400 bg-cream-100/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink/30">{icon}</div>}
      <h3 className="font-display text-base font-bold text-ink/70">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-ink/50">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
