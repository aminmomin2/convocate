/**
 * ErrorMessage Component
 * 
 * Reusable error message component for consistent error handling.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'default' | 'compact' | 'inline';
  showRetry?: boolean;
  showDismiss?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({ 
  title = 'Error',
  message,
  variant = 'default',
  showRetry = false,
  showDismiss = false,
  onRetry,
  onDismiss,
  className
}: ErrorMessageProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-red-600 dark:text-red-400', className)}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
        {showDismiss && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md', className)}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{message}</span>
        </div>
        <div className="flex items-center gap-1">
          {showRetry && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-7 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Alert variant="error" title={title} className={className}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <div className="flex items-center gap-1 ml-4">
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 px-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          {showDismiss && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 px-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

// Specialized error components
export function NetworkErrorMessage({ 
  onRetry,
  className 
}: { 
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorMessage
      title="Network Error"
      message="Failed to connect to the server. Please check your internet connection and try again."
      showRetry={!!onRetry}
      onRetry={onRetry}
      className={className}
    />
  );
}

export function ValidationErrorMessage({ 
  message,
  className 
}: { 
  message: string;
  className?: string;
}) {
  return (
    <ErrorMessage
      title="Validation Error"
      message={message}
      variant="compact"
      className={className}
    />
  );
}

export function NotFoundErrorMessage({ 
  item = 'item',
  className 
}: { 
  item?: string;
  className?: string;
}) {
  return (
    <ErrorMessage
      title="Not Found"
      message={`The ${item} you're looking for doesn't exist or has been removed.`}
      className={className}
    />
  );
}
