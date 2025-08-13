/**
 * Avatar Component
 * 
 * Reusable avatar component for consistent user/profile image display.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

const statusClasses = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4',
};

export function Avatar({ 
  src,
  alt,
  fallback,
  size = 'md',
  shape = 'circle',
  className,
  status,
  showStatus = false
}: AvatarProps) {
  const hasImage = src && src.trim() !== '';
  
  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'relative overflow-hidden bg-primary/10 flex items-center justify-center font-semibold text-primary',
          sizeClasses[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          className
        )}
      >
        {hasImage ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]}`}
          />
        ) : (
          <span className="font-semibold">
            {fallback.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      
      {showStatus && status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 border-2 border-white dark:border-slate-800 rounded-full',
            statusClasses[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}

// Specialized avatar components
export function UserAvatar({ 
  src,
  name,
  size = 'md',
  showStatus = false,
  status,
  className 
}: {
  src?: string | null;
  name: string;
  size?: AvatarProps['size'];
  showStatus?: boolean;
  status?: AvatarProps['status'];
  className?: string;
}) {
  return (
    <Avatar
      src={src}
      alt={name}
      fallback={name}
      size={size}
      showStatus={showStatus}
      status={status}
      className={className}
    />
  );
}

export function PersonaAvatar({ 
  src,
  name,
  size = 'md',
  className 
}: {
  src?: string | null;
  name: string;
  size?: AvatarProps['size'];
  className?: string;
}) {
  return (
    <Avatar
      src={src}
      alt={`${name} persona`}
      fallback={name}
      size={size}
      className={cn('group-hover:scale-105 transition-transform duration-300', className)}
    />
  );
}
