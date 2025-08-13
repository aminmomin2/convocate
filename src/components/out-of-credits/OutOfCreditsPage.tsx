/**
 * OutOfCreditsPage Component
 * 
 * Main out-of-credits interface that orchestrates all out-of-credits-related components.
 * This component consolidates the out-of-credits functionality from the out-of-credits page.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import { PageContainer } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import {
  OutOfCreditsHeader,
  OutOfCreditsContent,
  SocialMediaInfo,
  NavigationButtons
} from './components/index';

export default function OutOfCreditsPage() {
  return (
    <PageContainer 
      background="transparent" 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <OutOfCreditsHeader />
        <CardContent className="space-y-6 px-8 pb-8">
          <OutOfCreditsContent />
          <SocialMediaInfo />
          <NavigationButtons />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
