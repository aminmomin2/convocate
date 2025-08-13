/**
 * FeatureCard Component
 * 
 * Reusable card component for features, use cases, and other content cards.
 * Provides consistent styling, hover effects, and icon support.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  variant?: 'default' | 'feature' | 'use-case' | 'format';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  badge?: string;
  centered?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'border-blue-200/50 dark:border-blue-700/50',
  green: 'border-green-200/50 dark:border-green-700/50',
  purple: 'border-purple-200/50 dark:border-purple-700/50',
  orange: 'border-orange-200/50 dark:border-orange-700/50',
  pink: 'border-pink-200/50 dark:border-pink-700/50',
};

const iconColorClasses = {
  blue: 'bg-gradient-to-br from-blue-500 to-cyan-600',
  green: 'bg-gradient-to-br from-green-500 to-emerald-600',
  purple: 'bg-gradient-to-br from-purple-500 to-pink-600',
  orange: 'bg-gradient-to-br from-orange-500 to-red-600',
  pink: 'bg-gradient-to-br from-pink-500 to-rose-600',
};

const variantClasses = {
  default: 'p-6',
  feature: 'p-8',
  'use-case': 'p-8 space-y-4',
  format: 'p-8 text-center space-y-4',
};

export function FeatureCard({ 
  children, 
  className,
  icon,
  title,
  description,
  variant = 'default',
  color = 'blue',
  badge,
  centered = false,
  onClick
}: FeatureCardProps) {
  return (
    <div 
      className={cn(
        'group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300',
        colorClasses[color],
        variantClasses[variant],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          {badge}
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div className={cn(
          'flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg rounded-2xl',
          variant === 'format' ? 'w-16 h-16 mx-auto' : 'w-12 h-12',
          iconColorClasses[color]
        )}>
          {icon}
        </div>
      )}

      {/* Content */}
      {children || (
        <>
          {title && (
            <h3 className={cn(
              'font-bold text-slate-900 dark:text-white',
              variant === 'format' ? 'text-lg' : 'text-xl',
              centered && 'text-center'
            )}>
              {title}
            </h3>
          )}
          {description && (
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </>
      )}
    </div>
  );
}
