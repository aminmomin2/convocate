/**
 * usePersonas Hook
 * 
 * Custom hook for managing personas including loading, saving, and
 * retrieving persona data from localStorage.
 * 
 * @author Amin Momin
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { StoredPersona } from '@/types/persona';

interface UsePersonasProps {
  personaId?: string;
}

interface PersonaStats {
  messageCount: number;
  lastMessageTime: string;
  currentPersona: StoredPersona | null;
}

export const usePersonas = ({ personaId }: UsePersonasProps) => {
  const [personas, setPersonas] = useState<StoredPersona[]>([]);
  const [stats, setStats] = useState<PersonaStats>({
    messageCount: 0,
    lastMessageTime: '',
    currentPersona: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  /**
   * Load all personas from localStorage
   */
  const loadPersonas = useCallback(() => {
    try {
      const storedPersonas = localStorage.getItem('personas');
      if (storedPersonas) {
        const parsedPersonas: StoredPersona[] = JSON.parse(storedPersonas);
        setPersonas(parsedPersonas);
        return parsedPersonas;
      }
      return [];
    } catch (error) {
      console.error('Failed to load personas:', error);
      setError('Failed to load personas');
      return [];
    }
  }, []);

  /**
   * Save personas to localStorage
   */
  const savePersonas = useCallback((updatedPersonas: StoredPersona[]) => {
    try {
      localStorage.setItem('personas', JSON.stringify(updatedPersonas));
      setPersonas(updatedPersonas);
      return true;
    } catch (error) {
      console.error('Failed to save personas:', error);
      setError('Failed to save personas');
      return false;
    }
  }, []);

  /**
   * Add new personas
   */
  const addPersonas = useCallback((newPersonas: StoredPersona[]) => {
    const updatedPersonas = [...personas, ...newPersonas];
    return savePersonas(updatedPersonas);
  }, [personas, savePersonas]);

  /**
   * Update a specific persona
   */
  const updatePersona = useCallback((personaId: string, updates: Partial<StoredPersona>) => {
    const updatedPersonas = personas.map(persona => 
      persona.id === personaId ? { ...persona, ...updates } : persona
    );
    return savePersonas(updatedPersonas);
  }, [personas, savePersonas]);

  /**
   * Delete a persona
   */
  const deletePersona = useCallback((personaId: string) => {
    const updatedPersonas = personas.filter(persona => persona.id !== personaId);
    return savePersonas(updatedPersonas);
  }, [personas, savePersonas]);

  /**
   * Get persona statistics
   */
  const getPersonaStats = useCallback((targetPersonaId: string): PersonaStats => {
    const currentPersona = personas.find(p => p.id === targetPersonaId);
    
    if (!currentPersona) {
      return {
        messageCount: 0,
        lastMessageTime: '',
        currentPersona: null,
      };
    }

    // Calculate total message count
    const transcriptCount = currentPersona.transcript?.length || 0;
    const chatHistoryCount = currentPersona.chatHistory?.length || 0;
    const totalMessages = transcriptCount + chatHistoryCount;

    // Get last message time
    const allMessages = [...(currentPersona.chatHistory || []), ...(currentPersona.transcript || [])];
    let lastMessageTime = '';
    
    if (allMessages.length > 0) {
      const lastMessage = allMessages[allMessages.length - 1];
      if (lastMessage.timestamp) {
        const date = new Date(lastMessage.timestamp);
        lastMessageTime = date.toLocaleDateString();
      }
    }

    return {
      messageCount: totalMessages,
      lastMessageTime,
      currentPersona,
    };
  }, [personas]);

  /**
   * Clear all personas
   */
  const clearAllPersonas = useCallback(() => {
    try {
      localStorage.removeItem('personas');
      setPersonas([]);
      setStats({
        messageCount: 0,
        lastMessageTime: '',
        currentPersona: null,
      });
      return true;
    } catch (error) {
      console.error('Failed to clear personas:', error);
      setError('Failed to clear personas');
      return false;
    }
  }, []);

  /**
   * Load personas on mount
   */
  useEffect(() => {
    setIsLoading(true);
    loadPersonas();
    setIsLoading(false);
  }, [loadPersonas]);

  /**
   * Update stats when personaId or personas change
   */
  useEffect(() => {
    if (personaId) {
      const newStats = getPersonaStats(personaId);
      setStats(newStats);
    }
  }, [personaId, personas, getPersonaStats]);

  return {
    // State
    personas,
    stats,
    isLoading,
    error,
    
    // Actions
    loadPersonas,
    savePersonas,
    addPersonas,
    updatePersona,
    deletePersona,
    getPersonaStats,
    clearAllPersonas,
  };
};
