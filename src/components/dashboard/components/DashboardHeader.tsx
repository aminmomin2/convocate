/**
 * DashboardHeader Component
 * 
 * Header section for the dashboard with title, description, and action buttons.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { FlexLayout } from '@/components/layout';

interface DashboardHeaderProps {
  hasActiveSessions: boolean;
  hasPersonas: boolean;
  onClearAllData: () => void;
}

export function DashboardHeader({ hasActiveSessions, hasPersonas, onClearAllData }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <FlexLayout direction="row" justify="between" align="center" gap="md" responsive>
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Your Training Personas
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose a sales persona to train with and improve your skills
          </p>
          {hasActiveSessions && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">
                You have active training sessions
              </span>
            </div>
          )}
        </div>
        
        {/* Navigation and Action Buttons */}
        <FlexLayout gap="sm">
          <Link href="/">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-600 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </Button>
          </Link>
          
          {hasPersonas && (
            <Button
              variant="outline"
              onClick={onClearAllData}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Data
            </Button>
          )}
        </FlexLayout>
      </FlexLayout>
    </div>
  );
}
