'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Send, Copy, Check, Volume2, VolumeX, Sparkles,
  Trash2, Clock, Hash, ArrowDownUp, Baby, List, BookOpen,
  History, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { speakWithFallback, stopBrowserSpeak } from '@/lib/tts';
import { useAppStore } from '@/lib/store';
import type { SummaryStyle } from '@/lib/store';

interface SavedSummary {
  id: string;
  originalText: string;
  summary: string;
  style: string;
  wordCount: number;
  createdAt: string;
}

const styleOptions: { id: SummaryStyle; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'brief', label: 'Brief', icon: FileText, desc: 'Quick overview' },
  { id: 'detailed', label: 'Detailed', icon: BookOpen, desc: 'Comprehensive' },
  { id: 'bullet-points', label: 'Bullet Points', icon: List, desc: 'Organized list' },
  { id: 'eli5', label: 'ELI5', icon: Baby, desc: 'Explain Like I\'m 5' },
];

const styleBadgeColors: Record<string, string> = {
  brief: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  detailed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'bullet-points': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  eli5: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

function formatDate(dateStr: string): string {
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

export function SummarizerView() {
  const { summarizer, setSummarizer } = useAppStore();
  const { text, selectedStyle, summary, originalWordCount, summaryWordCount, reduction } = summarizer;

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<SavedSummary[]>([]);
  const [viewSummary, setViewSummary] = useState<SavedSummary | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/summaries');
      const data = await res.json();
      if (data.summaries) {
        setHistory(data.summaries);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSummarize = async () => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setSummarizer({ summary: '' });

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), style: selectedStyle }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummarizer({
          summary: data.summary,
          originalWordCount: data.originalWordCount || 0,
          summaryWordCount: data.summaryWordCount || 0,
          reduction: data.reduction || 0,
        });
        fetchHistory();
      } else if (data.error) {
        setSummarizer({ summary: `**Error:** ${data.error}` });
      }
    } catch {
      setSummarizer({ summary: '**Error:** An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
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
      const { audio } = await speakWithFallback(summary);
      if (audio) {
        currentAudioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
        audio.play();
      } else {
        const wordCount = summary.split(/\s+/).length;
        setTimeout(() => setIsSpeaking(false), Math.min((wordCount / 2.5) * 1000, 30000));
      }
    } catch { setIsSpeaking(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/summaries', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      setHistory((prev) => prev.filter((s) => s.id !== id));
      if (viewSummary?.id === id) {
        setViewSummary(null);
        setDialogOpen(false);
      }
    } catch {
      /* ignore */
    }
  };

  const handleViewHistory = (item: SavedSummary) => {
    setViewSummary(item);
    setDialogOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSummarize();
    }
  };

  const currentWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <FileText className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">AI Summarizer</h2>
          <p className="text-xs text-muted-foreground">Paste any text and get a concise AI-powered summary</p>
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
              {/* Text Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Paste your text
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {currentWordCount} word{currentWordCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => setSummarizer({ text: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste lecture notes, articles, textbook excerpts, or any text you'd like summarized..."
                  className="min-h-[160px] text-sm rounded-xl border-primary/20 focus:border-primary/50 resize-y"
                />
              </div>

              {/* Style Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Summary style
                </label>
                <div className="flex flex-wrap gap-2">
                  {styleOptions.map((opt) => (
                    <Tooltip key={opt.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSummarizer({ selectedStyle: opt.id })}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                            selectedStyle === opt.id
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-sm'
                              : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                          }`}
                        >
                          <opt.icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{opt.desc}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Summarize Button */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+Enter</kbd> to summarize
                </p>
                <Button
                  onClick={handleSummarize}
                  disabled={!text.trim() || text.trim().length < 20 || isLoading}
                  className="ml-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      Summarizing
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Summarize
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {summary && !isLoading ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-0 shadow-md bg-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                    <CardContent className="p-5">
                      {/* Stats Bar */}
                      <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <ArrowDownUp className="w-3.5 h-3.5 text-emerald-500" />
                          <span>
                            Reduced from <strong className="text-foreground">{originalWordCount}</strong> to{' '}
                            <strong className="text-foreground">{summaryWordCount}</strong> words
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {reduction}% reduction
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={styleBadgeColors[selectedStyle] || ''}>
                            {styleOptions.find((s) => s.id === selectedStyle)?.label || 'Brief'}
                          </Badge>
                        </div>
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
                            <TooltipContent>{copied ? 'Copied!' : 'Copy summary'}</TooltipContent>
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
                        </div>
                      </div>

                      {/* Summary Content */}
                      <div className="markdown-content text-sm leading-relaxed">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                      </div>
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
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-900/40" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generating <strong className="text-foreground">{styleOptions.find((s) => s.id === selectedStyle)?.label}</strong> summary...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analyzing {currentWordCount} words of content
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-950/30 dark:to-cyan-950/30 flex items-center justify-center mb-5">
                    <FileText className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Summarize any text instantly</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Paste your lecture notes, research papers, articles, or textbook excerpts — and get a clear, structured summary powered by AI.
                  </p>
                  <div className="flex flex-wrap gap-4 mt-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      Save study time
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-teal-500" />
                      Track word reduction
                    </div>
                    <div className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-cyan-500" />
                      Review past summaries
                    </div>
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
                  <History className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold">Summary History</h3>
                  <Badge variant="secondary" className="text-xs ml-1">
                    {history.length}
                  </Badge>
                </div>
              </div>

              {history.length === 0 ? (
                <Card className="border-0 shadow-sm bg-card">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No summaries yet. Create your first summary above!
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
                                onClick={() => handleViewHistory(item)}
                                className="flex-1 text-left group"
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${styleBadgeColors[item.style] || ''}`}
                                  >
                                    {item.style}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {item.wordCount} words
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(item.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/80 line-clamp-1 group-hover:text-foreground transition-colors">
                                  {item.originalText.substring(0, 80)}
                                  {item.originalText.length > 80 ? '...' : ''}
                                </p>
                              </button>
                              <div className="flex items-center gap-1 shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => handleViewHistory(item)}
                                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                    >
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>View summary</TooltipContent>
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

      {/* View Summary Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {viewSummary && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={styleBadgeColors[viewSummary.style] || ''}>
                      {viewSummary.style}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {viewSummary.wordCount} words
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(viewSummary.createdAt)}
                    </span>
                  </div>
                </div>
                <DialogTitle className="sr-only">Summary Details</DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Original Text */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Original Text
                  </label>
                  <Card className="border-0 shadow-sm bg-muted/30">
                    <CardContent className="p-4">
                      <ScrollArea className="max-h-32">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {viewSummary.originalText}
                        </p>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Summary
                    </label>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              navigator.clipboard.writeText(viewSummary.summary);
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Card className="border-0 shadow-sm bg-card">
                    <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <CardContent className="p-4">
                      <div className="markdown-content text-sm leading-relaxed">
                        <ReactMarkdown>{viewSummary.summary}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => handleDelete(viewSummary.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Summary
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
