// src/utils/fetcher.ts

export interface UsageInfo {
  totalMessagesUsed: number;
  maxMessagesPerIP: number;
  totalPersonasCreated: number;
  maxPersonasPerIP: number;
}

// Save usage info to localStorage
export const saveUsageInfo = (usageInfo: UsageInfo) => {
  try {
    localStorage.setItem('usageInfo', JSON.stringify(usageInfo));
  } catch (error) {
    console.error('Failed to save usage info:', error);
  }
};

// Get usage info from localStorage
export const getUsageInfo = (): UsageInfo | null => {
  try {
    const stored = localStorage.getItem('usageInfo');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get usage info:', error);
  }
  return null;
};

// Update total messages used
export const updateTotalMessagesUsed = (newCount: number) => {
  try {
    const currentUsage = getUsageInfo();
    const updatedUsage: UsageInfo = {
      totalMessagesUsed: newCount,
      maxMessagesPerIP: 40,
      totalPersonasCreated: currentUsage?.totalPersonasCreated || 0,
      maxPersonasPerIP: 2
    };
    saveUsageInfo(updatedUsage);
  } catch (error) {
    console.error('Failed to update total messages used:', error);
  }
};

// Update total personas created
export const updateTotalPersonasCreated = (newCount: number) => {
  try {
    const currentUsage = getUsageInfo();
    const updatedUsage: UsageInfo = {
      totalMessagesUsed: currentUsage?.totalMessagesUsed || 0,
      maxMessagesPerIP: 40,
      totalPersonasCreated: newCount,
      maxPersonasPerIP: 2
    };
    saveUsageInfo(updatedUsage);
  } catch (error) {
    console.error('Failed to update total personas created:', error);
  }
};

// Initialize usage info if it doesn't exist
export const initializeUsageInfo = () => {
  try {
    const existing = getUsageInfo();
    if (!existing) {
      // Get current personas count
      const storedPersonas = localStorage.getItem('personas');
      const personas = storedPersonas ? JSON.parse(storedPersonas) : [];
      
      // Get total personas created
      const totalPersonasCreated = localStorage.getItem('totalPersonasCreated');
      const totalCreated = totalPersonasCreated ? parseInt(totalPersonasCreated, 10) : personas.length;
      
      const initialUsage: UsageInfo = {
        totalMessagesUsed: 0,
        maxMessagesPerIP: 40,
        totalPersonasCreated: totalCreated,
        maxPersonasPerIP: 2
      };
      saveUsageInfo(initialUsage);
    }
  } catch (error) {
    console.error('Failed to initialize usage info:', error);
  }
};