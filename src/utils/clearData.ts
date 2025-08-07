import { StoredPersona } from "@/types/persona";

export const clearAllData = () => {
  try {
    // Clear personas data
    localStorage.removeItem('personas');
    
    // Clear any other potential data keys
    const keysToRemove = [
      'personas',
      'chatHistory',
      'scorePanelData',
      'uploadedFiles',
      'sessionId',
      'usageInfo', // Clear usage info since API doesn't rely on it
      'totalPersonasCreated' // Legacy key that might exist
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear any persona-specific score panel data
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('scorePanel_')) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

export const clearPersonaHistory = (personaId: string) => {
  try {
    const storedPersonas = localStorage.getItem('personas');
    if (storedPersonas) {
      const personas = JSON.parse(storedPersonas);
      const updatedPersonas = personas.map((persona: StoredPersona) => {
        if (persona.id === personaId) {
          return {
            ...persona,
            chatHistory: [] // Clear only the chat history, keep the transcript
          };
        }
        return persona;
      });
      localStorage.setItem('personas', JSON.stringify(updatedPersonas));
    }
    
    // Clear persona-specific score panel data
    localStorage.removeItem(`scorePanel_${personaId}`);
    
    return true;
  } catch (error) {
    console.error('Error clearing persona history:', error);
    return false;
  }
}; 