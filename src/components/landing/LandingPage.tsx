"use client"
import React, { useState, useEffect } from 'react';
import { 
  HeroSection, 
  FeaturesSection, 
  UseCasesSection,
  SupportedFormatsSection, 
  FAQSection, 
  FutureRoadmapSection 
} from './components';
import { ConfirmationModal } from '@/components/ui';
import { SectionContainer } from '@/components/layout';
import { clearAllData } from '@/utils/clearData';
import { useToast } from '@/components/ui/toast';

interface FAQItem {
  question: string;
  answer: string;
}

export default function LandingPage() {
  const { showToast } = useToast();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const faqData: FAQItem[] = [
    {
      "question": "How does the AI create personas?",
      "answer": "After you upload your chat exports, our system parses and groups messages by contact, then runs a one-time LLM analysis on each person's last 15–20 turns to extract their tone, vocabulary, and quirks. That distilled style profile plus the recent history becomes the 'digital twin' you practice against."
    },
    {
      "question": "Is my data secure?",
      "answer": "Yes. All processing happens in your browser or serverless functions—your chat files are never stored long-term. For the MVP, persona data lives only in your localStorage, and you can clear it at any time."
    },
    {
      "question": "Can I practice with multiple personas?",
      "answer": "Absolutely. Each unique contact you upload becomes its own persona. You can pick any of them on the dashboard and practice conversations tailored to that individual's style."
    },
    {
      "question": "What kind of feedback do I get?",
      "answer": "After every reply, you'll see a positivity score from 0–100 and exactly three actionable tips on how to improve tone, clarity, or phrasing—based directly on the persona's style profile."
    },
    {
      "question": "How accurate are the AI responses?",
      "answer": "The AI replies mimic the exact wording patterns and tone distilled from your real conversations. While it won't remember every single detail, it uses the extracted style profile plus recent context to stay highly relevant and in-character."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleClearAllData = () => {
    if (clearAllData()) {
      setShowClearConfirm(false);
      showToast({
        type: 'success',
        title: 'All Data Cleared',
        message: 'All personas and training data have been removed successfully.',
        duration: 4000
      });
    } else {
      showToast({
        type: 'error',
        title: 'Failed to Clear Data',
        message: 'There was an error clearing your data. Please try again.',
        duration: 5000
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection isVisible={isVisible} />

      {/* Section Separator */}
      <SectionContainer border="both">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </SectionContainer>

      {/* Features Section */}
      <FeaturesSection />

      {/* Section Separator */}
      <SectionContainer border="both">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </SectionContainer>

      {/* Supported Formats Section */}
      <SupportedFormatsSection />

      {/* Section Separator */}
      <SectionContainer border="both">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </SectionContainer>

      {/* Use Cases Section */}
      <UseCasesSection />

      {/* Section Separator */}
      <SectionContainer border="both">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </SectionContainer>

      {/* FAQ Section */}
      <FAQSection 
        faqData={faqData}
        openFAQ={openFAQ}
        onToggleFAQ={toggleFAQ}
        onClearData={() => setShowClearConfirm(true)}
      />

      {/* Section Separator */}
      <SectionContainer border="both">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </SectionContainer>

      {/* Future Roadmap Section */}
      <FutureRoadmapSection />

      {/* Section Separator */}
      <SectionContainer border="both">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </SectionContainer>

      {/* Clear Data Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllData}
        title="Clear All Data?"
        message="This will permanently delete all your personas and training history. This action cannot be undone."
        confirmText="Clear All Data"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
