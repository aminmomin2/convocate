/**
 * DashboardPage Component
 * 
 * Main dashboard interface that orchestrates all dashboard-related components.
 * This component consolidates the dashboard functionality from the dashboard page.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

"use client"
import React, { useState, useEffect } from 'react';
import { ConfirmationModal } from '@/components/ui';
import { PageContainer, SectionContainer } from '@/components/layout';
import { StoredPersona } from '@/types/persona';
import { clearAllData } from '@/utils/clearData';
import { useToast } from '@/components/ui/toast';
import { getUsageInfo, initializeUsageInfo } from '@/utils/fetcher';
import {
  DashboardHeader,
  UsageLimitsCard,
  PersonasGrid,
  EmptyState,
  AddMorePersonas,
  LoadingSpinner
} from './components';

const MAX_PERSONAS_PER_IP = 2;
const MAX_MESSAGES_PER_IP = 40;

export default function DashboardPage() {
  const { showToast } = useToast();
  const [personas, setPersonas] = useState<StoredPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ totalMessagesUsed: number; maxMessagesPerIP: number; totalPersonasCreated: number }>({
    totalMessagesUsed: 0,
    maxMessagesPerIP: MAX_MESSAGES_PER_IP,
    totalPersonasCreated: 0
  });

  const loadPersonas = () => {
    const storedPersonas = localStorage.getItem('personas');
    if (storedPersonas) {
      try {
        const parsedPersonas: StoredPersona[] = JSON.parse(storedPersonas);
        const personasWithDescription: StoredPersona[] = parsedPersonas.map((p: StoredPersona) => ({
          ...p,
          description: p.description || `Chat persona with ${p.transcript?.length || 0} messages`,
        }));
        setPersonas(personasWithDescription);
      } catch (error) {
        console.error('Failed to parse stored personas:', error);
        setPersonas([]);
      }
    } else {
      setPersonas([]);
    }
  };

  useEffect(() => {
    loadPersonas();
    
    // Initialize and load usage info
    initializeUsageInfo();
    const usage = getUsageInfo();
    if (usage) {
      setUsageInfo({
        totalMessagesUsed: usage.totalMessagesUsed,
        maxMessagesPerIP: usage.maxMessagesPerIP,
        totalPersonasCreated: usage.totalPersonasCreated
      });
    }
    
    setLoading(false);
  }, []);

  const handleClearAllData = () => {
    if (clearAllData()) {
      setPersonas([]);
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

  const handleDeletePersona = (personaId: string) => {
    try {
      const storedPersonas = localStorage.getItem('personas');
      if (storedPersonas) {
        const personas = JSON.parse(storedPersonas);
        const updatedPersonas = personas.filter((persona: StoredPersona) => persona.id !== personaId);
        localStorage.setItem('personas', JSON.stringify(updatedPersonas));
        
        // Also clear persona-specific score panel data
        localStorage.removeItem(`scorePanel_${personaId}`);
        
        loadPersonas(); // Reload personas to reflect changes
        
        showToast({
          type: 'success',
          title: 'Persona Deleted',
          message: 'The persona has been removed successfully.',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error deleting persona:', error);
      showToast({
        type: 'error',
        title: 'Failed to Delete Persona',
        message: 'There was an error deleting the persona. Please try again.',
        duration: 5000
      });
    }
  };

  // Use server-side message count instead of client-side chat history
  const totalMessages = usageInfo.totalMessagesUsed;

  // Use server-side persona count instead of client-side count
  const canCreateMorePersonas = usageInfo.totalPersonasCreated < MAX_PERSONAS_PER_IP;
  const hasActiveSessions = personas.some(p => p.chatHistory?.length > 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <PageContainer background="gradient">
      <SectionContainer spacing="lg">
        <DashboardHeader 
          hasActiveSessions={hasActiveSessions}
          hasPersonas={personas.length > 0}
          onClearAllData={() => setShowClearConfirm(true)}
        />

        {/* Usage Limits Info */}
        {personas.length > 0 && (
          <UsageLimitsCard
            totalPersonasCreated={usageInfo.totalPersonasCreated}
            maxPersonasPerIP={MAX_PERSONAS_PER_IP}
            totalMessagesUsed={totalMessages}
            maxMessagesPerIP={usageInfo.maxMessagesPerIP}
          />
        )}

        {/* Clear All Data Confirmation Modal */}
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

        {/* Personas Content */}
        {personas.length === 0 ? (
          <EmptyState />
        ) : (
          <SectionContainer spacing="md">
            <PersonasGrid 
              personas={personas} 
              onDeletePersona={handleDeletePersona} 
            />

            {/* Add More Personas Section */}
            {canCreateMorePersonas && (
              <AddMorePersonas maxPersonasPerIP={MAX_PERSONAS_PER_IP} />
            )}
          </SectionContainer>
        )}
      </SectionContainer>
    </PageContainer>
  );
}
