/**
 * FAQ Data Constants
 * 
 * Centralized FAQ data to ensure consistency and easy maintenance.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import { FAQItem } from '@/types/ui';

export const FAQ_DATA: FAQItem[] = [
  {
    question: "How does the AI create personas?",
    answer: "After you upload your chat exports, our system parses and groups messages by contact, then runs a one-time LLM analysis on each person's last 15–20 turns to extract their tone, vocabulary, and quirks. That distilled style profile plus the recent history becomes the \"digital twin\" you practice against."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. All processing happens in your browser or serverless functions—your chat files are never stored long-term. For the MVP, persona data lives only in your localStorage, and you can clear it at any time."
  },
  {
    question: "Can I practice with multiple personas?",
    answer: "Absolutely. Each unique contact you upload becomes its own persona. You can pick any of them on the dashboard and practice conversations tailored to that individual's style."
  },
  {
    question: "What kind of feedback do I get?",
    answer: "After every reply, you'll see a positivity score from 0–100 and exactly three actionable tips on how to improve tone, clarity, or phrasing—based directly on the persona's style profile."
  },
  {
    question: "How accurate are the AI responses?",
    answer: "The AI replies mimic the exact wording patterns and tone distilled from your real conversations. While it won't remember every single detail, it uses the extracted style profile plus recent context to stay highly relevant and in-character."
  }
];
