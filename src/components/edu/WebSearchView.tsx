'use client';

import React, { useState } from 'react';
import { Search, Globe, ExternalLink, Loader2, BookOpen, FileText, Lightbulb, Sparkles, Brain, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface SearchResult {
  url: string;
  name: string;
  snippet: string;
  host_name: string;
  rank: number;
  date: string;
  favicon: string;
  isAiSummary?: boolean;
}

export function WebSearchView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');

  const searchWeb = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    setSearchedQuery(q.trim());
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });
      const data = await res.json();
      // Handle both array results and legacy object format
      const raw = data.results;
      if (Array.isArray(raw)) {
        setResults(raw);
      } else if (raw && typeof raw === 'object') {
        // Legacy: { aiSummary, results, note }
        const items: SearchResult[] = [];
        if (raw.aiSummary) {
          items.push({ url: '#', name: `AI Research Summary`, snippet: raw.aiSummary, host_name: 'FSK EDU AI', rank: 1, date: '', favicon: '', isAiSummary: true });
        }
        if (Array.isArray(raw.results)) items.push(...raw.results);
        setResults(items);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchWeb();
  };

  const suggestions = [
    { label: 'Machine Learning Basics', icon: Brain },
    { label: 'Quantum Computing Research', icon: Sparkles },
    { label: 'Data Structures & Algorithms', icon: FileText },
    { label: 'Academic Writing Tips', icon: BookOpen },
    { label: 'Free CS Courses Online', icon: GraduationCap },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
        <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
          <Globe className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Web Research</h2>
          <p className="text-xs text-muted-foreground">AI-powered academic research assistant</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {/* Search Box */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for study materials, concepts, papers..."
                    className="pl-9 rounded-xl text-sm border-primary/20 focus:border-primary/50"
                  />
                </div>
                <Button
                  onClick={() => searchWeb()}
                  disabled={isLoading || !query.trim()}
                  className="bg-teal-600 hover:bg-teal-700 rounded-xl px-4 gap-2 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /><span className="hidden sm:inline">Search</span></>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence mode="wait">
            {/* Empty state */}
            {!hasSearched && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Hero */}
                <div className="rounded-2xl p-6 bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full bg-white"
                        style={{ width: 40 + i * 20, height: 40 + i * 20, top: `${10 + i * 12}%`, left: `${5 + i * 15}%`, opacity: 0.3 }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.4 }}
                      />
                    ))}
                  </div>
                  <div className="relative z-10">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3"
                    >
                      <Globe className="w-7 h-7 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-bold mb-1">AI Research Assistant</h3>
                    <p className="text-sm text-white/80">Ask anything — get AI-powered academic summaries, key concepts, and study resources instantly.</p>
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Try these searches
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => { setQuery(s.label); searchWeb(s.label); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:border-teal-300 dark:hover:border-teal-700 transition-all group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                          <s.icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <span className="text-sm flex-1">{s.label}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading */}
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <Globe className="w-8 h-8 text-teal-500" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-teal-400"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <p className="text-sm font-medium">Researching <span className="text-teal-600 dark:text-teal-400">&ldquo;{searchedQuery}&rdquo;</span></p>
                <p className="text-xs text-muted-foreground mt-1">AI is compiling academic resources...</p>
              </motion.div>
            )}

            {/* Results */}
            {!isLoading && hasSearched && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {results.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="font-medium text-sm">No results found</p>
                      <p className="text-xs text-muted-foreground mt-1">Try different keywords</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <p className="text-xs text-muted-foreground">Results for <span className="font-medium text-foreground">&ldquo;{searchedQuery}&rdquo;</span></p>
                    </div>
                    {results.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {r.isAiSummary ? (
                          <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 overflow-hidden">
                            <div className="h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400" />
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">AI Research Summary</p>
                                  <p className="text-[10px] text-muted-foreground">Powered by FSK EDU AI</p>
                                </div>
                              </div>
                              <div className="markdown-content text-sm prose-sm max-w-none">
                                <ReactMarkdown>{r.snippet}</ReactMarkdown>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="block">
                            <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                              <CardContent className="p-3 md:p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-sm font-medium text-primary truncate group-hover:underline">{r.name}</h3>
                                      <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">{r.host_name}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{r.snippet}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </a>
                        )}
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
