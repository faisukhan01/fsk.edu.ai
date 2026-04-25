'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sigma, Send, Copy, Check, Volume2, VolumeX, Sparkles, BookOpen,
  Lightbulb, FlaskConical, PenTool, Zap, ArrowRight, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { speakWithFallback, stopBrowserSpeak } from '@/lib/tts';
import { useAppStore } from '@/lib/store';
import type { ExplainType } from '@/lib/store';

const typeOptions: { id: ExplainType; label: string; icon: React.ElementType; color: string; bg: string; desc: string }[] = [
  {
    id: 'formula',
    label: 'Formula',
    icon: FlaskConical,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    desc: 'Variables & derivation',
  },
  {
    id: 'concept',
    label: 'Concept',
    icon: Lightbulb,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    desc: 'Core ideas & intuition',
  },
  {
    id: 'proof',
    label: 'Proof',
    icon: PenTool,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    desc: 'Step-by-step logic',
  },
  {
    id: 'example',
    label: 'Example',
    icon: BookOpen,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    desc: 'Worked problems',
  },
];

const quickSuggestions = [
  { text: 'Quadratic Formula', emoji: '📐' },
  { text: 'E=mc²', emoji: '⚡' },
  { text: 'Pythagorean Theorem', emoji: '📏' },
  { text: 'Derivatives', emoji: '📈' },
  { text: "Ohm's Law", emoji: '🔌' },
  { text: 'Ideal Gas Law', emoji: '🧪' },
  { text: 'Fourier Transform', emoji: '🌊' },
  { text: "Newton's Laws", emoji: '🍎' },
];

export function FormulaExplainerView() {
  const { explainer, setExplainer } = useAppStore();
  const { topic, selectedType, result } = explainer;

  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const activeType = typeOptions.find(t => t.id === selectedType) ?? typeOptions[0];

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
    if (e.key === 'Enter') { e.preventDefault(); handleExplain(); }
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

  const handleReset = () => {
    setExplainer({ result: '', topic: '' });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Header ── */}
      <div className="shrink-0 px-5 py-3 border-b bg-card/80 backdrop-blur-sm flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-sm shadow-teal-500/20">
          <Sigma className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm leading-tight">AI Explainer</h2>
          <p className="text-[11px] text-muted-foreground">Formulas · Concepts · Proofs · Examples</p>
        </div>
        {result && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleReset}>
            <RotateCcw className="w-3 h-3" /> New
          </Button>
        )}
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* ── Input Card ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">

              {/* Top accent bar */}
              <div className="h-0.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400" />

              <div className="p-4 space-y-4">

                {/* Search input */}
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Sigma className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                  <input
                    ref={inputRef}
                    value={topic}
                    onChange={(e) => setExplainer({ topic: e.target.value })}
                    onKeyDown={handleKeyDown}
                    placeholder={`e.g. "Quadratic Formula", "Newton's Second Law"`}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/70 bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
                  />
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-4 gap-2">
                  {typeOptions.map((opt) => {
                    const isActive = selectedType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setExplainer({ selectedType: opt.id })}
                        className={`relative flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-center transition-all duration-200 ${
                          isActive
                            ? `${opt.bg} border-current/20 shadow-sm`
                            : 'bg-muted/30 border-border/50 hover:bg-muted/60 hover:border-border'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? opt.bg : 'bg-muted/60'}`}>
                          <opt.icon className={`w-3.5 h-3.5 ${isActive ? opt.color : 'text-muted-foreground'}`} />
                        </div>
                        <span className={`text-[11px] font-semibold leading-none ${isActive ? opt.color : 'text-muted-foreground'}`}>
                          {opt.label}
                        </span>
                        {isActive && (
                          <motion.div layoutId="type-indicator"
                            className="absolute inset-0 rounded-xl ring-2 ring-inset ring-current/20 pointer-events-none"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explain button */}
                <Button
                  onClick={handleExplain}
                  disabled={!topic.trim() || isLoading}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold shadow-sm shadow-teal-500/20 disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Explain with AI
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ── Quick Suggestions ── */}
          {!result && !isLoading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5 px-0.5">
                Quick suggestions
              </p>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => { setExplainer({ topic: s.text }); inputRef.current?.focus(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/60 bg-card text-muted-foreground hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 dark:hover:bg-teal-950/30 dark:hover:border-teal-700 dark:hover:text-teal-300 transition-all duration-150"
                  >
                    <span>{s.emoji}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Empty State ── */}
          <AnimatePresence mode="wait">
            {!result && !isLoading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20"
                >
                  <Sigma className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-base font-semibold mb-1.5">What would you like to understand?</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  Enter any formula, theorem, or concept and get a clear, structured explanation tailored to your chosen mode.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {typeOptions.map((t) => (
                    <span key={t.id} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${t.bg} ${t.color}`}>
                      <t.icon className="w-3 h-3" />
                      {t.label}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Loading State ── */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-border/60 bg-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/20">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Analyzing</span>
                      <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">&quot;{topic}&quot;</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedType === 'formula' && '🔬 Breaking down variables and derivation...'}
                      {selectedType === 'concept' && '💡 Building conceptual understanding...'}
                      {selectedType === 'proof' && '✏️ Constructing logical proof steps...'}
                      {selectedType === 'example' && '📚 Preparing worked examples...'}
                    </p>
                    {/* Animated skeleton lines */}
                    <div className="space-y-2 pt-1">
                      {[100, 85, 92, 70].map((w, i) => (
                        <div key={i} className="h-2.5 rounded-full bg-muted animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Result ── */}
            {result && !isLoading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                  {/* Gradient top bar */}
                  <div className="h-0.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400" />

                  {/* Result header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeType.bg}`}>
                        <activeType.icon className={`w-3.5 h-3.5 ${activeType.color}`} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold">
                          {activeType.label} Explanation
                        </span>
                        <span className="text-muted-foreground text-xs"> · {topic}</span>
                      </div>
                      <Badge variant="secondary" className="h-5 text-[10px] px-1.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-0 ml-1">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                      </Badge>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={handleSpeak}>
                            {isSpeaking
                              ? <VolumeX className="w-3.5 h-3.5 text-teal-500" />
                              : <Volume2 className="w-3.5 h-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isSpeaking ? 'Stop' : 'Read aloud'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={handleCopy}>
                            {copied
                              ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                              : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Result content */}
                  <div className="p-4">
                    <div className="markdown-content prose prose-sm dark:prose-invert max-w-none
                      [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                      prose-p:my-1.5 prose-p:leading-relaxed
                      prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
                      prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
                      prose-code:text-teal-600 dark:prose-code:text-teal-400 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                      prose-pre:bg-muted prose-pre:rounded-xl prose-pre:text-xs
                      prose-blockquote:border-l-teal-400 prose-blockquote:text-muted-foreground
                      prose-strong:text-foreground prose-a:text-teal-600 dark:prose-a:text-teal-400">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
