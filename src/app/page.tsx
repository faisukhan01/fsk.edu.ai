'use client';

import React, { useEffect, useCallback, useState } from 'react';
import AnimatedLoginPage from '@/components/AnimatedLoginPage';
import { useAppStore, type View } from '@/lib/store';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarInset,
  SidebarTrigger, SidebarRail
} from '@/components/ui/sidebar';
import { DashboardView } from '@/components/edu/DashboardView';
import { ChatView } from '@/components/edu/ChatView';
import { QuizView } from '@/components/edu/QuizView';
import { FlashcardsView } from '@/components/edu/FlashcardsView';
import { NotesView } from '@/components/edu/NotesView';
import { PomodoroView } from '@/components/edu/PomodoroView';
import { WebSearchView } from '@/components/edu/WebSearchView';
import { CoursesView } from '@/components/edu/CoursesView';
import { StatisticsView } from '@/components/edu/StatisticsView';
import { FormulaExplainerView } from '@/components/edu/FormulaExplainerView';
import { SettingsView } from '@/components/edu/SettingsView';
import { GoalsView } from '@/components/edu/GoalsView';
import { StudyPlanView } from '@/components/edu/StudyPlanView';
import { SummarizerView } from '@/components/edu/SummarizerView';
import { StreakView } from '@/components/edu/StreakView';
import { MoodTrackerView } from '@/components/edu/MoodTrackerView';
import { MathSolverView } from '@/components/edu/MathSolverView';
import { AchievementsView } from '@/components/edu/AchievementsView';
import { OnboardingOverlay } from '@/components/edu/OnboardingOverlay';
import { ToastContainer } from '@/components/edu/ToastContainer';
import { HelpDialog } from '@/components/edu/HelpDialog';
import { NotificationCenter } from '@/components/edu/NotificationCenter';
import { QuickNotesWidget } from '@/components/edu/QuickNotesWidget';
import {
  LayoutDashboard, MessageSquare, Brain, BookOpen,
  FileText, Timer, Search, Settings, Moon, Sun,
  Library, HelpCircle, CircleDot, BarChart3, Sigma, Target, CalendarDays,
  FileSearch, Flame, Heart, Calculator, Trophy
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const navItems: { id: View; label: string; icon: React.ElementType; color: string; badge?: string }[] = [
  // AI Tools (0-4)
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-emerald-500' },
  { id: 'chat', label: 'AI Teacher', icon: MessageSquare, color: 'text-emerald-500', badge: 'AI' },
  { id: 'explain', label: 'AI Explainer', icon: Sigma, color: 'text-teal-500' },
  { id: 'solver', label: 'AI Solver', icon: Calculator, color: 'text-violet-500', badge: 'New' },
  { id: 'summarizer', label: 'AI Summarizer', icon: FileSearch, color: 'text-cyan-500', badge: 'New' },
  // Study (5-11)
  { id: 'quiz', label: 'Quiz', icon: Brain, color: 'text-rose-500' },
  { id: 'flashcards', label: 'Flashcards', icon: BookOpen, color: 'text-violet-500' },
  { id: 'notes', label: 'Notes', icon: FileText, color: 'text-sky-500' },
  { id: 'pomodoro', label: 'Focus Timer', icon: Timer, color: 'text-orange-500' },
  { id: 'websearch', label: 'Web Research', icon: Search, color: 'text-teal-500' },
  { id: 'streak', label: 'Study Streak', icon: Flame, color: 'text-amber-500' },
  { id: 'studyplan', label: 'AI Study Plan', icon: CalendarDays, color: 'text-teal-500' },
  // Productivity (12-16)
  { id: 'courses', label: 'Courses', icon: Library, color: 'text-pink-500' },
  { id: 'statistics', label: 'Statistics', icon: BarChart3, color: 'text-cyan-500' },
  { id: 'goals', label: 'Study Goals', icon: Target, color: 'text-emerald-500' },
  { id: 'mood', label: 'Mood Tracker', icon: Heart, color: 'text-rose-500', badge: 'New' },
  { id: 'achievements', label: 'Achievements', icon: Trophy, color: 'text-amber-500', badge: 'New' },
  { id: 'settings', label: 'About', icon: Settings, color: 'text-muted-foreground' },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-accent"
          onClick={() => {
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('fsk-edu-theme', newTheme);
          }}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Toggle theme (Shift+T)</p>
      </TooltipContent>
    </Tooltip>
  );
}

