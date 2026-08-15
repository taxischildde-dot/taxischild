import React from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, children, className = '' }: FieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline gap-1 text-sm font-semibold text-ink/80">
        {label}
        {required && <span className="text-amber-600">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-xl border border-cream-400 bg-white/70 px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink/35 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-400/30';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return <input className={`${inputBase} ${className}`} {...rest} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return <textarea className={`${inputBase} min-h-[5.5rem] resize-y ${className}`} {...rest} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <select className={`${inputBase} appearance-none bg-white/70 ${className}`} {...rest}>
      {children}
    </select>
  );
}
