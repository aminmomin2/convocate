/**
 * CardGrid Component
 * 
 * Specialized grid layout for cards with consistent spacing and responsive behavior.
 * Optimized for persona cards, feature cards, and other card-based layouts.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  autoFit?: boolean;
  minCardWidth?: number;
}

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

const responsiveCardGridClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
};

export function CardGrid({ 
  children, 
  className,
  cols = 3,
  gap = 'md',
  autoFit = false,
  minCardWidth = 250
}: CardGridProps) {
  const gridClasses = autoFit 
    ? `grid-cols-[repeat(auto-fit,minmax(${minCardWidth}px,1fr))]`
    : responsiveCardGridClasses[cols];
  
  return (
    <div className={cn(
      'grid',
      gridClasses,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}
