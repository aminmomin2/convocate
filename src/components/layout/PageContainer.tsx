/**
 * PageContainer Component
 * 
 * Standard page wrapper with consistent max-width, padding, and background styling.
 * Used across all pages for consistent layout.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'gradient' | 'muted' | 'transparent';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12',
};

const backgroundClasses = {
  default: 'bg-background',
  gradient: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800',
  muted: 'bg-muted/30',
  transparent: 'bg-transparent',
};

export function PageContainer({ 
  children, 
  className,
  maxWidth = '6xl',
  padding = 'md',
  background = 'default'
}: PageContainerProps) {
  return (
    <div className={cn(
      'min-h-screen',
      backgroundClasses[background],
      className
    )}>
      <div className={cn(
        'mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding]
      )}>
        {children}
      </div>
    </div>
  );
}
