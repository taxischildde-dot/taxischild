import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-amber-400 text-asphalt-950 hover:bg-amber-500 active:bg-amber-600 shadow-sm',
  secondary: 'bg-cream-100 text-ink border border-cream-400 hover:bg-cream-50',
  ghost: 'bg-transparent text-ink hover:bg-ink/5',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
  dark: 'bg-asphalt-900 text-cream-100 hover:bg-asphalt-800',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm py-2 px-3 gap-1.5',
  md: 'text-[0.95rem] py-3 px-4 gap-2',
  lg: 'text-base py-4 px-5 gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl font-display font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
