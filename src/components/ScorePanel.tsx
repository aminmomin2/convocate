import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Target, Trash2 } from 'lucide-react';

interface ScorePanelProps {
  isMobile?: boolean;
  score?: number | null;
  previousScore?: number | null;
  tips?: string[];
  onClearHistory?: () => void;
  hasTrainingHistory?: boolean;
  isLoading?: boolean; // New loading prop
}

export default function ScorePanel({ 
  isMobile = false, 
  score = null, 
  previousScore = null,
  tips = [], 
  onClearHistory,
  hasTrainingHistory = false,
  isLoading = false // New loading prop
}: ScorePanelProps) {
  // Use provided score or default
  const outcomeScore = score ?? 0;
  const hasTips = tips.length > 0;
  const hasScore = score !== null;
  
  // Helper function to get score color
  const getScoreColor = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return 'text-primary';
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-primary';
  };

  // Loading skeleton component for score
  const ScoreLoadingSkeleton = () => (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <div className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-muted to-muted/60 animate-pulse`} />
        {/* Inner circle with shimmer effect */}
        <div className={`absolute inset-2 ${isMobile ? 'w-12 h-12' : 'w-20 h-20'} rounded-full bg-gradient-to-br from-muted/80 to-muted/40 animate-pulse`} />
      </div>
      <div className="text-center space-y-2">
        <div className={`${isMobile ? 'h-3 w-16' : 'h-4 w-20'} bg-gradient-to-r from-muted to-muted/60 rounded animate-pulse mx-auto`} />
        {!isMobile && (
          <div className="h-3 w-32 bg-gradient-to-r from-muted/80 to-muted/40 rounded animate-pulse mx-auto" />
        )}
      </div>
    </div>
  );

  // Loading skeleton component for tips
  const TipsLoadingSkeleton = () => (
    <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
      {[1, 2, 3].map((index) => (
        <div key={index} className="flex items-start gap-2">
          <div className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5'} rounded-full bg-gradient-to-br from-muted to-muted/60 animate-pulse flex-shrink-0`} />
          <div className="flex-1 space-y-1">
            <div 
              className={`${isMobile ? 'h-2' : 'h-3'} bg-gradient-to-r from-muted to-muted/60 rounded animate-pulse`} 
              style={{ 
                width: `${Math.random() * 40 + 60}%`,
                animationDelay: `${index * 100}ms`
              }} 
            />
            <div 
              className={`${isMobile ? 'h-2' : 'h-3'} bg-gradient-to-r from-muted/80 to-muted/40 rounded animate-pulse`} 
              style={{ 
                width: `${Math.random() * 30 + 40}%`,
                animationDelay: `${index * 150}ms`
              }} 
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`space-y-4 ${isMobile ? '' : 'h-full flex flex-col'}`}>
      {/* Outcome Score */}
      <Card className={`flex-shrink-0 ${isMobile ? 'shadow-none border-none bg-transparent' : ''}`}>
        <CardHeader className={`${isMobile ? 'pb-1' : 'pb-3'}`}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-base'}`}>
            <Target className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5'} text-primary ${isLoading ? 'animate-pulse' : ''}`} />
            {isMobile ? 'Score' : 'Outcome Score'}
            {isLoading && (
              <div className="flex space-x-1 ml-2">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || (hasScore && score === 0) ? (
            <ScoreLoadingSkeleton />
          ) : hasScore && score !== 0 ? (
            /* Score Circle/Gauge */
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} rounded-full bg-muted flex items-center justify-center`}>
                  <div className={`${isMobile ? 'w-12 h-12' : 'w-20 h-20'} rounded-full flex items-center justify-center ring-4 ring-primary/20 ${
                    getScoreColor(score, previousScore) === 'text-green-600' 
                      ? 'bg-green-100' 
                      : getScoreColor(score, previousScore) === 'text-red-600'
                      ? 'bg-red-100'
                      : 'bg-primary/10'
                  }`}>
                    <span className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold ${
                      getScoreColor(score, previousScore)
                    }`}>
                      {Math.round(outcomeScore)}%
                    </span>
                  </div>
                </div>

              </div>
              
              <div className="text-center">
                <p className={`${isMobile ? 'text-xs' : 'text-base'} font-medium`}>
                  {outcomeScore >= 95 ? 'Exceptional!' : 
                   outcomeScore >= 90 ? 'Excellent!' : 
                   outcomeScore >= 85 ? 'Very Good!' : 
                   outcomeScore >= 80 ? 'Good!' : 
                   outcomeScore >= 75 ? 'Fairly Good!' : 
                   outcomeScore >= 70 ? 'Fair!' : 
                   outcomeScore >= 65 ? 'Below Average' : 
                   outcomeScore >= 60 ? 'Needs Work' : 
                   'Getting Started'}
                </p>
                {!isMobile && (
                  <p className="text-sm text-muted-foreground">
                    {outcomeScore >= 95 ? 'Perfect authentic voice match' :
                     outcomeScore >= 90 ? 'Excellent authentic voice match' :
                     outcomeScore >= 85 ? 'Very good authentic voice match' :
                     outcomeScore >= 80 ? 'Good authentic voice match' :
                     outcomeScore >= 75 ? 'Fairly good authentic voice match' :
                     outcomeScore >= 70 ? 'Fair authentic voice match' :
                     outcomeScore >= 65 ? 'Below average authentic voice match' :
                     outcomeScore >= 60 ? 'Needs improvement in authentic voice' :
                     'Keep practicing to improve your authentic voice'}
                  </p>
                )}
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
      <Card className={`flex-1 min-h-0 ${isMobile ? 'shadow-none border-none bg-transparent' : ''}`}>
        <CardHeader className={`${isMobile ? 'pb-1' : 'pb-3'}`}>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-base'}`}>
            <Lightbulb className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5'} text-yellow-500 ${isLoading ? 'animate-pulse' : ''}`} />
            {isMobile ? 'Tips' : 'Tips for Improvement'}
            {isLoading && (
              <div className="flex space-x-1 ml-2">
                <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || (hasTips && tips.length === 1 && tips[0] === "Response generated. Scoring in progress.") ? (
            <TipsLoadingSkeleton />
          ) : hasTips ? (
            <ul className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className={`${isMobile ? 'w-3 h-3 mt-0' : 'w-5 h-5 mt-1'} rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0`}>
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

      {/* Clear Training History Button */}
      {onClearHistory && (
        <Card className={`flex-shrink-0 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 ${isMobile ? 'shadow-none' : ''}`}>
          <CardHeader className={`${isMobile ? 'pb-2' : 'pb-4'}`}>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-lg'} text-red-700 dark:text-red-300`}>
              <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5'}`} />
              {isMobile ? 'History' : 'Training History'}
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