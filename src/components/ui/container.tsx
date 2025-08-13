/**
 * Container Component
 * 
 * Reusable container component for consistent layout and spacing.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12',
};

export function Container({ 
  children, 
  size = 'lg',
  padding = 'md',
  className,
  as: Component = 'div'
}: ContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto',
        sizeClasses[size],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </Component>
  );
}

// Specialized container variants
export function UIContainerSection({ 
  children, 
  className,
  ...props 
}: Omit<ContainerProps, 'size'>) {
  return (
    <Container 
      size="xl" 
      className={cn('py-12', className)}
      {...props}
    >
      {children}
    </Container>
  );
}

export function UIContainer({ 
  children, 
  className,
  ...props 
}: Omit<ContainerProps, 'size'>) {
  return (
    <Container 
      size="full" 
      className={cn('min-h-screen', className)}
      {...props}
    >
      {children}
    </Container>
  );
}
