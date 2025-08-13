/**
 * UsageLimitsCard Component
 * 
 * Displays usage limits information for personas and messages.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import { Card, CardContent, Badge } from '@/components/ui';

interface UsageLimitsCardProps {
  totalPersonasCreated: number;
  maxPersonasPerIP: number;
  totalMessagesUsed: number;
  maxMessagesPerIP: number;
}

export function UsageLimitsCard({ 
  totalPersonasCreated, 
  maxPersonasPerIP, 
  totalMessagesUsed, 
  maxMessagesPerIP 
}: UsageLimitsCardProps) {
  return (
    <div className="mb-6">
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent>
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Usage Limits</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-400">Personas:</span>
              <Badge variant="outline" className="text-blue-700 dark:text-blue-400">
                {totalPersonasCreated}/{maxPersonasPerIP}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700 dark:text-blue-400">Total Messages:</span>
              <Badge variant="outline" className="text-blue-700 dark:text-blue-400">
                {totalMessagesUsed}/{maxMessagesPerIP}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
