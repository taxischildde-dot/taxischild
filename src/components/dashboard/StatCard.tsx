import React from 'react';

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'amber' | 'dark';
}) {
  const toneClasses = {
    default: 'bg-cream-100 border-cream-400/60 text-ink',
    amber: 'bg-amber-400 border-amber-500 text-asphalt-950',
    dark: 'bg-asphalt-900 border-asphalt-800 text-cream-100',
  }[tone];

  return (
    <div className={`rounded-card border p-4 shadow-card ${toneClasses}`}>
      <p
        className={`text-xs font-bold ${
          tone === 'default' ? 'text-ink/50' : tone === 'amber' ? 'text-asphalt-950/70' : 'text-cream-100/60'
        }`}
      >
        {label}
      </p>
      <p className="mt-1 font-meter text-2xl font-bold tabular-nums">{value}</p>
      {hint && (
        <p
          className={`mt-0.5 text-[0.7rem] font-semibold ${
            tone === 'default' ? 'text-ink/40' : tone === 'amber' ? 'text-asphalt-950/60' : 'text-cream-100/50'
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
