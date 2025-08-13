/**
 * LoadingSpinner Component
 * 
 * Loading state component for the dashboard.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading personas...</p>
      </div>
    </div>
  );
}
