/**
 * FeatureCardHorizontal Component
 * 
 * Horizontal feature card layout with icon on the left and content on the right.
 * Used for features that need more detailed descriptions and horizontal layout.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface FeatureCardHorizontalProps {
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
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
  blue: 'bg-gradient-to-br from-blue-500 to-purple-600',
  green: 'bg-gradient-to-br from-green-500 to-emerald-600',
  purple: 'bg-gradient-to-br from-purple-500 to-pink-600',
  orange: 'bg-gradient-to-br from-orange-500 to-red-600',
  pink: 'bg-gradient-to-br from-pink-500 to-rose-600',
};

export function FeatureCardHorizontal({ 
  children, 
  className,
  icon,
  title,
  description,
  color = 'blue',
  onClick
}: FeatureCardHorizontalProps) {
  return (
    <div 
      className={cn(
        'group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all duration-300',
        colorClasses[color],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        {icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg',
            iconColorClasses[color]
          )}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          {children || (
            <>
              {title && (
                <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">
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
      </div>
    </div>
  );
}
