'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Clock, Brain, FileText, BookOpen, Flame,
  Trophy, GraduationCap, Target, Zap, Award, Star,
  BookMarked, Timer, TrendingUp, CheckCircle2, Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

interface Statistics {
  totalNotes: number;
  totalFlashcardDecks: number;
  totalCourses: number;
  totalQuizzes: number;
  totalStudySessions: number;
  avgQuizScore: number;
  totalFlashcardsMastered: number;
  totalStudyMinutes: number;
  totalStudyHours: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  unlocked: boolean;
}

const mockAchievements: Achievement[] = [
  { id: '1', title: 'First Quiz!', description: 'Completed your first quiz', icon: Brain, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-950/30', unlocked: true },
  { id: '2', title: '1 Hour Studied', description: 'Accumulated 60 minutes of focus time', icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-950/30', unlocked: true },
  { id: '3', title: '10 Notes Taken', description: 'Created 10 study notes', icon: FileText, color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-950/30', unlocked: true },
  { id: '4', title: '5 Courses Added', description: 'Added 5 courses to your list', icon: GraduationCap, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-950/30', unlocked: true },
  { id: '5', title: 'Flashcard Master', description: 'Mastered 50 flashcards', icon: BookMarked, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-950/30', unlocked: true },
];

export function StatisticsView() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/statistics')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Study Hours', value: stats ? `${stats.totalStudyHours}h ${stats.totalStudyMinutes % 60}m` : '—', icon: Clock, accent: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Quizzes Taken', value: stats?.totalQuizzes.toString() || '—', icon: Brain, accent: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-50 dark:bg-rose-950/30' },
    { label: 'Notes Created', value: stats?.totalNotes.toString() || '—', icon: FileText, accent: 'bg-sky-500', textColor: 'text-sky-600 dark:text-sky-400', iconBg: 'bg-sky-50 dark:bg-sky-950/30' },
    { label: 'Flashcards Mastered', value: stats?.totalFlashcardsMastered.toString() || '—', icon: BookMarked, accent: 'bg-violet-500', textColor: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-50 dark:bg-violet-950/30' },
  ];

  const performanceItems = [
    { label: 'Quiz Avg Score', value: stats?.avgQuizScore ?? 0, max: 100, unit: '%', color: 'bg-emerald-500' },
    { label: 'Study Streak', value: 7, max: 30, unit: ' days', color: 'bg-amber-500' },
    { label: 'Courses Active', value: stats?.totalCourses ?? 0, max: 12, unit: '', color: 'bg-pink-500' },
    { label: 'Focus Sessions', value: stats?.totalStudySessions ?? 0, max: 50, unit: '', color: 'bg-orange-500' },
  ];

  const distributionItems = [
    { label: 'Focus Time', minutes: stats?.totalStudyMinutes ?? 0, color: 'bg-emerald-500' },
    { label: 'Quiz Time (est.)', minutes: stats ? Math.round(stats.totalQuizzes * 5) : 0, color: 'bg-rose-500' },
    { label: 'Flashcard Review', minutes: stats ? Math.round(stats.totalFlashcardDecks * 8) : 0, color: 'bg-violet-500' },
  ];

  const maxDistMinutes = Math.max(...distributionItems.map((d) => d.minutes), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Study Statistics</h1>
          <p className="text-sm text-muted-foreground">Track your learning progress and achievements</p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2 text-xs h-9" onClick={() => {
          if (!stats) return;
          const text = `FSK EDU AI - Study Statistics Report\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\nStudy Hours: ${stats.totalStudyHours}h ${stats.totalStudyMinutes % 60}m\nQuizzes Taken: ${stats.totalQuizzes}\nNotes Created: ${stats.totalNotes}\nFlashcards Mastered: ${stats.totalFlashcardsMastered}\nCourses: ${stats.totalCourses}\nFocus Sessions: ${stats.totalStudySessions}\nAvg Quiz Score: ${stats.avgQuizScore}%\n\n${'='.repeat(50)}\nGenerated by FSK EDU AI`;
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `fsk_edu_stats_${new Date().toISOString().split('T')[0]}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </motion.div>

      {/* Top Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((card) => (
          <Card key={card.label} className="border-0 shadow-md bg-card overflow-hidden">
            <div className={`h-1 ${card.accent}`} />
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Performance Overview + Study Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md bg-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Performance Overview
              </CardTitle>
              <CardDescription>Your key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {performanceItems.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <span className="font-semibold">{item.value}{item.unit}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                      className={`h-full rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Study Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md bg-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Study Distribution
              </CardTitle>
              <CardDescription>Minutes spent by activity type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {distributionItems.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <span className="font-semibold">{item.minutes} min</span>
                  </div>
                  <div className="h-8 rounded-lg bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((item.minutes / maxDistMinutes) * 100, item.minutes > 0 ? 4 : 0)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                      className={`h-full rounded-lg ${item.color} flex items-center justify-end pr-2`}
                    >
                      {item.minutes > 10 && (
                        <span className="text-[10px] font-bold text-white">{item.minutes}m</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-muted-foreground">
                  Total: {distributionItems.reduce((s, d) => s + d.minutes, 0)} minutes across all activities
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-md bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Badges you&apos;ve earned on your learning journey</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mockAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                    achievement.unlocked
                      ? 'border-border bg-card hover:shadow-sm cursor-default'
                      : 'border-dashed border-muted-foreground/20 opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${achievement.unlocked ? achievement.bg : 'bg-muted'} flex items-center justify-center shrink-0`}>
                    {achievement.unlocked ? (
                      <achievement.icon className={`w-5 h-5 ${achievement.color}`} />
                    ) : (
                      <Star className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {achievement.title}
                      {achievement.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
