import React from 'react';

interface ProgressProps {
  progress: number;
  status?: string;
  showPercentage?: boolean;
  className?: string;
}

export function Progress({ 
  progress, 
  status, 
  showPercentage = true,
  className = "" 
}: ProgressProps) {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      {(status || showPercentage) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {status && <span>{status}</span>}
          {showPercentage && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