function AppSidebar({ userName }: { userName: string }) {
  const { currentView, setCurrentView } = useAppStore();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[active=true]:bg-sidebar-accent rounded-lg" onClick={() => setCurrentView('dashboard')}>
              <div className="flex aspect-square size-[35px] items-center justify-center">
                <img src="/fsk-logo.png" alt="FSK" className="size-[35px] object-contain" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold gradient-text text-base">FSK EDU AI</span>
                <span className="truncate text-xs text-muted-foreground">Study Assistant</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider">AI Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.slice(0, 5).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    tooltip={item.label}
                    onClick={() => setCurrentView(item.id)}
                    className="rounded-lg"
                  >
                    <div className="relative">
                      <item.icon className={`w-4 h-4 ${currentView === item.id ? item.color : ''}`} />
                    </div>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className={`ml-auto text-[9px] px-1.5 py-0 h-4 font-bold ${
                        item.badge === 'New'
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-0'
                          : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-0'
                      }`}>
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider">Study</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.slice(5, 12).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    tooltip={item.label}
                    onClick={() => setCurrentView(item.id)}
                    className="rounded-lg"
                  >
                    <item.icon className={`w-4 h-4 ${currentView === item.id ? item.color : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider">Productivity</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.slice(12, 17).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    tooltip={item.label}
                    onClick={() => setCurrentView(item.id)}
                    className="rounded-lg"
                  >
                    <item.icon className={`w-4 h-4 ${currentView === item.id ? item.color : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentView === 'settings'}
              tooltip="About"
              onClick={() => setCurrentView('settings')}
              className="rounded-lg"
            >
              <Settings className="w-4 h-4" />
              <span>About</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">By Faisal Khan</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  Made <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500 inline" /> for Students
                </p>
              </div>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

const viewComponents: Record<View, React.ComponentType> = {
  dashboard: DashboardView,
  chat: ChatView,
  explain: FormulaExplainerView,
  summarizer: SummarizerView,
  quiz: QuizView,
  flashcards: FlashcardsView,
  notes: NotesView,
  pomodoro: PomodoroView,
  websearch: WebSearchView,
  streak: StreakView,
  mood: MoodTrackerView,
  solver: MathSolverView,
  courses: CoursesView,
  statistics: StatisticsView,
  goals: GoalsView,
  studyplan: StudyPlanView,
  achievements: AchievementsView,
  settings: SettingsView,
};

const viewByNumber: View[] = [
  'dashboard',
  'chat',
  'explain',
  'solver',
  'summarizer',
  'quiz',
  'flashcards',
  'notes',
  'pomodoro',
  'websearch',
  'streak',
  'studyplan',
  'mood',
  'solver',
  'courses',
  'statistics',
  'goals',
  'achievements',
];

function MainApp({ onSignOut, userName }: { onSignOut: () => void; userName: string }) {
  const { currentView, setCurrentView, setShowHelp } = useAppStore();
  const { theme, setTheme: setNextTheme } = useTheme();
  const ViewComponent = viewComponents[currentView];

  // Persist theme preference
  useEffect(() => {
    const saved = localStorage.getItem('fsk-edu-theme');
    if (saved && saved !== theme) {
      setNextTheme(saved);
    }
  }, []);

  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (!(e.ctrlKey || e.metaKey)) return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCurrentView('websearch');
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      if (e.key === '?' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < viewByNumber.length) {
          setCurrentView(viewByNumber[index]);
        }
        return;
      }

      if (e.shiftKey && e.key === 'T') {
        e.preventDefault();
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setNextTheme(newTheme);
        localStorage.setItem('fsk-edu-theme', newTheme);
        return;
      }
    },
    [setCurrentView, setShowHelp, setNextTheme, theme]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  const currentNav = navItems.find((n) => n.id === currentView);

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} />
      <SidebarInset className="h-screen overflow-hidden flex flex-col">
        {/* Header - Glassmorphism with gradient line */}
        <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shrink-0" />
        <header className="flex h-12 sm:h-13 items-center gap-1.5 sm:gap-2 border-b border-border/50 bg-background/80 backdrop-blur-xl px-2 sm:px-4 shrink-0 z-10">
          <SidebarTrigger className="-ml-1 rounded-lg" />

          <div className="flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2 min-w-0">
            {currentNav && (
              <motion.div
                key={currentView}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 sm:gap-2 min-w-0"
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 ${currentNav.color}`}>
                  <currentNav.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold truncate">
                  {currentNav.label}
                </span>
              </motion.div>
            )}
          </div>

          <div className="flex-1" />

          {/* Active view indicator dot */}
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Online</span>
          </div>

          {/* Help button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-accent"
                onClick={() => setShowHelp(true)}
              >
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Keyboard shortcuts (?)</p>
            </TooltipContent>
          </Tooltip>

          <NotificationCenter />

          <ThemeToggle />

          {/* User profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 px-2 gap-1.5 sm:gap-2 rounded-lg hover:bg-accent">
                <Avatar className="h-6 w-6 ring-2 ring-emerald-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-bold shadow-sm">
                    {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'FK'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium hidden sm:inline">{userName || 'Student'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 sm:w-52 rounded-xl">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold">{userName || 'Student'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <CircleDot className="w-3 h-3 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">FSK University</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentView('settings')} className="rounded-lg mx-1">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  localStorage.removeItem('fsk-edu-auth');
                  onSignOut();
                }}
                className="rounded-lg mx-1 text-red-500 focus:text-red-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full"
            >
              {currentView === 'dashboard' ? (
                <DashboardView userName={userName} />
              ) : (
                ViewComponent && <ViewComponent />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer - Glassmorphism */}
        <footer className="border-t border-border/50 bg-background/80 backdrop-blur-xl px-3 sm:px-4 py-1.5 sm:py-2 shrink-0 safe-bottom">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-bold text-foreground/80">FSK EDU AI</span>
              <span className="text-foreground/30 hidden xs:inline">|</span>
              <span className="hidden xs:inline">v1.0.0</span>
              <span className="text-foreground/30 hidden sm:inline">|</span>
              <span className="hidden sm:inline">22 Features</span>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              Press <kbd className="inline-flex items-center justify-center min-w-[1rem] h-4 px-0.5 rounded border border-border bg-muted font-mono text-[9px] font-medium mx-0.5 shadow-sm">?</kbd> for shortcuts
            </span>
          </div>
        </footer>
      </SidebarInset>

      {/* Help Dialog */}
      <OnboardingOverlay />

      {/* Toast Notifications */}
      <ToastContainer />
      <HelpDialog />

      {/* Quick Notes FAB */}
      <QuickNotesWidget />
    </SidebarProvider>
  );
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Validate session with the server on mount
  useEffect(() => {
    // Check for Google OAuth error in URL
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      const messages: Record<string, string> = {
        google_denied: 'Google sign-in was cancelled.',
        google_token_failed: 'Google sign-in failed. Please try again.',
        google_userinfo_failed: 'Could not retrieve your Google account info.',
        google_no_email: 'Your Google account has no email address.',
        google_auth_failed: 'Google sign-in failed. Please try again.',
      };
      setGoogleError(messages[err] || 'Sign-in failed. Please try again.');
      // Clean the URL
      window.history.replaceState({}, '', '/');
    }

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserName(data.user.name || '');
          setUserEmail(data.user.email || '');
          setIsAuthenticated(true);
        }
      })
      .catch(() => {})
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const handleAuthSuccess = useCallback((name?: string) => {
    if (name) setUserName(name);
    setIsAuthenticated(true);
    // Re-fetch user info to get email too
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserName(data.user.name || name || '');
          setUserEmail(data.user.email || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setUserName('');
    setUserEmail('');
  }, []);

  // Show nothing while checking auth (avoids flash of login page)
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src="/fsk-logo.png" alt="FSK EDU AI" className="w-16 h-16 object-contain animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AnimatedLoginPage onSuccess={handleAuthSuccess} googleError={googleError} />;
  }

  return <MainApp onSignOut={handleSignOut} userName={userName} />;
}
