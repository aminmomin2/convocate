/**
 * IconWrapper Component
 * 
 * Reusable icon wrapper with consistent styling and hover effects.
 * Supports different sizes, colors, and animation states.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface IconWrapperProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'gray';
  variant?: 'default' | 'rounded' | 'circular';
  animated?: boolean;
  centered?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

const colorClasses = {
  blue: 'bg-gradient-to-br from-blue-500 to-cyan-600',
  green: 'bg-gradient-to-br from-green-500 to-emerald-600',
  purple: 'bg-gradient-to-br from-purple-500 to-pink-600',
  orange: 'bg-gradient-to-br from-orange-500 to-red-600',
  pink: 'bg-gradient-to-br from-pink-500 to-rose-600',
  gray: 'bg-gradient-to-br from-gray-500 to-slate-600',
};

const variantClasses = {
  default: 'rounded-xl',
  rounded: 'rounded-2xl',
  circular: 'rounded-full',
};

export function IconWrapper({ 
  children, 
  className,
  size = 'md',
  color = 'blue',
  variant = 'default',
  animated = true,
  centered = false
}: IconWrapperProps) {
  return (
    <div className={cn(
      'flex items-center justify-center shadow-lg',
      sizeClasses[size],
      colorClasses[color],
      variantClasses[variant],
      animated && 'group-hover:scale-110 transition-transform duration-300',
      centered && 'mx-auto',
      className
    )}>
      <div className="text-white">
        {children}
      </div>
    </div>
  );
}
