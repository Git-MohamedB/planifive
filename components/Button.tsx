"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'danger'
  | 'ghost'
  | 'glass';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-all duration-300 ease-out focus:outline-none disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
    glass: 'btn-glass',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || loading ? 'btn-disabled' : '';
  const loadingClass = loading ? 'btn-loading' : '';

  const finalClassName = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    disabledClass,
    loadingClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={finalClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="animate-spin mr-2" size={16} />
      )}

      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2 flex-shrink-0">{icon}</span>
      )}

      <span className={loading ? 'opacity-0' : ''}>{children}</span>

      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2 flex-shrink-0">{icon}</span>
      )}
    </button>
  );
}

// Composants spécialisés pour des cas d'usage courants
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="secondary" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="danger" {...props} />;
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="ghost" {...props} />;
}

export function GlassButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="glass" {...props} />;
}
