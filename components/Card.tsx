"use client";

import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  fullWidth?: boolean;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  fullWidth = false,
  className = '',
  ...props
}: CardProps) {
  const baseClasses = 'card-rounded transition-all duration-300 ease-out';

  const variantClasses = {
    default: 'bg-[#181818] border-[#282828]',
    elevated: 'bg-[#1f1f1f] border-[#282828] shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
    glass: 'container-glass',
    bordered: 'bg-[#181818] border-2 border-[#1ED760]/20 shadow-[0_0_20px_rgba(30,215,96,0.3)]',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  };

  const hoverClass = hover ? 'hover:transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  const finalClassName = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClass,
    widthClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={finalClassName} {...props}>
      {children}
    </div>
  );
}

// Composants spécialisés
export function GlassCard(props: Omit<CardProps, 'variant'>) {
  return <Card variant="glass" {...props} />;
}

export function ElevatedCard(props: Omit<CardProps, 'variant'>) {
  return <Card variant="elevated" hover {...props} />;
}

export function BorderedCard(props: Omit<CardProps, 'variant'>) {
  return <Card variant="bordered" {...props} />;
}
