/**
 * GridLayout Component
 * 
 * Responsive grid system for consistent layout patterns across the application.
 * Handles common grid configurations for cards, content, and other elements.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface GridLayoutProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  autoFit?: boolean;
  autoFill?: boolean;
}

const gapClasses = {
  none: '',
  sm: 'gap-3',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
};

const responsiveGridClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
};

const fixedGridClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export function GridLayout({ 
  children, 
  className,
  cols = 3,
  gap = 'md',
  responsive = true,
  autoFit = false,
  autoFill = false
}: GridLayoutProps) {
  const gridClasses = responsive ? responsiveGridClasses[cols] : fixedGridClasses[cols];
  
  return (
    <div className={cn(
      'grid',
      gridClasses,
      gapClasses[gap],
      autoFit && 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
      autoFill && 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))]',
      className
    )}>
      {children}
    </div>
  );
}
