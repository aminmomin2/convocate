"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { StoredPersona } from '@/types/persona';

interface PersonaNamingProps {
  personas: StoredPersona[];
  onComplete: (namedPersonas: StoredPersona[]) => void;
  onCancel?: () => void;
}

export default function PersonaNaming({ personas, onComplete, onCancel }: PersonaNamingProps) {
  const [namedPersonas, setNamedPersonas] = useState<StoredPersona[]>(
    personas.map(p => ({ ...p, name: p.name }))
  );

  const handleNameChange = (index: number, newName: string) => {
    setNamedPersonas(prev => 
      prev.map((persona, i) => 
        i === index ? { ...persona, name: newName } : persona
      )
    );
  };

  const handleComplete = () => {
    // Filter out personas with empty names
    const validPersonas = namedPersonas.filter(p => p.name.trim() !== '');
    onComplete(validPersonas);
  };

  const isValid = namedPersonas.some(p => p.name.trim() !== '');

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Name Your Personas
        </CardTitle>
        <CardDescription>
          Give meaningful names to your chat personas for easier identification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {namedPersonas.map((persona, index) => (
            <div key={persona.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-lg">
                  {persona.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  value={persona.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(index, e.target.value)}
                  placeholder="Enter persona name..."
                  className="font-medium"
                />
                <p className="text-sm text-muted-foreground">
                  {persona.messageCount} messages • Originally: {persona.id}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleComplete}
            disabled={!isValid}
            className="flex-1"
          >
            Continue to Dashboard
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          You can skip personas by leaving their name empty
        </div>
      </CardContent>
    </Card>
  );
}