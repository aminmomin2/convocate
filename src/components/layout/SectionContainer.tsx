/**
 * SectionContainer Component
 * 
 * Section wrapper with consistent spacing, borders, and styling.
 * Used for grouping related content within pages.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'default' | 'muted' | 'card' | 'transparent';
  border?: 'none' | 'top' | 'bottom' | 'both';
  rounded?: boolean;
}

const spacingClasses = {
  none: '',
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
  xl: 'space-y-12',
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
  muted: 'bg-muted/30',
  card: 'bg-card',
  transparent: 'bg-transparent',
};

const borderClasses = {
  none: '',
  top: 'border-t border-border',
  bottom: 'border-b border-border',
  both: 'border-y border-border',
};

export function SectionContainer({ 
  children, 
  className,
  spacing = 'md',
  padding = 'none',
  background = 'transparent',
  border = 'none',
  rounded = false
}: SectionContainerProps) {
  return (
    <section className={cn(
      spacingClasses[spacing],
      paddingClasses[padding],
      backgroundClasses[background],
      borderClasses[border],
      rounded && 'rounded-lg',
      className
    )}>
      {children}
    </section>
  );
}
