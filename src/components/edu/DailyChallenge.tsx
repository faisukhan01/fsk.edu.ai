'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, XCircle, RotateCcw, Loader2, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChallengeData {
  date: string;
  question: string;
  options: string[];
  subject: string;
  difficulty: string;
  stats: {
    attempted: number;
    correct: number;
  };
  answered?: boolean;
}

interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  explanation: string;
  stats: {
    attempted: number;
    correct: number;
  };
}

const difficultyColors: Record<string, string> = {
  Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Hard: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const optionLabels = ['A', 'B', 'C', 'D'];

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function DailyChallenge() {
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [shaking, setShaking] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    fetch('/api/daily-challenge')
      .then(r => r.json())
      .then(data => {
        if (mountedRef.current) {
          setChallenge(data);
          if (data.answered) setAlreadyAnswered(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) setLoading(false);
      });
    return () => { mountedRef.current = false; };
  }, []);

  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/daily-challenge');
      const data = await res.json();
      setChallenge(data);
      if (data.answered) setAlreadyAnswered(true);
    } catch {
      // Silently fail
    }
    setLoading(false);
  };

  const handleSubmit = async (index: number) => {
    if (submitting || result || alreadyAnswered) return;
    setSelectedIndex(index);
    setSubmitting(true);

    try {
      const res = await fetch('/api/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedIndex: index }),
      });
      const data: AnswerResult = await res.json();

      if (!data.correct) {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
      }
      setResult(data);
    } catch {
      // Silently fail
    }
    setSubmitting(false);
  };

  const handleNewChallenge = async () => {
    if (!result && !alreadyAnswered) return;
    setSelectedIndex(null);
    setResult(null);
    setAlreadyAnswered(false);
    setLoading(true);

    try {
      const res = await fetch('/api/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'new' }),
      });
      const data = await res.json();
      setChallenge(data);
    } catch {
      // Silently fail
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-card h-full">
        <CardContent className="p-4 md:p-5 flex items-center justify-center min-h-[160px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading today's challenge...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card className="border-0 shadow-sm bg-card h-full">
        <CardContent className="p-4 md:p-5 flex items-center justify-center min-h-[160px]">
          <div className="flex flex-col items-center gap-2 text-center">
            <Brain className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Could not load challenge</p>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={fetchChallenge}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-card h-full overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-950/20 dark:via-emerald-950/20 dark:to-cyan-950/20 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Daily Challenge</CardTitle>
              <p className="text-[10px] text-muted-foreground">{getTodayFormatted()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className={`text-[9px] h-5 border-0 ${difficultyColors[challenge.difficulty] || difficultyColors.Medium}`}>
              {challenge.difficulty}
            </Badge>
            <Badge variant="secondary" className="text-[9px] h-5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border-0">
              {challenge.subject}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>🏆 {challenge.stats.attempted} attempted</span>
          <span>✅ {challenge.stats.correct} correct</span>
          {challenge.stats.attempted > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {Math.round((challenge.stats.correct / challenge.stats.attempted) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-3 leading-relaxed">{challenge.question}</p>

        {/* Options */}
        <div className="space-y-1.5">
          {challenge.options.map((option, i) => {
            let optionStyle = 'border-border hover:bg-muted/50 hover:border-primary/30';
            let iconEl = null;

            if (result) {
              if (i === result.correctIndex) {
                optionStyle = 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                iconEl = <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
              } else if (i === selectedIndex && !result.correct) {
                optionStyle = 'border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/20';
                iconEl = <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
              } else {
                optionStyle = 'opacity-50 border-border';
              }
            } else if (submitting && i === selectedIndex) {
              optionStyle = 'border-primary/50 bg-primary/5';
              iconEl = <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />;
            }

            return (
              <motion.button
                key={i}
                onClick={() => handleSubmit(i)}
                disabled={!!result || submitting || alreadyAnswered}
                animate={shaking && i === selectedIndex ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : {}}
                transition={{ duration: 0.5 }}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer disabled:cursor-default ${optionStyle}`}
              >
                <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                  {optionLabels[i]}
                </span>
                <span className="text-xs flex-1 leading-relaxed">{option}</span>
                {iconEl}
              </motion.button>
            );
          })}
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3"
            >
              <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                result.correct
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50'
              }`}>
                <p className={`font-semibold mb-1 ${result.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {result.correct ? '🎉 Correct!' : '😅 Not quite!'}
                </p>
                <p className="text-muted-foreground">{result.explanation}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 h-8 text-xs gap-1.5 border-primary/20 hover:bg-primary/5"
                onClick={handleNewChallenge}
              >
                <RotateCcw className="w-3 h-3" />
                New Challenge
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Already answered state */}
        {alreadyAnswered && !result && (
          <div className="mt-3">
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <p className="text-xs text-muted-foreground mb-2">You&apos;ve already answered today&apos;s challenge!</p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleNewChallenge}
              >
                <RotateCcw className="w-3 h-3" />
                New Challenge
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
