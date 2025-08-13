/**
 * FAQSection Component
 * 
 * Frequently Asked Questions section with expandable answers.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import React from 'react';
import { Button } from '@/components/ui/button';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqData: FAQItem[];
  openFAQ: number | null;
  onToggleFAQ: (index: number) => void;
  onClearData: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ 
  faqData, 
  openFAQ, 
  onToggleFAQ,
  onClearData
}) => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-purple-600 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Common questions about our AI-powered digital twin platform
          </p>
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={onClearData}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All My Data
            </Button>
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqData.map((item, index) => (
              <div
                key={index}
                className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <button
                  onClick={() => onToggleFAQ(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.question}</h3>
                  <svg
                    className={`w-6 h-6 text-purple-600 dark:text-purple-400 transition-transform duration-300 ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-8 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
