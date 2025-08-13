/**
 * FlexLayout Component
 * 
 * Common flex patterns for consistent layout across the application.
 * Handles header layouts, button groups, and other flex-based arrangements.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface FlexLayoutProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

const directionClasses = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
};

const justifyClasses = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const alignClasses = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

const wrapClasses = {
  wrap: 'flex-wrap',
  nowrap: 'flex-nowrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

const gapClasses = {
  none: '',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const responsiveDirectionClasses = {
  row: 'flex-col sm:flex-row',
  col: 'flex-row sm:flex-col',
  'row-reverse': 'flex-col-reverse sm:flex-row-reverse',
  'col-reverse': 'flex-row-reverse sm:flex-col-reverse',
};

export function FlexLayout({ 
  children, 
  className,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = 'nowrap',
  gap = 'none',
  responsive = false
}: FlexLayoutProps) {
  const flexClasses = responsive ? responsiveDirectionClasses[direction] : directionClasses[direction];
  
  return (
    <div className={cn(
      'flex',
      flexClasses,
      justifyClasses[justify],
      alignClasses[align],
      wrapClasses[wrap],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}
