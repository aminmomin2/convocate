/**
 * Stack Component
 * 
 * Reusable flex layout component for consistent spacing and alignment.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface StackProps {
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

const directionClasses = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
};

const spacingClasses = {
  none: '',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

export function Stack({ 
  children, 
  direction = 'col',
  spacing = 'md',
  align = 'start',
  justify = 'start',
  wrap = false,
  className,
  as: Component = 'div'
}: StackProps) {
  return (
    <Component
      className={cn(
        'flex',
        directionClasses[direction],
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </Component>
  );
}

// Common stack variants
export function HStack({ 
  children, 
  className,
  ...props 
}: Omit<StackProps, 'direction'>) {
  return (
    <Stack 
      direction="row" 
      className={className}
      {...props}
    >
      {children}
    </Stack>
  );
}

export function VStack({ 
  children, 
  className,
  ...props 
}: Omit<StackProps, 'direction'>) {
  return (
    <Stack 
      direction="col" 
      className={className}
      {...props}
    >
      {children}
    </Stack>
  );
}

export function Center({ 
  children, 
  className,
  ...props 
}: Omit<StackProps, 'direction' | 'align' | 'justify'>) {
  return (
    <Stack 
      direction="col" 
      align="center" 
      justify="center"
      className={className}
      {...props}
    >
      {children}
    </Stack>
  );
}
