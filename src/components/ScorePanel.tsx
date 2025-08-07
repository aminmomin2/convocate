import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Lightbulb, Target, Trash2 } from 'lucide-react';

interface ScorePanelProps {
  isMobile?: boolean;
  score?: number | null;
  tips?: string[];
  messageCount?: number;
  onClearHistory?: () => void;
  hasTrainingHistory?: boolean;
}

export default function ScorePanel({ 
  isMobile = false, 
  score = null, 
  tips = [], 
  messageCount = 0,
  onClearHistory,
  hasTrainingHistory = false
}: ScorePanelProps) {
  // Use provided score or default
  const outcomeScore = score ?? 0;
  const hasTips = tips.length > 0;
  const hasScore = score !== null;

  return (
    <div className={`space-y-4 ${isMobile ? '' : 'h-full flex flex-col'}`}>
      {/* Outcome Score */}
      <Card className="flex-shrink-0">
        <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
            <Target className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary`} />
            Outcome Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasScore ? (
            /* Score Circle/Gauge */
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-muted flex items-center justify-center`}>
                  <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20`}>
                    <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-primary`}>
                      {Math.round(outcomeScore)}%
                    </span>
                  </div>
                </div>
                {/* Score trend indicator - only show if score is meaningful */}
                {outcomeScore > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {outcomeScore >= 70 ? '+' : ''}
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}>
                  {outcomeScore >= 80 ? 'Excellent!' : outcomeScore >= 60 ? 'Good Progress!' : outcomeScore >= 40 ? 'Keep Practicing!' : 'Getting Started'}
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  {outcomeScore >= 80 ? 'Outstanding performance' : 'Keep practicing to improve'}
                </p>
              </div>
            </div>
          ) : (
            /* No score yet */
            <div className="flex flex-col items-center space-y-3 py-4">
              <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-muted flex items-center justify-center`}>
                <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-full bg-muted/50 flex items-center justify-center ring-4 ring-muted/30`}>
                  <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-muted-foreground`}>
                    --
                  </span>
                </div>
              </div>
              
              <div className="text-center">
                <p className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-muted-foreground`}>
                  Start Chatting
                </p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                  Your score will appear here
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="flex-1 min-h-0">
        <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
            <Lightbulb className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-500`} />
            Tips for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasTips ? (
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className={`${isMobile ? 'w-4 h-4 mt-0.5' : 'w-5 h-5 mt-1'} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0`}>
                    <span className={`${isMobile ? 'text-xs' : 'text-xs'} font-semibold text-primary`}>
                      {index + 1}
                    </span>
                  </div>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground leading-relaxed`}>
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <Lightbulb className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground/50 mx-auto mb-2`} />
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                Chat to receive personalized tips
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats (Desktop only) */}
      {!isMobile && messageCount > 0 && (
        <Card className="flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chat Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{messageCount}</p>
              <p className="text-sm text-muted-foreground">Messages Exchanged</p>
            </div>
          </CardContent>
        </Card>
      )}

            {/* Clear Training History Button */}
      {onClearHistory && (
        <Card className="flex-shrink-0 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'} text-red-700 dark:text-red-300`}>
              <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              Training History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-600 dark:text-red-400`}>
              {hasTrainingHistory 
                ? "Clear your training conversations to start fresh with this persona."
                : "No training history to clear. Start chatting to build up your training data."
              }
            </p>
            <Button
              variant="outline"
              onClick={onClearHistory}
              disabled={!hasTrainingHistory}
              className="w-full border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {hasTrainingHistory ? "Clear Training History" : "No History to Clear"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}