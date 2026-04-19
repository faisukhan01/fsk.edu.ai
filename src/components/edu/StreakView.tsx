'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Trophy, Calendar, Sparkles, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';

interface HeatmapDay {
  date: string;
  minutes: number;
  sessions: number;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  todayActive: boolean;
  heatmap: HeatmapDay[];
  thisWeekSessions: number;
}

function getHeatmapColor(minutes: number, isDark: boolean): string {
  if (minutes === 0) return 'bg-muted';
  if (minutes <= 30) return isDark ? 'bg-emerald-900/40' : 'bg-emerald-200';
  if (minutes <= 60) return isDark ? 'bg-emerald-700/60' : 'bg-emerald-400';
  if (minutes <= 120) return isDark ? 'bg-emerald-600' : 'bg-emerald-500';
  return isDark ? 'bg-emerald-400' : 'bg-emerald-700';
}

function getMotivation(streak: number): { text: string; emoji: string } {
  if (streak === 0) return { text: 'Start your streak today! Even 5 minutes counts.', emoji: '💪' };
  if (streak <= 3) return { text: "You're building momentum! Keep going!", emoji: '💪' };
  if (streak <= 7) return { text: 'Impressive! A full week of studying!', emoji: '🔥' };
  if (streak <= 14) return { text: "Amazing consistency! You're on fire!", emoji: '🌟' };
  return { text: 'Legendary streak! You are an inspiration!', emoji: '👑' };
}

