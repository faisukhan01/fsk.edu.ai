'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StickyNote, X, Plus, Trash2, Clock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickNote {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = 'fsk-edu-quick-notes';
const MAX_NOTES = 50;
const MAX_CHARS = 2000;

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function loadNotes(): QuickNote[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Silently fail
  }
  return [];
}

// Simple markdown-to-HTML converter (no external deps)
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-2 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-2 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-2 mb-1">$1</h1>')
    // Bold & Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-xs font-mono">$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-3 list-disc">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-3 list-decimal">$1</li>')
    // Line breaks (preserve double newline for paragraphs)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  return html;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function QuickNotesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<QuickNote[]>(loadNotes);
  const [input, setInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Silently fail
    }
  }, [notes]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    setShowSavedIndicator(false);
    autoSaveTimeoutRef.current = setTimeout(() => {
      setShowSavedIndicator(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
    }, 1500);
  }, []);

  const handleInputChange = (value: string) => {
    if (value.length <= MAX_CHARS) {
      setInput(value);
      triggerAutoSave();
    }
  };

  const addNote = () => {
    if (!input.trim()) return;
    const newNote: QuickNote = {
      id: Date.now().toString(),
      text: input.trim(),
      createdAt: new Date().toISOString(),
    };
    setNotes([newNote, ...notes].slice(0, MAX_NOTES));
    setInput('');
    setShowPreview(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setInput('');
      setShowPreview(false);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, []);

  const recentNotes = notes.slice(0, 3);
  const wordCount = countWords(input);
  const remainingChars = MAX_CHARS - input.length;
  const charPercentage = (input.length / MAX_CHARS) * 100;

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fab-button"
            onClick={() => setIsOpen(true)}
            aria-label="Quick Notes"
          >
            <StickyNote className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Notes Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="quick-notes-panel bg-card border border-border"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                  <StickyNote className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Quick Notes</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {notes.length} note{notes.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {notes.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-0">
                    {notes.length}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-accent"
                  onClick={() => { setIsOpen(false); setInput(''); setShowPreview(false); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Input Area */}
            <div className="px-3 py-2.5 border-b">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Jot a quick note..."
                  className="min-h-[60px] max-h-[100px] resize-none text-sm rounded-lg border-primary/20 focus:border-primary/50 shadow-sm text-sm leading-relaxed"
                  rows={2}
                  autoFocus
                  style={{ display: showPreview ? 'none' : undefined }}
                />
                {showPreview && input && (
                  <div
                    className="min-h-[60px] max-h-[100px] overflow-y-auto text-sm leading-relaxed rounded-lg border border-primary/20 p-2 text-foreground"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(input) }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <p className="text-[9px] text-muted-foreground/60">
                    Press Enter to save · Esc to close
                  </p>
                  {/* Auto-save indicator */}
                  <AnimatePresence>
                    {showSavedIndicator && input.length > 0 && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        className="text-[9px] text-emerald-500 font-medium"
                      >
                        Saved
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Markdown preview toggle */}
                  <TooltipWrapper content={showPreview ? 'Edit' : 'Preview'}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-accent"
                      onClick={() => setShowPreview(!showPreview)}
                      disabled={!input.trim()}
                    >
                      {showPreview ? (
                        <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipWrapper>
                  <Button
                    size="sm"
                    onClick={addNote}
                    disabled={!input.trim()}
                    className="h-7 px-3 text-xs rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
              {/* Word count & character limit */}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] text-muted-foreground/50">
                  {wordCount} word{wordCount !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        charPercentage > 90
                          ? 'bg-rose-500'
                          : charPercentage > 75
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(charPercentage, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] tabular-nums ${
                    remainingChars <= 100
                      ? remainingChars <= 0
                        ? 'text-rose-500 font-medium'
                        : 'text-amber-500'
                      : 'text-muted-foreground/50'
                  }`}>
                    {remainingChars}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Notes */}
            <div className="max-h-[200px] overflow-y-auto">
              {recentNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <StickyNote className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No notes yet</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">Type a note above and press Enter</p>
                </div>
              ) : (
                <div className="divide-y">
                  {recentNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group px-4 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <p className="text-xs leading-relaxed break-words pr-6">{note.text}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {getRelativeTime(note.createdAt)}
                        </span>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with link to notes */}
            <div className="px-3 py-2 border-t">
              <p className="text-[9px] text-muted-foreground/40 text-center">
                Notes saved locally · Max {MAX_NOTES} notes · {MAX_CHARS} chars/note
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Simple tooltip wrapper since we can't use radix tooltip here
function TooltipWrapper({ content, children }: { content: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-popover text-popover-foreground text-[10px] rounded shadow-md whitespace-nowrap z-50 border">
          {content}
        </div>
      )}
    </div>
  );
}
