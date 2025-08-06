"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoredPersona } from '@/types/persona';



export default function Dashboard() {
  const [personas, setPersonas] = useState<StoredPersona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load uploaded personas from localStorage
    const storedPersonas = localStorage.getItem('personas');
    if (storedPersonas) {
      try {
        const parsedPersonas: StoredPersona[] = JSON.parse(storedPersonas);
        // Add descriptions to stored personas
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
      // No uploaded personas found
      setPersonas([]);
    }
    setLoading(false);
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading personas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Select a Persona
          </h1>
          <p className="text-muted-foreground">
            Choose a sales persona to train with and improve your skills
          </p>
          {personas.some(p => p.messageCount) && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">
                Using your uploaded chat personas
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {personas.map((persona) => (
            <Card key={persona.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  {persona.avatar ? (
                    <img 
                      src={persona.avatar} 
                      alt={persona.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold text-lg">
                        {persona.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">{persona.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {persona.description}
                </p>
                <Link href={`/dashboard/${persona.id}`}>
                  <Button className="w-full">
                    Train
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}