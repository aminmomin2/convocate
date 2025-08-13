/**
 * FeaturesSection Component
 * 
 * Features showcase section highlighting key capabilities.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { ContentSection, FeatureCardHorizontal, GridLayout } from '@/components/layout';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'Create Digital Twins',
      description: 'Upload real chat conversations and our AI creates lifelike digital twins that match the person\'s communication style, tone, and personality.',
      color: 'blue' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8V4l4 4z" />
        </svg>
      )
    },
    {
      title: 'Practice Any Scenario',
      description: 'Role-play with digital twins that respond like the real person. Practice sales pitches, difficult conversations, or just chat with AI clones of friends and colleagues.',
      color: 'green' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: 'Get Performance Insights',
      description: 'Receive detailed feedback on your conversations including style matching, tone analysis, and actionable improvement tips.',
      color: 'purple' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: 'Private & Secure',
      description: 'All processing happens in your browser. No sign-ups, no cloud databases—just private, data-driven rehearsal that\'s as versatile as it is powerful.',
      color: 'orange' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  return (
    <ContentSection
      title="What You Can Do"
      description="Create digital twins of anyone for realistic practice and rehearsal"
      background="gradient"
    >
      <GridLayout cols={2} gap="lg">
        {features.map((feature, index) => (
          <FeatureCardHorizontal
            key={index}
            color={feature.color}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </GridLayout>
    </ContentSection>
  );
};
