import React from 'react';

interface AlertProps {
  variant?: 'error' | 'info' | 'warning' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ 
  variant = 'info', 
  title, 
  children, 
  className = "" 
}: AlertProps) {
  const variants = {
    error: {
      container: 'bg-red-50 border-red-200',
      title: 'text-red-800',
      content: 'text-red-700',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      title: 'text-blue-800',
      content: 'text-blue-700',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      title: 'text-yellow-800',
      content: 'text-yellow-700',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    success: {
      container: 'bg-green-50 border-green-200',
      title: 'text-green-800',
      content: 'text-green-700',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const variantStyles = variants[variant];

  return (
    <div className={`border rounded-lg p-3 ${variantStyles.container} ${className}`}>
      {(title || variantStyles.icon) && (
        <div className="flex items-center gap-2 mb-2">
          {variantStyles.icon}
          {title && <span className={`font-medium text-sm ${variantStyles.title}`}>{title}</span>}
        </div>
      )}
      <div className={`text-xs ${variantStyles.content}`}>
        {children}
      </div>
    </div>
  );
}
