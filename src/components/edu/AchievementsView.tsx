'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Lock, CheckCircle2, Sparkles, Loader2, Target,
  BookOpen, Flame, Brain, Rocket, RotateCcw, Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt: string | null;
  createdAt: string;
}

interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'getting-started': {
    label: 'Getting Started',
    icon: Rocket,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/40',
  },
  'study-focus': {
    label: 'Study Focus',
    icon: Target,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800/40',
  },
  'knowledge': {
    label: 'Knowledge',
    icon: Brain,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800/40',
  },
  'consistency': {
    label: 'Consistency',
    icon: Flame,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/40',
  },
};

const CATEGORY_ORDER = ['getting-started', 'study-focus', 'knowledge', 'consistency'];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AchievementsView() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [newlyUnlockedKeys, setNewlyUnlockedKeys] = useState<string[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch('/api/achievements');
      const data = await res.json();
      if (data.achievements) {
        setAchievements(data.achievements);
      }
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlocked = achievements.filter((a) => a.unlockedAt);
  const total = achievements.length;
  const progressPercent = total > 0 ? Math.round((unlocked.length / total) * 100) : 0;

  const handleCheckProgress = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-progress' }),
      });
      const data = await res.json();
      if (data.achievements) {
        setAchievements(data.achievements);
      }
      if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
        setNewlyUnlockedKeys(data.newlyUnlocked);
        // Clear newly unlocked animation after 3 seconds
        setTimeout(() => setNewlyUnlockedKeys([]), 3000);
      }
      setLastChecked(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to check progress:', err);
    } finally {
      setChecking(false);
    }
  };

  // Group achievements by category
  const groupedAchievements = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = achievements.filter((a) => a.category === cat);
    if (items.length > 0) {
      acc.push({ category: cat, items });
    }
    return acc;
  }, [] as { category: string; items: Achievement[] }[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-5xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{unlocked.length}</span>
              <span className="mx-1">/</span>
              <span>{total} unlocked</span>
              {lastChecked && (
                <span className="ml-2 text-xs opacity-60">
                  · Last checked {lastChecked}
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          onClick={handleCheckProgress}
          disabled={checking}
          className="btn-primary-glow bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 min-w-[180px]"
        >
          {checking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Check Progress
            </>
          )}
        </Button>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm bg-card stat-card stat-card-emerald overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Overall Progress</span>
              </div>
              <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{unlocked.length} earned</span>
              <span>{total - unlocked.length} remaining</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Newly Unlocked Toast */}
      <AnimatePresence>
        {newlyUnlockedKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="rounded-xl p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  🎉 {newlyUnlockedKeys.length} New Achievement{newlyUnlockedKeys.length > 1 ? 's' : ''} Unlocked!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {newlyUnlockedKeys
                    .map((key) => {
                      const a = achievements.find((ach) => ach.key === key);
                      return a ? `${a.icon} ${a.title}` : key;
                    })
                    .join(', ')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Groups */}
      <div className="space-y-6">
        {groupedAchievements.map((group, groupIndex) => {
          const config = CATEGORY_CONFIG[group.category];
          if (!config) return null;
          const CategoryIcon = config.icon;
          const groupUnlocked = group.items.filter((a) => a.unlockedAt).length;

          return (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + groupIndex * 0.1 }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold">{config.label}</h2>
                  <p className="text-xs text-muted-foreground">
                    {groupUnlocked}/{group.items.length} unlocked
                  </p>
                </div>
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${group.items.length > 0 ? (groupUnlocked / group.items.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Achievement Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.items.map((achievement, i) => {
                  const isUnlocked = !!achievement.unlockedAt;
                  const isNewlyUnlocked = newlyUnlockedKeys.includes(achievement.key);

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + groupIndex * 0.1 + i * 0.05 }}
                    >
                      <div
                        className={`animate-scale-in relative rounded-xl p-4 transition-all duration-300 border ${
                          isUnlocked
                            ? `${config.bg} ${config.border} border shadow-sm`
                            : 'bg-card border-border/50 opacity-70'
                        } ${isNewlyUnlocked ? 'animate-bounce-in' : ''}`}
                      >
                        {/* Checkmark Badge */}
                        {isUnlocked && (
                          <div className="absolute top-3 right-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        )}

                        {!isUnlocked && (
                          <div className="absolute top-3 right-3">
                            <Lock className="w-4 h-4 text-muted-foreground/50" />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                              isUnlocked
                                ? 'bg-white/80 dark:bg-white/10 shadow-sm'
                                : 'bg-muted/50 grayscale'
                            }`}
                          >
                            {achievement.icon}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0 pr-6">
                            <h3
                              className={`text-sm font-semibold ${
                                isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {achievement.title}
                            </h3>
                            <p
                              className={`text-xs mt-0.5 leading-relaxed ${
                                isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'
                              }`}
                            >
                              {achievement.description}
                            </p>
                            {isUnlocked && achievement.unlockedAt && (
                              <div className="flex items-center gap-1 mt-2">
                                <Calendar className="w-3 h-3 text-muted-foreground/60" />
                                <span className="text-[10px] text-muted-foreground/60">
                                  {formatDate(achievement.unlockedAt)}
                                </span>
                              </div>
                            )}
                            {!isUnlocked && (
                              <p className="text-[10px] mt-2 text-muted-foreground/50 italic">
                                Not yet unlocked
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Newly unlocked glow */}
                        {isNewlyUnlocked && (
                          <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/50 animate-pulse pointer-events-none" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Motivational Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Keep Going!</p>
                <p className="text-xs text-muted-foreground">
                  {progressPercent === 100
                    ? '🎉 Amazing! You have unlocked all achievements. You are a true learning champion!'
                    : progressPercent >= 50
                    ? `You're over halfway there! ${total - unlocked.length} achievements remaining.`
                    : `Every step counts. ${total - unlocked.length} achievements waiting for you.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