export function StreakView() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    fetch('/api/streak')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Organize heatmap into a grid: 7 rows (days) x N columns (weeks)
  const { grid, monthLabels, dayLabels } = useMemo(() => {
    if (!data) return { grid: [], monthLabels: [], dayLabels: [] };

    const heatmap = data.heatmap;
    if (heatmap.length === 0) return { grid: [], monthLabels: [], dayLabels: [] };

    // The heatmap starts 89 days ago. We need to find the day-of-week of that first date.
    const firstDate = new Date(heatmap[0].date + 'T00:00:00');
    // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // We want rows: Mon(0), Tue(1), Wed(2), Thu(3), Fri(4), Sat(5), Sun(6)
    const firstDayOfWeek = firstDate.getDay();
    // Convert to Mon=0: Mon=0, Tue=1, ..., Sun=6
    const firstDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Pad the beginning with empty cells
    const paddedDays: (HeatmapDay | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      paddedDays.push(null);
    }
    for (const day of heatmap) {
      paddedDays.push(day);
    }

    // Build grid: 7 rows, each row has cells for that day of week
    const numWeeks = Math.ceil(paddedDays.length / 7);
    const gridRows: (HeatmapDay | null)[][] = [];
    for (let row = 0; row < 7; row++) {
      const rowCells: (HeatmapDay | null)[] = [];
      for (let col = 0; col < numWeeks; col++) {
        const idx = col * 7 + row;
        rowCells.push(idx < paddedDays.length ? paddedDays[idx] : null);
      }
      gridRows.push(rowCells);
    }

    // Build month labels (show month at top of each column where month changes)
    const labels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < numWeeks; col++) {
      // Find the first non-null cell in this column
      const cell = gridRows[0]?.[col];
      if (cell) {
        const month = new Date(cell.date + 'T00:00:00').getMonth();
        if (month !== lastMonth) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          labels.push({ label: monthNames[month], colIndex: col });
          lastMonth = month;
        }
      }
    }

    const days = ['Mon', '', 'Wed', '', 'Fri', '', ''];

    return { grid: gridRows, monthLabels: labels, dayLabels: days };
  }, [data]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const motivation = getMotivation(data?.currentStreak ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Loading streak data...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Failed to load streak data.</p>
      </div>
    );
  }

  // Check for empty state
  const hasNoData = data.totalActiveDays === 0;

  const statCards = [
    {
      label: 'Current Streak',
      value: `${data.currentStreak} day${data.currentStreak !== 1 ? 's' : ''}`,
      emoji: '🔥',
      accent: 'bg-gradient-to-r from-orange-400 to-amber-400',
      iconBg: 'bg-orange-50 dark:bg-orange-900/30',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Longest Streak',
      value: `${data.longestStreak} day${data.longestStreak !== 1 ? 's' : ''}`,
      emoji: '🏆',
      accent: 'bg-gradient-to-r from-amber-400 to-yellow-400',
      iconBg: 'bg-amber-50 dark:bg-amber-900/30',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Total Active Days',
      value: `${data.totalActiveDays} day${data.totalActiveDays !== 1 ? 's' : ''}`,
      emoji: '📅',
      accent: 'bg-gradient-to-r from-emerald-400 to-teal-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'This Week',
      value: `${data.thisWeekSessions} session${data.thisWeekSessions !== 1 ? 's' : ''}`,
      emoji: '📊',
      accent: 'bg-gradient-to-r from-teal-400 to-cyan-400',
      iconBg: 'bg-teal-50 dark:bg-teal-900/30',
      iconColor: 'text-teal-500',
    },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
            <Flame className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Study Streak</h2>
            <p className="text-xs text-muted-foreground">
              {data.currentStreak > 0 ? `${data.currentStreak} day streak` : 'Build your streak'}
            </p>
          </div>
        </div>
        {data.currentStreak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 px-3 py-1.5 rounded-xl"
          >
            <span className="text-lg">🔥</span>
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{data.currentStreak}</span>
            <span className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">days</span>
          </motion.div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">
          {/* Empty state */}
          <AnimatePresence>
            {hasNoData ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-0 shadow-sm bg-card">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mx-auto mb-5">
                      <Flame className="w-10 h-10 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Start Your Study Streak!</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      Start your first study session to build your streak! Even a quick 5-minute session counts. Consistency is the key to mastery.
                    </p>
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">📝</span>
                        <span>Take notes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">⏱️</span>
                        <span>Use Focus Timer</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🧠</span>
                        <span>Take a quiz</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
                >
                  {statCards.map((card) => (
                    <Card key={card.label} className="border-0 shadow-sm bg-card overflow-hidden">
                      <div className={`h-1 ${card.accent}`} />
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center text-base`}>
                            {card.emoji}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                        <p className="text-xl font-bold mt-0.5">{card.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>

                {/* Motivation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-0 shadow-sm bg-card overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400" />
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-xl shrink-0">
                        {motivation.emoji}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{motivation.text}</p>
                        {data.todayActive && (
                          <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> You studied today!
                          </p>
                        )}
                        {!data.todayActive && data.currentStreak > 0 && (
                          <p className="text-xs text-amber-500 mt-0.5">
                            Study today to keep your streak alive!
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Streak Calendar / Heatmap */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Card className="border-0 shadow-sm bg-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        Study Activity
                      </CardTitle>
                      <CardDescription>Last 90 days of study activity</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto pb-2">
                        <div className="inline-flex flex-col gap-1 min-w-fit">
                          {/* Month labels row */}
                          <div className="flex items-center gap-[3px] ml-8 mb-1">
                            {grid[0]?.map((cell, colIdx) => {
                              const monthLabel = monthLabels.find((ml) => ml.colIndex === colIdx);
                              return (
                                <div
                                  key={colIdx}
                                  className="w-[11px] md:w-[13px] shrink-0 text-[10px] text-muted-foreground font-medium text-center"
                                >
                                  {monthLabel?.label || ''}
                                </div>
                              );
                            })}
                          </div>

                          {/* Grid rows */}
                          {grid.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex items-center gap-[3px]">
                              {/* Day label */}
                              <div className="w-8 shrink-0 text-[10px] text-muted-foreground font-medium text-right pr-2">
                                {dayLabels[rowIdx] || ''}
                              </div>
                              {/* Cells */}
                              <div className="flex gap-[3px]">
                                {row.map((cell, colIdx) => {
                                  if (!cell) {
                                    return (
                                      <div
                                        key={`${rowIdx}-${colIdx}`}
                                        className="w-[11px] h-[11px] md:w-[13px] md:h-[13px] rounded-[2px] shrink-0"
                                      />
                                    );
                                  }

                                  const isToday = cell.date === todayStr;
                                  const colorClass = getHeatmapColor(cell.minutes, isDark);
                                  const hasActivity = cell.minutes > 0;

                                  return (
                                    <Tooltip key={cell.date}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`w-[11px] h-[11px] md:w-[13px] md:h-[13px] rounded-[2px] shrink-0 transition-all duration-150 ${colorClass} ${
                                            isToday
                                              ? 'ring-2 ring-orange-400 ring-offset-1 ring-offset-background'
                                              : hasActivity
                                                ? 'hover:ring-1 hover:ring-emerald-300 dark:hover:ring-emerald-600 cursor-pointer'
                                                : ''
                                          }`}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" sideOffset={4}>
                                        <div className="text-center">
                                          <div className="font-medium">{formatDate(cell.date)}</div>
                                          {isToday && <div className="text-orange-400 text-[10px]">Today</div>}
                                          {hasActivity ? (
                                            <div className="text-[10px] opacity-80">
                                              {cell.minutes} min · {cell.sessions} session{cell.sessions !== 1 ? 's' : ''}
                                            </div>
                                          ) : (
                                            <div className="text-[10px] opacity-60">No activity</div>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t">
                        <span className="text-[10px] text-muted-foreground mr-1">Less</span>
                        <div className={`w-[11px] h-[11px] rounded-[2px] bg-muted`} />
                        <div className={`w-[11px] h-[11px] rounded-[2px] ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-200'}`} />
                        <div className={`w-[11px] h-[11px] rounded-[2px] ${isDark ? 'bg-emerald-700/60' : 'bg-emerald-400'}`} />
                        <div className={`w-[11px] h-[11px] rounded-[2px] ${isDark ? 'bg-emerald-600' : 'bg-emerald-500'}`} />
                        <div className={`w-[11px] h-[11px] rounded-[2px] ${isDark ? 'bg-emerald-400' : 'bg-emerald-700'}`} />
                        <span className="text-[10px] text-muted-foreground ml-1">More</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Streak Milestones */}
                {data.longestStreak > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-0 shadow-sm bg-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          Streak Milestones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { target: 3, label: '3 Days', desc: 'Getting started' },
                            { target: 7, label: '1 Week', desc: 'Strong habit' },
                            { target: 14, label: '2 Weeks', desc: 'Dedication' },
                            { target: 30, label: '1 Month', desc: 'Champion' },
                          ].map((milestone) => {
                            const reached = data.longestStreak >= milestone.target;
                            return (
                              <div
                                key={milestone.target}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                                  reached
                                    ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20'
                                    : 'border-dashed border-muted-foreground/20 opacity-50'
                                }`}
                              >
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${
                                    reached
                                      ? 'bg-amber-100 dark:bg-amber-900/40'
                                      : 'bg-muted'
                                  }`}
                                >
                                  {reached ? '✅' : '⬜'}
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-sm font-semibold truncate ${reached ? '' : 'text-muted-foreground'}`}>
                                    {milestone.label}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">{milestone.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
