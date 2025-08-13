/**
 * OutOfCreditsHeader Component
 * 
 * Header section for the out-of-credits card with icon, title, and description.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OutOfCreditsHeader() {
  return (
    <CardHeader className="text-center pb-6">
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg">
        <svg className="w-10 h-10 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
        Oops! I Hit My API Limit
      </CardTitle>
      <CardDescription className="text-base mt-2 text-gray-600 dark:text-gray-300">
        My $10 monthly budget got used up faster than expected
      </CardDescription>
    </CardHeader>
  );
}
