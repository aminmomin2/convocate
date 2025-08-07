"use client"
import React, { useState, useEffect, useCallback } from 'react';
import PersonaSelector from '@/components/PersonaSelector';
import ChatWindow from '@/components/ChatWindow';
import ScorePanel from '@/components/ScorePanel';
import { StoredPersona } from '@/types/persona';
import { clearPersonaHistory } from '@/utils/clearData';
import { useToast } from '@/components/ui/toast';

interface PersonaDetailPageProps {
  params: Promise<{
    personaId: string;
  }>;
}

interface PersonaData {
  name: string;
  description: string;
}

interface ScorePanelData {
  score: number | null;
  tips: string[];
  messageCount: number;
}



export default function PersonaDetailPage({ params }: PersonaDetailPageProps) {
  const resolvedParams = React.use(params);
  const { showToast } = useToast();
  const [persona, setPersona] = useState<PersonaData>({ name: 'Loading...', description: 'Loading persona data...' });
  const [loading, setLoading] = useState(true);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [currentTips, setCurrentTips] = useState<string[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [hasLoadedScorePanelData, setHasLoadedScorePanelData] = useState(false);
  const [hasTrainingHistory, setHasTrainingHistory] = useState(false);
  const [chatRefreshKey, setChatRefreshKey] = useState(0);

  // Load score panel data from localStorage
  const loadScorePanelData = useCallback(() => {
    try {
      const dataKey = `scorePanel_${resolvedParams.personaId}`;
      const savedData = localStorage.getItem(dataKey);
      
      if (savedData) {
        const panelData: ScorePanelData = JSON.parse(savedData);
        console.log(`Loading ScorePanel data for persona ${resolvedParams.personaId}:`, panelData);
        setCurrentScore(panelData.score);
        setCurrentTips(panelData.tips || []);
        setMessageCount(panelData.messageCount || 0);
      } else {
        // Reset state for new persona with no saved data
        console.log(`No ScorePanel data found for persona ${resolvedParams.personaId}, resetting state`);
        setCurrentScore(null);
        setCurrentTips([]);
        setMessageCount(0);
      }
      setHasLoadedScorePanelData(true);
    } catch (error) {
      console.error('Failed to load score panel data:', error);
      // Reset state on error
      setCurrentScore(null);
      setCurrentTips([]);
      setMessageCount(0);
      setHasLoadedScorePanelData(true);
    }
  }, [resolvedParams.personaId]);

  useEffect(() => {
    const loadPersonaFromStorage = () => {
      try {
        const storedPersonas = localStorage.getItem('personas');
        if (storedPersonas) {
          const personas: StoredPersona[] = JSON.parse(storedPersonas);
          const currentPersona = personas.find((p: StoredPersona) => p.id === resolvedParams.personaId);
          
          if (currentPersona) {
            setPersona({
              name: currentPersona.name,
              description: `Chat persona with ${currentPersona.transcript?.length || 0} messages`,
            });
          } else {
            // Persona not found
            setPersona({ name: 'Persona Not Found', description: 'This persona could not be found. Please upload chat data to create personas.' });
          }
        } else {
          // No localStorage data
          setPersona({ name: 'No Personas Found', description: 'No personas have been uploaded yet. Please upload chat data to create personas.' });
        }
      } catch (error) {
        console.error('Failed to load persona from localStorage:', error);
        setPersona({ name: 'Error Loading Persona', description: 'There was an error loading the persona data.' });
      } finally {
        setLoading(false);
      }
    };

    loadPersonaFromStorage();
  }, [resolvedParams.personaId]);

  // Load ScorePanel data whenever persona changes
  useEffect(() => {
    setHasLoadedScorePanelData(false); // Reset loading flag when switching personas
    loadScorePanelData();
  }, [resolvedParams.personaId, loadScorePanelData]);

  // Save score panel data to localStorage
  const saveScorePanelData = useCallback(() => {
    try {
      const dataKey = `scorePanel_${resolvedParams.personaId}`;
      const panelData: ScorePanelData = {
        score: currentScore,
        tips: currentTips,
        messageCount: messageCount,
      };
      localStorage.setItem(dataKey, JSON.stringify(panelData));
    } catch (error) {
      console.error('Failed to save score panel data:', error);
    }
  }, [resolvedParams.personaId, currentScore, currentTips, messageCount]);

  // Save score panel data whenever relevant state changes (but only after initial load)
  useEffect(() => {
    if (resolvedParams.personaId && hasLoadedScorePanelData) {
      console.log(`Saving ScorePanel data for persona ${resolvedParams.personaId}`);
      saveScorePanelData();
    }
  }, [saveScorePanelData, resolvedParams.personaId, hasLoadedScorePanelData]);



  // Handle score and tips updates from ChatWindow
  const handleScoreUpdate = useCallback((score: number | null, tips: string[]) => {
    setCurrentScore(score);
    setCurrentTips(tips);
  }, []);

  // Handle message count updates from ChatWindow
  const handleMessageCountUpdate = useCallback((count: number) => {
    setMessageCount(count);
    // Update training history status based on message count
    // We consider it training history if there are more than 1 message (excluding the initial welcome message)
    setHasTrainingHistory(count > 1);
  }, []);

  // Handle clear training history
  const handleClearTrainingHistory = useCallback(() => {
    if (clearPersonaHistory(resolvedParams.personaId)) {
      // Reset score panel data
      setCurrentScore(null);
      setCurrentTips([]);
      setMessageCount(0);
      setHasTrainingHistory(false);
      
      // Clear score panel data from localStorage
      localStorage.removeItem(`scorePanel_${resolvedParams.personaId}`);
      
      // Trigger chat window refresh
      setChatRefreshKey(prev => prev + 1);
      
      // Show success toast
      showToast({
        type: 'success',
        title: 'Training History Cleared',
        message: 'Your training conversations have been cleared successfully.',
        duration: 4000
      });
    } else {
      // Show error toast
      showToast({
        type: 'error',
        title: 'Failed to Clear History',
        message: 'There was an error clearing your training history. Please try again.',
        duration: 5000
      });
    }
  }, [resolvedParams.personaId, showToast]);

  // Check for training history
  useEffect(() => {
    const checkTrainingHistory = () => {
      try {
        const storedPersonas = localStorage.getItem('personas');
        if (storedPersonas) {
          const personas: StoredPersona[] = JSON.parse(storedPersonas);
          const currentPersona = personas.find((p: StoredPersona) => p.id === resolvedParams.personaId);
          if (currentPersona) {
            // Consider it training history if there are actual conversation messages (not just the welcome message)
            const hasRealConversation = (currentPersona.chatHistory?.length || 0) > 0;
            setHasTrainingHistory(hasRealConversation);
          }
        }
      } catch (error) {
        console.error('Failed to check training history:', error);
      }
    };
    
    checkTrainingHistory();
  }, [resolvedParams.personaId, messageCount]);



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading persona...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop Layout: 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-[300px_1fr_300px] lg:h-full">
        {/* Left: Persona Selector */}
        <div className="border-r border-border bg-muted/30 p-6 overflow-y-auto">
          <PersonaSelector 
            personaId={resolvedParams.personaId}
            name={persona.name}
            description={persona.description}
          />
        </div>

        {/* Center: Chat Window */}
        <div className="flex flex-col h-full">
          <ChatWindow 
            key={chatRefreshKey}
            personaId={resolvedParams.personaId} 
            onScoreUpdate={handleScoreUpdate}
            onMessageCountUpdate={handleMessageCountUpdate}
          />
        </div>

        {/* Right: Score Panel */}
        <div className="border-l border-border bg-muted/30 p-6 overflow-y-auto">
          <ScorePanel 
            score={currentScore}
            tips={currentTips}
            messageCount={messageCount}
            onClearHistory={handleClearTrainingHistory}
            hasTrainingHistory={hasTrainingHistory}
          />
        </div>
      </div>

      {/* Mobile/Tablet Layout: Stacked sections */}
      <div className="lg:hidden h-full flex flex-col">
        {/* Persona Selector - Mobile Header */}
        <div className="flex-shrink-0 border-b border-border bg-muted/30 p-4">
          <PersonaSelector 
            personaId={resolvedParams.personaId}
            name={persona.name}
            description={persona.description}
            isMobile={true}
          />
        </div>

        {/* Chat Window - Takes most space */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatWindow 
            key={chatRefreshKey}
            personaId={resolvedParams.personaId} 
            onScoreUpdate={handleScoreUpdate}
            onMessageCountUpdate={handleMessageCountUpdate}
          />
        </div>

        {/* Score Panel - Bottom section */}
        <div className="flex-shrink-0 border-t border-border bg-muted/30 p-4">
          <ScorePanel 
            isMobile={true}
            score={currentScore}
            tips={currentTips}
            messageCount={messageCount}
            onClearHistory={handleClearTrainingHistory}
            hasTrainingHistory={hasTrainingHistory}
          />
        </div>
      </div>
    </div>
  );
}