'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Copy, Check, Volume2, VolumeX, Sparkles,
  Trash2, Code, Brain, History,
  Lightbulb, Save, ChevronRight, Loader2, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { speakWithFallback, stopBrowserSpeak } from '@/lib/tts';
import { useAppStore } from '@/lib/store';
import type { SolverProblemType } from '@/lib/store';

const typeOptions: { id: SolverProblemType; label: string; icon: React.ElementType; ariaLabel: string }[] = [
  { id: 'math', label: 'Math', icon: Calculator, ariaLabel: 'Math Problems' },
  { id: 'code', label: 'Code', icon: Code, ariaLabel: 'Code Challenges' },
  { id: 'general', label: 'General', icon: BookOpen, ariaLabel: 'General Questions' },
];

const typeBadgeColors: Record<string, string> = {
  math: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  code: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  general: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const suggestions: Record<SolverProblemType, string[]> = {
  math: [
    'Solve: x\u00B2 + 5x + 6 = 0',
    'Find the derivative of sin(x)',
    'Integrate x\u00B3 dx',
  ],
  code: [
    'Reverse a linked list in Python',
    'Implement binary search',
    'Sort an array in JS',
  ],
  general: [
    'Explain Newton\'s Laws of Motion',
    'What is Big O notation?',
  ],
};

const loadingMessages: Record<SolverProblemType, string> = {
  math: 'Solving your math problem...',
  code: 'Analyzing your code...',
  general: 'Researching your question...',
};

interface SolvedProblem {
  id: string;
  question: string;
  solution: string;
  type: string;
  createdAt: string;
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MathSolverView() {
  const { solver, setSolver } = useAppStore();
  const { question, selectedType, solution, solutionType, error } = solver;

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [history, setHistory] = useState<SolvedProblem[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/solved');
      const data = await res.json();
      if (data.problems) {
        setHistory(data.problems);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSolve = async () => {
    if (!question.trim() || isLoading) return;
    setIsLoading(true);
    setSolver({ solution: '', solutionType: selectedType, error: '' });
    setIsSaved(false);

    try {
      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), type: selectedType }),
      });
      const data = await res.json();
      if (data.solution) {
        setSolver({ solution: data.solution });
      } else if (data.error) {
        setSolver({ error: data.error });
      }
    } catch {
      setSolver({ error: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
      stopBrowserSpeak();
      setIsSpeaking(false);
      return;
    }
    try {
      setIsSpeaking(true);
      const { audio } = await speakWithFallback(solution);
      if (audio) {
        currentAudioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
        audio.play();
      } else {
        const wordCount = solution.split(/\s+/).length;
        setTimeout(() => setIsSpeaking(false), Math.min((wordCount / 2.5) * 1000, 30000));
      }
    } catch { setIsSpeaking(false); }
  };

  const handleSave = async () => {
    if (!solution || !question.trim()) return;
    try {
      const res = await fetch('/api/solved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          question: question.trim(),
          solution,
          type: solutionType,
        }),
      });
      if (res.ok) {
        setIsSaved(true);
        fetchHistory();
      }
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/solved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      setHistory((prev) => prev.filter((p) => p.id !== id));
    } catch {
      /* ignore */
    }
  };

  const handleLoadHistory = (item: SolvedProblem) => {
    setSolver({
      question: item.question,
      solution: item.solution,
      solutionType: item.type as SolverProblemType,
      selectedType: item.type as SolverProblemType,
      error: '',
    });
    setIsSaved(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSolve();
    }
  };

  const hasContent = solution || isLoading || error;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-violet-500/20">
          <Calculator className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">AI Solver</h2>
          <p className="text-xs text-muted-foreground">Get step-by-step solutions for math, code, and general problems</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Question Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Enter your problem
                </label>
                <Textarea
                  value={question}
                  onChange={(e) => setSolver({ question: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your math problem, code question, or any academic question here..."
                  className="min-h-[120px] text-sm rounded-xl border-primary/20 focus:border-primary/50 resize-y"
                />
              </div>

              {/* Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Problem type
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((opt) => (
                    <Tooltip key={opt.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSolver({ selectedType: opt.id })}
                          aria-label={opt.ariaLabel}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                            selectedType === opt.id
                              ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700 shadow-sm'
                              : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                          }`}
                        >
                          <opt.icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{opt.ariaLabel}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Quick suggestions
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestions[selectedType].map((s, i) => (
                    <button
                      key={`${selectedType}-${i}`}
                      onClick={() => setSolver({ question: s })}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground transition-colors border border-border/50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solve Button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+Enter</kbd> to solve
                </p>
                <Button
                  onClick={handleSolve}
                  disabled={!question.trim() || isLoading}
                  className="ml-auto h-11 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium shadow-sm shadow-violet-500/20"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Solving...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Solve
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Results / Loading / Empty / Error */}
            <AnimatePresence mode="wait">
              {error && !isLoading ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-0 shadow-sm bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 text-red-500">
                        <VolumeX className="w-4 h-4" />
                        <p className="text-sm font-medium">Error</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{error}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : solution && !isLoading ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-0 shadow-md bg-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
                    <CardContent className="p-5">
                      {/* Top Bar: Type Badge + Action Buttons */}
                      <div className="flex items-center justify-between mb-4">
                        <Badge
                          variant="outline"
                          className={typeBadgeColors[solutionType] || ''}
                        >
                          {typeOptions.find((t) => t.id === solutionType)?.label || 'Math'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                                {copied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{copied ? 'Copied!' : 'Copy solution'}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSpeak}>
                                {isSpeaking ? (
                                  <VolumeX className="w-3.5 h-3.5" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isSpeaking ? 'Stop speaking' : 'Read aloud'}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleSave}
                                disabled={isSaved}
                              >
                                {isSaved ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isSaved ? 'Saved!' : 'Save to history'}</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Solution Content */}
                      <ScrollArea className="max-h-[500px]">
                        <div className="markdown-content text-sm leading-relaxed pr-3">
                          <ReactMarkdown>{solution}</ReactMarkdown>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="relative w-16 h-16 mb-5">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-900/40" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{loadingMessages[selectedType]}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI is analyzing your problem step by step
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Empty State - 3 Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-5 flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
                            <Calculator className="w-6 h-6 text-violet-500" />
                          </div>
                          <h3 className="font-semibold text-sm mb-1.5">Math Problems</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Equations, calculus, algebra, statistics, and more. Get step-by-step solutions with clear explanations.
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-5 flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                            <Code className="w-6 h-6 text-emerald-500" />
                          </div>
                          <h3 className="font-semibold text-sm mb-1.5">Code Challenges</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Algorithms, data structures, debugging, and optimization. Get working code with complexity analysis.
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow h-full">
                        <CardContent className="p-5 flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                            <Lightbulb className="w-6 h-6 text-amber-500" />
                          </div>
                          <h3 className="font-semibold text-sm mb-1.5">General Questions</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Physics, chemistry, engineering concepts, and more. Get clear academic explanations with examples.
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* History Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/50 backdrop-blur-sm border">
                  <History className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-semibold">Recent Solutions</h3>
                  <Badge variant="secondary" className="text-xs ml-1">
                    {history.length}
                  </Badge>
                </div>
              </div>

              {history.length === 0 ? (
                <Card className="border-0 shadow-sm bg-card">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No saved solutions yet. Solve a problem and save it to see it here!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2 pr-3">
                    {history.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow duration-200">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <button
                                onClick={() => handleLoadHistory(item)}
                                className="flex-1 text-left group"
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${typeBadgeColors[item.type] || typeBadgeColors.math}`}
                                  >
                                    {item.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(item.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/80 line-clamp-1 group-hover:text-foreground transition-colors">
                                  {item.question.substring(0, 80)}
                                  {item.question.length > 80 ? '...' : ''}
                                </p>
                              </button>
                              <div className="flex items-center gap-1 shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleLoadHistory(item)}
                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                    >
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>View solution</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}