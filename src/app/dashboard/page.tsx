"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoredPersona } from '@/types/persona';
import { clearAllData, clearPersonaHistory } from '@/utils/clearData';
import { useToast } from '@/components/ui/toast';

export default function Dashboard() {
  const { showToast } = useToast();
  const [personas, setPersonas] = useState<StoredPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  if (loading) {
    return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading personas...</p>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Your Training Personas
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose a sales persona to train with and improve your skills
              </p>
              {personas.some(p => p.chatHistory?.length > 0) && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">
                    You have active training sessions
                  </span>
                </div>
              )}
            </div>
            
            {/* Clear Data Button */}
            {personas.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All Data
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Clear All Data Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Clear All Data?
              </h3>
              <p className="text-muted-foreground mb-6">
                This will permanently delete all your personas and training history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleClearAllData}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Clear All Data
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Personas Grid */}
        {personas.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              No Personas Yet
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Upload your chat conversations to create AI personas for realistic sales training.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Chat Data
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {personas.map((persona) => (
              <Card key={persona.id} className="group hover:shadow-lg hover:scale-102 transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    {persona.avatar ? (
                      <img 
                        src={persona.avatar} 
                        alt={persona.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-600 dark:bg-slate-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-xl">
                          {persona.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">{persona.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {persona.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{persona.transcript?.length || 0} messages</span>
                    </div>
                    {persona.chatHistory?.length > 0 && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{persona.chatHistory.length} training</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/dashboard/${persona.id}`} className="flex-1">
                      <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 cursor-pointer">
                        {persona.chatHistory?.length > 0 ? 'Continue' : 'Start Training'}
                      </Button>
                    </Link>
                                                               <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePersona(persona.id)}
                        className="px-3 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
                        title="Delete persona"
                      >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       </svg>
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}