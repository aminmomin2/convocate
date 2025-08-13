/**
 * StatusIndicator Component
 * 
 * Reusable status indicator component for showing various states.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'online' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Success',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    label: 'Error',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'Warning',
  },
  info: {
    icon: AlertCircle,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Info',
  },
  loading: {
    icon: Clock,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    label: 'Loading',
  },
  online: {
    icon: Wifi,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Online',
  },
  offline: {
    icon: WifiOff,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    label: 'Offline',
  },
};

const sizeClasses = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    label: 'text-xs',
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'w-4 h-4',
    label: 'text-sm',
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    label: 'text-base',
  },
};

export function StatusIndicator({ 
  status,
  size = 'md',
  showLabel = false,
  label,
  className
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeConfig = sizeClasses[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        config.bgColor,
        config.borderColor,
        config.color,
        sizeConfig.container,
        className
      )}
    >
      <Icon className={sizeConfig.icon} />
      {showLabel && (
        <span className={sizeConfig.label}>
          {label || config.label}
        </span>
      )}
    </div>
  );
}

// Specialized status components
export function ConnectionStatus({ 
  isOnline,
  size = 'md',
  showLabel = true,
  className 
}: {
  isOnline: boolean;
  size?: StatusIndicatorProps['size'];
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <StatusIndicator
      status={isOnline ? 'online' : 'offline'}
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}

export function LoadingStatus({ 
  size = 'md',
  showLabel = true,
  className 
}: {
  size?: StatusIndicatorProps['size'];
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <StatusIndicator
      status="loading"
      size={size}
      showLabel={showLabel}
      className={className}
    />
  );
}

export function SuccessStatus({ 
  message,
  size = 'md',
  showLabel = true,
  className 
}: {
  message?: string;
  size?: StatusIndicatorProps['size'];
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <StatusIndicator
      status="success"
      size={size}
      showLabel={showLabel}
      label={message}
      className={className}
    />
  );
}

export function ErrorStatus({ 
  message,
  size = 'md',
  showLabel = true,
  className 
}: {
  message?: string;
  size?: StatusIndicatorProps['size'];
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <StatusIndicator
      status="error"
      size={size}
      showLabel={showLabel}
      label={message}
      className={className}
    />
  );
}
