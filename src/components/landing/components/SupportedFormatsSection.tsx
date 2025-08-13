/**
 * SupportedFormatsSection Component
 * 
 * Section showcasing supported file formats for chat uploads.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { ContentSection, FeatureCard, GridLayout } from '@/components/layout';

export const SupportedFormatsSection: React.FC = () => {
  const formats = [
    {
      title: 'CSV Export',
      description: 'WhatsApp, Telegram, and other platforms that export to CSV format with sender, message, and timestamp columns.',
      color: 'blue' as const,
      icon: <span className="text-white font-bold text-xl">CSV</span>
    },
    {
      title: 'JSON Format',
      description: 'Structured data format with sender and message objects. Common in API exports and custom chat applications.',
      color: 'green' as const,
      icon: <span className="text-white font-bold text-xl">JSON</span>
    },
    {
      title: 'Text Export ⭐',
      description: 'Works best! WhatsApp chat export format (.txt files) with timestamps and sender names. Supports multiline messages and various date formats.',
      color: 'purple' as const,
      icon: <span className="text-white font-bold text-xl">TXT</span>,
      badge: 'RECOMMENDED'
    },
    {
      title: 'SMS Backup',
      description: 'SMS Backup & Restore format for Android devices. Perfect for importing SMS conversations.',
      color: 'orange' as const,
      icon: <span className="text-white font-bold text-xl">XML</span>
    }
  ];

  return (
    <ContentSection
      title="Supported File Formats"
      description="We support multiple chat export formats from popular platforms"
      background="white"
    >
      <GridLayout cols={4} gap="md">
        {formats.map((format, index) => (
          <FeatureCard
            key={index}
            variant="format"
            color={format.color}
            icon={format.icon}
            title={format.title}
            description={format.description}
            badge={format.badge}
            centered
          />
        ))}
      </GridLayout>
    </ContentSection>
  );
};
