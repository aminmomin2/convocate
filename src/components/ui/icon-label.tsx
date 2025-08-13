/**
 * IconLabel Component
 * 
 * Reusable component for displaying icons with labels in a consistent format.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface IconLabelProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'muted' | 'primary';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const sizeClasses = {
  sm: {
    container: 'text-xs',
    icon: 'w-3 h-3',
    text: 'text-xs',
  },
  md: {
    container: 'text-sm',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  lg: {
    container: 'text-base',
    icon: 'w-5 h-5',
    text: 'text-base',
  },
};

const variantClasses = {
  default: {
    container: 'text-slate-900 dark:text-white',
    icon: 'text-slate-600 dark:text-slate-400',
    text: 'text-slate-900 dark:text-white',
  },
  muted: {
    container: 'text-muted-foreground',
    icon: 'text-muted-foreground',
    text: 'text-muted-foreground',
  },
  primary: {
    container: 'text-primary',
    icon: 'text-primary',
    text: 'text-primary',
  },
};

export function IconLabel({ 
  icon, 
  children, 
  size = 'md',
  variant = 'default',
  className,
  iconClassName,
  textClassName
}: IconLabelProps) {
  return (
    <div className={cn(
      'flex items-center gap-1 font-medium',
      sizeClasses[size].container,
      variantClasses[variant].container,
      className
    )}>
      <div className={cn(
        sizeClasses[size].icon,
        variantClasses[variant].icon,
        iconClassName
      )}>
        {icon}
      </div>
      <span className={cn(
        sizeClasses[size].text,
        variantClasses[variant].text,
        textClassName
      )}>
        {children}
      </span>
    </div>
  );
}
