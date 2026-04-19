'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Loader2, Trash2, TrendingUp, Activity, Clock,
  Brain, Calendar, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ── Types ──
interface MoodEntry {
  id: string;
  mood: string;
  note: string | null;
  studyMinutes: number;
  createdAt: string;
}

interface MoodSummary {
  averageMood: string;
  moodDistribution: Record<string, number>;
  positiveStreak: number;
  mostCommonMood: string;
  avgStudyOnGreat: number;
  totalEntries: number;
  latestRollingAvg: number;
}

interface TrendDay {
  date: string;
  mood: string;
  score: number;
  hasEntry: boolean;
}

interface MoodData {
  entries: MoodEntry[];
  summary: MoodSummary;
  trendData: TrendDay[];
  rollingAverages: { date: string; avg: number }[];
}

// ── Constants ──
const MOODS = [
  { key: 'great', emoji: '😊', label: 'Great', color: 'bg-green-500', hoverBg: 'bg-green-50 dark:bg-green-950/40', ringColor: 'ring-green-400 dark:ring-green-500', textColor: 'text-green-600 dark:text-green-400', barColor: 'bg-gradient-to-r from-green-400 to-emerald-500', dotColor: 'bg-green-500' },
  { key: 'good', emoji: '🙂', label: 'Good', color: 'bg-emerald-500', hoverBg: 'bg-emerald-50 dark:bg-emerald-950/40', ringColor: 'ring-emerald-400 dark:ring-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', barColor: 'bg-gradient-to-r from-emerald-400 to-teal-500', dotColor: 'bg-emerald-500' },
  { key: 'okay', emoji: '😐', label: 'Okay', color: 'bg-amber-500', hoverBg: 'bg-amber-50 dark:bg-amber-950/40', ringColor: 'ring-amber-400 dark:ring-amber-500', textColor: 'text-amber-600 dark:text-amber-400', barColor: 'bg-gradient-to-r from-amber-400 to-yellow-500', dotColor: 'bg-amber-500' },
  { key: 'bad', emoji: '😕', label: 'Bad', color: 'bg-orange-500', hoverBg: 'bg-orange-50 dark:bg-orange-950/40', ringColor: 'ring-orange-400 dark:ring-orange-500', textColor: 'text-orange-600 dark:text-orange-400', barColor: 'bg-gradient-to-r from-orange-400 to-amber-500', dotColor: 'bg-orange-500' },
  { key: 'terrible', emoji: '😰', label: 'Terrible', color: 'bg-red-500', hoverBg: 'bg-red-50 dark:bg-red-950/40', ringColor: 'ring-red-400 dark:ring-red-500', textColor: 'text-red-600 dark:text-red-400', barColor: 'bg-gradient-to-r from-red-400 to-rose-500', dotColor: 'bg-red-500' },
];

const MOOD_MAP = Object.fromEntries(MOODS.map((m) => [m.key, m]));

function getMoodEmoji(mood: string): string {
  return MOOD_MAP[mood]?.emoji || '😐';
}

