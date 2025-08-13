/**
 * NavigationButtons Component
 * 
 * Navigation buttons for the out-of-credits page.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import { FlexLayout } from '@/components/layout';
import Link from 'next/link';

export function NavigationButtons() {
  return (
    <FlexLayout direction="col" gap="sm" className="pt-2">
      <Link href="/dashboard">
        <Button className="w-full cursor-pointer h-12 text-base font-medium" variant="outline">
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Dashboard
        </Button>
      </Link>
      
      <Link href="/">
        <Button className="w-full cursor-pointer" variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </Button>
      </Link>
    </FlexLayout>
  );
}
