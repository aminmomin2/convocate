/**
 * ContentSection Component
 * 
 * Specialized section component for landing page content with consistent styling.
 * Handles common patterns like section headers, card grids, and background styling.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  background?: 'default' | 'gradient' | 'muted' | 'white' | 'purple' | 'blue';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: '4xl' | '5xl' | '6xl' | '7xl';
  titleGradient?: boolean;
  centered?: boolean;
}

const backgroundClasses = {
  default: 'bg-background',
  gradient: 'bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/20',
  muted: 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20',
  white: 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800',
  purple: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
  blue: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
};

const paddingClasses = {
  sm: 'py-12 px-4',
  md: 'py-16 px-4',
  lg: 'py-20 px-4',
  xl: 'py-24 px-4',
};

const maxWidthClasses = {
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

export function ContentSection({ 
  children, 
  className,
  title,
  description,
  background = 'default',
  padding = 'lg',
  maxWidth = '6xl',
  titleGradient = true,
  centered = true
}: ContentSectionProps) {
  return (
    <section className={cn(
      backgroundClasses[background],
      paddingClasses[padding],
      className
    )}>
      <div className={cn(
        'mx-auto',
        maxWidthClasses[maxWidth]
      )}>
        {/* Section Header */}
        {(title || description) && (
          <div className={cn(
            'mb-16',
            centered && 'text-center'
          )}>
            {title && (
              <h2 className={cn(
                'text-4xl font-bold mb-4',
                titleGradient && 'bg-gradient-to-r from-slate-900 to-purple-600 dark:from-white dark:to-purple-300 bg-clip-text text-transparent'
              )}>
                {title}
              </h2>
            )}
            {description && (
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {description}
              </p>
            )}
          </div>
        )}
        
        {/* Section Content */}
        {children}
      </div>
    </section>
  );
}
