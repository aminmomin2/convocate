/**
 * LoadingSkeleton Component
 * 
 * Reusable loading skeleton component for consistent loading states.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'text' | 'avatar' | 'card' | 'list' | 'button' | 'input' | 'custom';
  lines?: number;
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const variantClasses = {
  text: 'h-4 bg-muted rounded',
  avatar: 'bg-muted rounded-full',
  card: 'h-32 bg-muted rounded-lg',
  list: 'h-16 bg-muted rounded-md',
  button: 'h-10 bg-muted rounded-md',
  input: 'h-10 bg-muted rounded-md',
  custom: 'bg-muted rounded',
};

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export function LoadingSkeleton({ 
  variant = 'text',
  lines = 1,
  className,
  width,
  height,
  rounded = 'md'
}: LoadingSkeletonProps) {
  const baseClasses = cn(
    'animate-pulse',
    variantClasses[variant],
    roundedClasses[rounded],
    className
  );

  const style = {
    width: width,
    height: height,
  };

  if (lines === 1) {
    return (
      <div 
        className={baseClasses}
        style={style}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            baseClasses,
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
          style={style}
        />
      ))}
    </div>
  );
}

// Specialized skeleton components
export function TextSkeleton({ 
  lines = 3, 
  className 
}: Omit<LoadingSkeletonProps, 'variant'>) {
  return (
    <LoadingSkeleton 
      variant="text" 
      lines={lines} 
      className={className}
    />
  );
}

export function AvatarSkeleton({ 
  size = 'md',
  className 
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  return (
    <LoadingSkeleton 
      variant="avatar"
      className={cn(sizeClasses[size], className)}
    />
  );
}

export function CardSkeleton({ 
  className 
}: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <div className="flex items-center space-x-4">
        <AvatarSkeleton size="md" />
        <div className="space-y-2 flex-1">
          <LoadingSkeleton variant="text" width="60%" />
          <LoadingSkeleton variant="text" width="40%" />
        </div>
      </div>
      <LoadingSkeleton variant="text" lines={2} />
      <div className="flex space-x-2">
        <LoadingSkeleton variant="button" width="80px" />
        <LoadingSkeleton variant="button" width="60px" />
      </div>
    </div>
  );
}

export function ListSkeleton({ 
  items = 3, 
  className 
}: { 
  items?: number; 
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <LoadingSkeleton 
          key={index}
          variant="list" 
          className="w-full"
        />
      ))}
    </div>
  );
}
