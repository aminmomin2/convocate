/**
 * UseCasesSection Component
 * 
 * Section showcasing different use cases for the platform.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { ContentSection, FeatureCard, IconWrapper, GridLayout } from '@/components/layout';

export const UseCasesSection: React.FC = () => {
  const useCases = [
    {
      title: 'Sales Professionals',
      description: 'Practice your pitch with AI clones of your toughest prospects. Rehearse objection handling and closing techniques with realistic responses.',
      color: 'blue' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: 'Personal Conversations',
      description: 'Practice difficult conversations with AI clones of friends, family, or colleagues. Rehearse important discussions in a safe, private environment.',
      color: 'green' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: 'Teams & Organizations',
      description: 'Train entire teams with consistent scenarios. Create digital twins from real interactions and share them across your organization for standardized practice.',
      color: 'purple' as const,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  return (
    <ContentSection
      title="Perfect For"
      description="Anyone looking to practice conversations with realistic AI clones"
      background="muted"
    >
      <GridLayout cols={3} gap="md">
        {useCases.map((useCase, index) => (
          <FeatureCard
            key={index}
            variant="use-case"
            color={useCase.color}
            icon={
              <IconWrapper size="lg" color={useCase.color}>
                {useCase.icon}
              </IconWrapper>
            }
            title={useCase.title}
            description={useCase.description}
          />
        ))}
      </GridLayout>
    </ContentSection>
  );
};
