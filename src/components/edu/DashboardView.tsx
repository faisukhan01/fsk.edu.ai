'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Brain, MessageSquare, ScanLine, FileText,
  Timer, Search, Sparkles, Flame, TrendingUp, Clock, Trophy,
  Zap, Calendar, Target, Library,
  FileSearch, BarChart3, Heart, Calculator
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

interface DashboardStats {
  totalSessions: number;
  totalMinutes: number;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  time: string;
  timeAgo: string;
}

interface WeeklyData {
  day: string;
  minutes: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getTimeEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅';
  if (hour < 17) return '☀️';
  return '🌙';
}

const activityIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  quiz: { icon: Brain, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  study: { icon: Timer, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  note: { icon: FileText, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/30' },
  flashcard: { icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  goal: { icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  chat: { icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
};

export function DashboardView({ userName }: { userName?: string }) {
  const { setCurrentView } = useAppStore();
  const [stats, setStats] = useState<DashboardStats>({ totalSessions: 0, totalMinutes: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayIndex] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/study-sessions').then(r => r.json()).catch(() => ({})),
      fetch('/api/activity').then(r => r.json()).catch(() => ({ activities: [] })),
      fetch('/api/weekly').then(r => r.json()).catch(() => ({ weeklyData: [] })),
    ]).then(([sessionsData, activityData, weeklyResp]) => {
      setStats({ totalSessions: sessionsData.totalSessions || 0, totalMinutes: sessionsData.totalMinutes || 0 });
      setActivities(activityData.activities || []);
      setWeeklyData(weeklyResp.weeklyData || []);
      setLoading(false);
    });
  }, []);

  const fallbackWeeklyData = [
    { day: 'Mon', minutes: 0 }, { day: 'Tue', minutes: 0 }, { day: 'Wed', minutes: 0 },
    { day: 'Thu', minutes: 0 }, { day: 'Fri', minutes: 0 }, { day: 'Sat', minutes: 0 }, { day: 'Sun', minutes: 0 },
  ];
  const chartData = weeklyData.length > 0 ? weeklyData : fallbackWeeklyData;
  const maxMinutes = Math.max(...chartData.map((d) => d.minutes), 1);
  const totalWeekly = chartData.reduce((s, d) => s + d.minutes, 0);

  const features = [
    { id: 'chat' as const, icon: MessageSquare, title: 'AI Teacher Chat', description: 'Get instant help from your AI teaching assistant on any topic.', color: 'bg-emerald-500', lightColor: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'explain' as const, icon: BarChart3, title: 'AI Explainer', description: 'Get detailed explanations of formulas, concepts, and proofs.', color: 'bg-teal-500', lightColor: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400' },
    { id: 'summarizer' as const, icon: FileSearch, title: 'AI Summarizer', description: 'Paste notes or articles and get AI-powered concise summaries.', color: 'bg-cyan-500', lightColor: 'bg-cyan-50 dark:bg-cyan-950/30', textColor: 'text-cyan-600 dark:text-cyan-400' },
    { id: 'vision' as const, icon: ScanLine, title: 'Image Analyzer', description: 'Upload textbook pages, diagrams, or screenshots for explanations.', color: 'bg-amber-500', lightColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400' },
    { id: 'quiz' as const, icon: Brain, title: 'Quiz Generator', description: 'Generate custom quizzes to test your knowledge on any topic.', color: 'bg-rose-500', lightColor: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400' },
    { id: 'flashcards' as const, icon: BookOpen, title: 'Flashcards', description: 'Create and study with AI-powered flashcard decks.', color: 'bg-violet-500', lightColor: 'bg-violet-50 dark:bg-violet-950/30', textColor: 'text-violet-600 dark:text-violet-400' },
    { id: 'notes' as const, icon: FileText, title: 'Smart Notes', description: 'Organize study notes with colors, pins, and search.', color: 'bg-sky-500', lightColor: 'bg-sky-50 dark:bg-sky-950/30', textColor: 'text-sky-600 dark:text-sky-400' },
    { id: 'pomodoro' as const, icon: Timer, title: 'Focus Timer', description: 'Stay focused with Pomodoro technique and track sessions.', color: 'bg-orange-500', lightColor: 'bg-orange-50 dark:bg-orange-950/30', textColor: 'text-orange-600 dark:text-orange-400' },
    { id: 'websearch' as const, icon: Search, title: 'Web Research', description: 'Search the web for academic resources and tutorials.', color: 'bg-teal-500', lightColor: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400' },
    { id: 'streak' as const, icon: Flame, title: 'Study Streak', description: 'Track your daily study streak with a visual heatmap calendar.', color: 'bg-amber-500', lightColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400' },
    { id: 'courses' as const, icon: Library, title: 'Courses', description: 'Manage courses and organize materials by subject.', color: 'bg-pink-500', lightColor: 'bg-pink-50 dark:bg-pink-950/30', textColor: 'text-pink-600 dark:text-pink-400' },
    { id: 'goals' as const, icon: Target, title: 'Study Goals', description: 'Set learning targets and track your progress.', color: 'bg-emerald-500', lightColor: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'mood' as const, icon: Heart, title: 'Mood Tracker', description: 'Log your daily study mood and track emotional trends.', color: 'bg-rose-500', lightColor: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400' },
    { id: 'solver' as const, icon: Calculator, title: 'AI Solver', description: 'Get step-by-step solutions for math, code, and more.', color: 'bg-violet-500', lightColor: 'bg-violet-50 dark:bg-violet-950/30', textColor: 'text-violet-600 dark:text-violet-400' },
    { id: 'achievements' as const, icon: Trophy, title: 'Achievements', description: 'Unlock badges by completing learning milestones and challenges.', color: 'bg-amber-500', lightColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-6xl mx-auto overflow-y-auto h-full">
      {/* Hero Section with Animated Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8 text-white gradient-mesh"
        style={{
          background: 'linear-gradient(135deg, #047857 0%, #059669 25%, #0d9488 50%, #0f766e 75%, #047857 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/[0.03] rounded-full" />
        <div className="absolute bottom-4 right-8 w-16 h-16 bg-white/[0.05] rounded-full" />
        <div className="absolute top-4 left-8 w-24 h-24 bg-white/[0.04] rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl sm:text-3xl shadow-lg shadow-black/10 shrink-0"
            >
              {getTimeEmoji()}
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight leading-snug text-balance">
                {getGreeting()}, <span className="greeting-name-text">{userName || 'Student'}</span>!
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1 opacity-90">
                <span className="hidden sm:inline">Ready to learn something new today? Your AI companion is here to help.</span>
                <span className="sm:hidden">Your AI study companion is ready.</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-0 text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 backdrop-blur-sm"
            >
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 sm:mr-1.5" />
              Powered by AI
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          {
            icon: Clock,
            label: 'Study Hours',
            value: loading ? null : stats.totalMinutes === 0 ? '0h 0m' : `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`,
            hint: stats.totalMinutes > 0 ? 'Total time invested' : 'Start your first session',
            accent: '#10b981',
            accentLight: 'rgba(16,185,129,0.08)',
            accentBorder: 'rgba(16,185,129,0.18)',
            iconBg: 'bg-emerald-500',
            valueColor: 'text-emerald-600 dark:text-emerald-400',
            bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
            barWidth: Math.min((stats.totalMinutes / 600) * 100, 100),
            isEmpty: stats.totalMinutes === 0,
          },
          {
            icon: Flame,
            label: 'Sessions',
            value: loading ? null : stats.totalSessions.toString(),
            hint: stats.totalSessions > 0 ? 'Completed sessions' : 'No sessions yet',
            accent: '#f97316',
            accentLight: 'rgba(249,115,22,0.08)',
            accentBorder: 'rgba(249,115,22,0.18)',
            iconBg: 'bg-orange-500',
            valueColor: 'text-orange-500',
            bar: 'bg-gradient-to-r from-orange-500 to-amber-400',
            barWidth: Math.min((stats.totalSessions / 20) * 100, 100),
            isEmpty: stats.totalSessions === 0,
          },
          {
            icon: TrendingUp,
            label: 'This Week',
            value: loading ? null : totalWeekly > 0 ? `${Math.floor(totalWeekly / 60)}h ${totalWeekly % 60}m` : '0m',
            hint: totalWeekly > 0 ? 'Weekly progress' : 'No activity yet',
            accent: '#8b5cf6',
            accentLight: 'rgba(139,92,246,0.08)',
            accentBorder: 'rgba(139,92,246,0.18)',
            iconBg: 'bg-violet-500',
            valueColor: 'text-violet-500',
            bar: 'bg-gradient-to-r from-violet-500 to-purple-400',
            barWidth: Math.min((totalWeekly / 300) * 100, 100),
            isEmpty: totalWeekly === 0,
          },
          {
            icon: Trophy,
            label: 'Level',
            value: loading ? null : 'Scholar',
            hint: 'Keep learning to level up',
            accent: '#f59e0b',
            accentLight: 'rgba(245,158,11,0.08)',
            accentBorder: 'rgba(245,158,11,0.18)',
            iconBg: 'bg-amber-500',
            valueColor: 'text-amber-500',
            bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
            barWidth: 35,
            isEmpty: false,
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div
              className="relative overflow-hidden rounded-2xl bg-card group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default"
              style={{ border: `1px solid ${stat.accentBorder}`, boxShadow: `0 1px 3px rgba(0,0,0,0.06), inset 0 0 0 1px ${stat.accentBorder}` }}
            >
              {/* Subtle tinted background */}
              <div className="absolute inset-0 opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(ellipse at top left, ${stat.accentLight} 0%, transparent 70%)` }} />

              <div className="relative p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                {/* Top row: icon + label */}
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    <stat.icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">{stat.label}</span>
                </div>

                {/* Value */}
                {loading ? (
                  <div className="space-y-1.5">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-2.5 w-14" />
                  </div>
                ) : (
                  <div>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.07, type: 'spring' }}
                      className={`text-xl sm:text-2xl font-bold tracking-tight leading-none ${stat.isEmpty ? 'text-muted-foreground/50' : stat.valueColor}`}
                    >
                      {stat.value}
                    </motion.p>
                    <p className={`text-[11px] mt-1.5 leading-tight ${stat.isEmpty ? 'text-muted-foreground/40' : 'text-muted-foreground/70'}`}>
                      {stat.hint}
                    </p>
                  </div>
                )}

                {/* Progress bar */}
                <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.barWidth}%` }}
                    transition={{ duration: 1.1, delay: 0.35 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={`h-full rounded-full ${stat.isEmpty ? 'opacity-20' : 'opacity-80'} ${stat.bar}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Weekly Report + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Weekly Report */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <Card className="border-0 shadow-sm bg-card h-full hover:shadow-md transition-shadow duration-300 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Weekly Report
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {totalWeekly > 0 ? `${totalWeekly} minutes studied this week` : 'Your study activity will appear here'}
                  </CardDescription>
                </div>
                {totalWeekly > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Weekly total</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Math.floor(totalWeekly / 60)}h {totalWeekly % 60}m</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Always show chart — dummy data when empty */}
              {(() => {
                const dummyData = [
                  { day: 'Mon', minutes: 45 },
                  { day: 'Tue', minutes: 30 },
                  { day: 'Wed', minutes: 60 },
                  { day: 'Thu', minutes: 20 },
                  { day: 'Fri', minutes: 50 },
                  { day: 'Sat', minutes: 15 },
                  { day: 'Sun', minutes: 35 },
                ];
                const isNewUser = totalWeekly === 0 && !loading;
                const displayData = isNewUser ? dummyData : chartData;
                const displayMax = Math.max(...displayData.map(d => d.minutes), 1);
                return (
                  <>
                    {isNewUser && (
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                        <p className="text-[11px] text-muted-foreground/60 italic">Preview — your data will appear once you start studying</p>
                      </div>
                    )}
                    <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: '120px' }}>
                      {displayData.map((d, i) => {
                        const heightPx = Math.max((d.minutes / displayMax) * 100, 6);
                        const isToday = !isNewUser && i === todayIndex;
                        return (
                          <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full group">
                            {d.minutes > 0 && (
                              <span className={`text-[9px] font-medium mb-1 transition-opacity ${isNewUser ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                {d.minutes}m
                              </span>
                            )}
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPx}px` }}
                              transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: 'easeOut' }}
                              className={`w-full rounded-t-md transition-all duration-200 ${
                                isNewUser
                                  ? 'bg-gradient-to-t from-muted-foreground/15 to-muted-foreground/8 dark:from-muted-foreground/10 dark:to-muted-foreground/5'
                                  : isToday
                                  ? 'bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/30 group-hover:brightness-110'
                                  : d.minutes > 0
                                  ? 'bg-gradient-to-t from-emerald-600/80 via-emerald-500/60 to-teal-400/40 group-hover:brightness-110'
                                  : 'bg-muted-foreground/10'
                              }`}
                            />
                            <span className={`text-[10px] font-medium mt-1.5 ${
                              isNewUser ? 'text-muted-foreground/40' :
                              isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'
                            }`}>
                              {d.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dashed">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-sm ${isNewUser ? 'bg-muted-foreground/20' : 'bg-gradient-to-t from-emerald-600 to-emerald-400'}`} />
                        <span className="text-[10px] text-muted-foreground">{isNewUser ? 'Preview' : 'Today'}</span>
                      </div>
                      {!isNewUser && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/20" />
                          <span className="text-[10px] text-muted-foreground">This week</span>
                        </div>
                      )}
                      <div className="ml-auto flex items-center gap-1.5">
                        <Zap className={`w-3 h-3 ${isNewUser ? 'text-muted-foreground/40' : 'text-amber-500'}`} />
                        <span className={`text-xs font-semibold ${isNewUser ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                          {isNewUser ? 'Start studying to track' : `Total: ${totalWeekly} min`}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-sm bg-card h-full hover:shadow-md transition-shadow duration-300 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {activities.length > 0 ? 'Your latest learning sessions' : 'Sessions will appear as you learn'}
                  </CardDescription>
                </div>
                {activities.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800">
                    {activities.length} sessions
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-1 max-h-[17rem] overflow-y-auto pr-1">
                  {activities.slice(0, 8).map((activity) => {
                    const iconData = activityIcons[activity.type] || activityIcons.chat;
                    const IconComp = iconData.icon;
                    return (
                      <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className={`w-8 h-8 rounded-lg ${iconData.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                          <IconComp className={`w-4 h-4 ${iconData.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{activity.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{activity.subtitle}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{activity.timeAgo}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Clean empty state for new users */
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center justify-center py-8 px-4 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground/50">No activity yet</p>
                  <p className="text-[11px] text-muted-foreground/35 mt-1 leading-relaxed max-w-[160px]">
                    Your weekly and previous sessions will show up here
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Study Tools
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={item}>
              <Card
                className="group cursor-pointer border-0 shadow-sm bg-card h-full overflow-hidden feature-card-enhanced hover:border-l-[3px] hover:border-l-primary/40"
                onClick={() => setCurrentView(feature.id)}
              >
                <div className="h-0.5 bg-transparent group-hover:bg-gradient-to-r group-hover:from-primary/60 group-hover:to-teal-400/20 transition-all duration-300" />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${feature.lightColor} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md feature-card-icon-glow`}
                    >
                      <feature.icon className={`w-5 h-5 ${feature.textColor}`} />
                    </div>
                    <CardTitle className="text-sm md:text-base font-semibold">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs md:text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-4 md:p-5">
            <h3 className="font-semibold text-sm md:text-base mb-2.5 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Quick Start Tips
            </h3>
            <ul className="space-y-1.5 text-xs md:text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                Use <strong className="text-foreground">AI Teacher Chat</strong> to ask questions about any topic
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                Try the new <strong className="text-foreground">AI Summarizer</strong> to condense long lecture notes
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                Build your <strong className="text-foreground">Study Streak</strong> by studying every day
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                Generate practice <strong className="text-foreground">Quizzes</strong> to test your understanding
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">5</span>
                Press <kbd className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded border border-border bg-muted font-mono text-[10px] font-medium">?</kbd>{' '}
                anytime to see keyboard shortcuts
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">6</span>
                Use <strong className="text-foreground">AI Solver</strong> for step-by-step math solutions
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">7</span>
                Track your <strong className="text-foreground">Mood</strong> to find your best study times
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