function getMoodDotColor(mood: string): string {
  return MOOD_MAP[mood]?.dotColor || 'bg-muted';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMoodLabel(mood: string): string {
  return MOOD_MAP[mood]?.label || 'Unknown';
}

function getStreakEmoji(streak: number): string {
  if (streak === 0) return '💪';
  if (streak <= 3) return '🌱';
  if (streak <= 7) return '🔥';
  if (streak <= 14) return '🌟';
  return '👑';
}

// ── Component ──
export function MoodTrackerView() {
  const [data, setData] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [studyMinutes, setStudyMinutes] = useState('');
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/mood');
      const json = await res.json();
      setData(json);

      // Check if there's already an entry for today
      const todayStr = new Date().toISOString().split('T')[0];
      const found = json.entries.find(
        (e: MoodEntry) => new Date(e.createdAt).toISOString().split('T')[0] === todayStr
      );
      if (found) {
        setTodayEntry(found);
        setSelectedMood(found.mood);
        setNote(found.note || '');
        setStudyMinutes(found.studyMinutes > 0 ? String(found.studyMinutes) : '');
      }
    } catch (err) {
      console.error('Failed to fetch mood data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!selectedMood) return;
    setSaving(true);
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selectedMood,
          note: note.trim() || undefined,
          studyMinutes: studyMinutes ? parseInt(studyMinutes) : 0,
        }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to save mood:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/mood', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // ── Derived data ──
  const maxDistribution = useMemo(() => {
    if (!data) return 1;
    return Math.max(...Object.values(data.summary.moodDistribution), 1);
  }, [data]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Loading mood data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Failed to load mood data.</p>
      </div>
    );
  }

  const { entries, summary, trendData } = data;
  const hasNoData = entries.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-sm shadow-rose-500/20">
            <Heart className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Study Mood</h2>
            <p className="text-xs text-muted-foreground">
              {todayEntry ? 'You logged your mood today' : 'How are you feeling today?'}
            </p>
          </div>
        </div>
        {summary.positiveStreak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-1.5 rounded-xl"
          >
            <span className="text-lg">{getStreakEmoji(summary.positiveStreak)}</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{summary.positiveStreak}</span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">day streak</span>
          </motion.div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
          <AnimatePresence mode="wait">
            {/* ── Mood Selector ── */}
            <motion.div
              key="mood-selector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className="border-0 shadow-sm bg-card overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-rose-400 via-pink-400 to-emerald-400" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    {todayEntry ? "Today's Mood" : 'How are you feeling about your studies today?'}
                  </CardTitle>
                  <CardDescription>
                    {todayEntry
                      ? 'Update your mood or keep it as is'
                      : 'Select how you feel and optionally add a note'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {/* Mood Buttons */}
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {MOODS.map((mood) => {
                      const isSelected = selectedMood === mood.key;
                      return (
                        <motion.button
                          key={mood.key}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedMood(mood.key)}
                          className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? `${mood.hoverBg} ring-2 ${mood.ringColor} shadow-lg`
                              : 'hover:bg-muted/80'
                          }`}
                        >
                          <span className={`text-2xl sm:text-3xl transition-transform duration-200 ${isSelected ? 'scale-110' : ''}`}>
                            {mood.emoji}
                          </span>
                          <span className={`text-[10px] sm:text-xs font-medium ${isSelected ? mood.textColor : 'text-muted-foreground'}`}>
                            {mood.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Note Input */}
                  <Textarea
                    placeholder="Any thoughts about your studying today? (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="rounded-xl resize-none min-h-[70px] border-muted focus-visible:ring-emerald-400"
                    rows={2}
                  />

                  {/* Study Minutes */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        max="1440"
                        placeholder="Study minutes today"
                        value={studyMinutes}
                        onChange={(e) => setStudyMinutes(e.target.value)}
                        className="pl-9 rounded-xl border-muted focus-visible:ring-emerald-400"
                      />
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={!selectedMood || saving}
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm shadow-emerald-500/20 px-6"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-1.5" />
                          {todayEntry ? 'Update' : 'Save'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Empty State ── */}
            {hasNoData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-0 shadow-sm bg-card">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-5">
                      <Heart className="w-10 h-10 text-rose-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Start Tracking Your Mood!</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      Log how you feel about your studies each day. Over time, you&apos;ll discover patterns and insights about your learning habits.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">📊</span>
                        <span>See trends</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🎯</span>
                        <span>Track streaks</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">💡</span>
                        <span>Get insights</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── Stats Row ── */}
            {!hasNoData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
              >
                <Card className="border-0 shadow-sm bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-base">
                        {getStreakEmoji(summary.positiveStreak)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Positive Streak</p>
                    <p className="text-xl font-bold mt-0.5">
                      {summary.positiveStreak} day{summary.positiveStreak !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-rose-400 to-pink-400" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-base">
                        {summary.mostCommonMood ? getMoodEmoji(summary.mostCommonMood) : '❓'}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Most Common</p>
                    <p className="text-xl font-bold mt-0.5 capitalize">
                      {summary.mostCommonMood || 'N/A'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-base">
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Avg Study on Great Days</p>
                    <p className="text-xl font-bold mt-0.5">
                      {summary.avgStudyOnGreat}m
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-400" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-base">
                        <Calendar className="w-4 h-4 text-teal-500" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Total Entries</p>
                    <p className="text-xl font-bold mt-0.5">
                      {summary.totalEntries}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── Mood Trends (30 days) ── */}
            {!hasNoData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          Mood Trends
                        </CardTitle>
                        <CardDescription className="mt-1">Last 30 days</CardDescription>
                      </div>
                      {summary.latestRollingAvg > 0 && (
                        <div className="flex items-center gap-1.5 bg-muted/80 px-3 py-1.5 rounded-xl">
                          <Activity className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs font-medium text-muted-foreground">7-day avg:</span>
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {summary.latestRollingAvg.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">/5</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Trend dots grid */}
                    <div className="flex items-end gap-1 sm:gap-1.5 h-32 pt-2">
                      {trendData.map((day) => {
                        const moodInfo = MOOD_MAP[day.mood];
                        const isToday = day.date === todayStr;
                        return (
                          <Tooltip key={day.date}>
                            <TooltipTrigger asChild>
                              <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                                <div
                                  className={`w-full max-w-[14px] sm:max-w-[18px] rounded-t-sm transition-all duration-200 ${
                                    day.hasEntry
                                      ? moodInfo?.dotColor || 'bg-muted'
                                      : 'bg-muted/40'
                                  } ${
                                    isToday ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-background' : ''
                                  }`}
                                  style={{
                                    height: day.hasEntry
                                      ? `${Math.max(20, (day.score / 5) * 100)}%`
                                      : '8px',
                                    opacity: day.hasEntry ? 1 : 0.4,
                                  }}
                                />
                                {isToday && (
                                  <span className="text-[8px] text-emerald-500 font-bold leading-none">T</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={4}>
                              <div className="text-center">
                                <div className="font-medium text-xs">{formatDate(day.date)}</div>
                                {day.hasEntry ? (
                                  <div className="text-[10px] opacity-80">
                                    {moodInfo?.emoji} {moodInfo?.label}
                                  </div>
                                ) : (
                                  <div className="text-[10px] opacity-50">No entry</div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-3 flex-wrap">
                        {MOODS.map((mood) => (
                          <div key={mood.key} className="flex items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${mood.dotColor}`} />
                            <span className="text-[10px] text-muted-foreground">{mood.label}</span>
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">30 days</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── Mood Distribution ── */}
            {!hasNoData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4 text-emerald-500" />
                      Mood Distribution
                    </CardTitle>
                    <CardDescription>How often you feel each way</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {[...MOODS].reverse().map((mood) => {
                      const count = summary.moodDistribution[mood.key] || 0;
                      const pct = maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;
                      return (
                        <div key={mood.key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{mood.emoji}</span>
                              <span className="text-xs font-medium">{mood.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                              {count} {count === 1 ? 'time' : 'times'}
                            </span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                              className={`h-full rounded-full ${mood.barColor}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── History Section ── */}
            {!hasNoData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="border-0 shadow-sm bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          Recent Entries
                        </CardTitle>
                        <CardDescription className="mt-1">Your mood journal</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-0">
                        {entries.length} entries
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="max-h-96">
                      <div className="space-y-2 pr-2">
                        <AnimatePresence>
                          {entries.slice(0, 20).map((entry, index) => (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ delay: index * 0.03 }}
                              className="group flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                            >
                              {/* Mood emoji */}
                              <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center text-lg shrink-0">
                                {getMoodEmoji(entry.mood)}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-semibold capitalize">
                                    {getMoodLabel(entry.mood)}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatDate(entry.createdAt)}
                                  </span>
                                  {entry.studyMinutes > 0 && (
                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 border-0 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                      <Clock className="w-2.5 h-2.5 mr-0.5" />
                                      {entry.studyMinutes}m
                                    </Badge>
                                  )}
                                </div>
                                {entry.note && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{entry.note}</p>
                                )}
                              </div>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 shrink-0"
                                aria-label="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── Tip Card ── */}
            {!hasNoData && entries.length >= 7 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-sm bg-card overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400" />
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center text-xl shrink-0">
                      <Sparkles className="w-5 h-5 text-teal-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Keep tracking your mood!</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {summary.averageMood >= 4
                          ? 'Your average mood is looking great! Consistency is key to productive studying.'
                          : summary.averageMood >= 3
                            ? 'Your mood is steady. Try to identify what helps you feel better about studying.'
                            : 'It looks like you could use a boost. Consider adjusting your study schedule or environment.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
