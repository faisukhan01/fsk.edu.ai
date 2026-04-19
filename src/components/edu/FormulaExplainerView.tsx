'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sigma, Send, Copy, Check, Volume2, VolumeX, Sparkles, BookOpen,
  Lightbulb, FlaskConical, PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { speakWithFallback, stopBrowserSpeak } from '@/lib/tts';
import { useAppStore } from '@/lib/store';
import type { ExplainType } from '@/lib/store';

const typeOptions: { id: ExplainType; label: string; icon: React.ElementType }[] = [
  { id: 'formula', label: 'Formula', icon: FlaskConical },
  { id: 'concept', label: 'Concept', icon: Lightbulb },
  { id: 'proof', label: 'Proof', icon: PenTool },
  { id: 'example', label: 'Example', icon: BookOpen },
];

const quickSuggestions = [
  'Quadratic Formula',
  "E=mc²",
  'Pythagorean Theorem',
  'Derivatives',
  "Ohm's Law",
  'Ideal Gas Law',
];

export function FormulaExplainerView() {
  const { explainer, setExplainer } = useAppStore();
  const { topic, selectedType, result } = explainer;

  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const handleExplain = async () => {
    if (!topic.trim() || isLoading) return;
    setIsLoading(true);
    setExplainer({ result: '' });

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), type: selectedType }),
      });
      const data = await res.json();
      if (data.response) {
        setExplainer({ result: data.response });
      }
    } catch {
      setExplainer({ result: 'Sorry, an error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExplain();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
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
      const { audio } = await speakWithFallback(result);
      if (audio) {
        currentAudioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
        audio.play();
      } else {
        const wordCount = result.split(/\s+/).length;
        setTimeout(() => setIsSpeaking(false), Math.min((wordCount / 2.5) * 1000, 30000));
      }
    } catch { setIsSpeaking(false); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
        <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
          <Sigma className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Formula Explainer</h2>
          <p className="text-xs text-muted-foreground">Deep-dive into formulas, concepts, proofs & examples</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                What would you like to explore?
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={topic}
                  onChange={(e) => setExplainer({ topic: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder={'e.g., "Quadratic Formula", "Newton\'s Second Law"'}
                  className="text-sm h-11 rounded-xl border-primary/20 focus:border-primary/50"
                />
                <Button
                  onClick={handleExplain}
                  disabled={!topic.trim() || isLoading}
                  className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-medium"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      Thinking
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1.5" />
                      Explain
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Type Selector - Pill Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Explanation type
              </label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setExplainer({ selectedType: opt.id })}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      selectedType === opt.id
                        ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 shadow-sm'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Quick suggestions
              </label>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setExplainer({ topic: suggestion })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card text-muted-foreground hover:bg-accent hover:border-primary/30 hover:text-foreground transition-all duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {result && !isLoading ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-0 shadow-md bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-500" />
                        <span className="text-sm font-semibold">
                          {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Explanation
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSpeak}>
                              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{isSpeaking ? 'Stop speaking' : 'Read aloud'}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="markdown-content text-sm leading-relaxed">
                      <ReactMarkdown>{result}</ReactMarkdown>
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
                <div className="flex gap-2 mb-4">
                  <span className="w-3 h-3 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-3 h-3 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyzing <strong className="text-foreground">&quot;{topic}&quot;</strong>...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedType === 'formula' && 'Breaking down variables and derivation...'}
                  {selectedType === 'concept' && 'Building conceptual understanding...'}
                  {selectedType === 'proof' && 'Constructing logical proof...'}
                  {selectedType === 'example' && 'Preparing worked examples...'}
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-950/30 dark:to-cyan-950/30 flex items-center justify-center mb-5">
                  <Sigma className="w-10 h-10 text-teal-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Enter a formula or concept to explore</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Type any mathematical formula, scientific concept, theorem, or topic — and get a detailed, step-by-step explanation with examples.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}