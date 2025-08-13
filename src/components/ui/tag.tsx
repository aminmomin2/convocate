/**
 * Tag Component
 * 
 * Reusable tag/badge component with consistent styling and color variants.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TagProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'pink' | 'indigo' | 'teal' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
  primary: 'bg-primary/10 text-primary dark:bg-primary/20',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export function Tag({ 
  children, 
  variant = 'blue', 
  size = 'sm',
  className,
  onClick 
}: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded font-medium transition-colors',
        variantClasses[variant],
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
