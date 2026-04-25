'use client';

import React, { useState } from 'react';
import {
  Zap, Shield, Heart, FileSearch,
  Flame, Target, Calculator, SmilePlus, Headphones,
  Sparkles, ExternalLink, Mail, Globe, Instagram, Linkedin,
  Code2, Brain, MessageSquare, Timer, BarChart3, Trophy,
  Copy, Check, Star, Cpu, Database, Layers, BookOpen,
  GraduationCap, MapPin, Rocket, Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

export function SettingsView() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText('faisalkhan0297@outlook.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const features = [
    { icon: MessageSquare, title: 'AI Teacher Chat',   desc: 'Personalized tutoring on any topic',        color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { icon: BookOpen,      title: 'Image Analyzer',    desc: 'Understand diagrams & textbook pages',      color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30'   },
    { icon: Brain,         title: 'Quiz Generator',    desc: 'Custom quizzes with instant feedback',      color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/30'     },
    { icon: Zap,           title: 'Flashcards',        desc: 'AI-powered spaced repetition cards',        color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { icon: Shield,        title: 'Voice Support',     desc: 'Ask by voice, listen to explanations',      color: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-950/30'       },
    { icon: FileSearch,    title: 'AI Summarizer',     desc: 'Condense lecture notes instantly',          color: 'text-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-950/30'     },
    { icon: Timer,         title: 'Focus Timer',       desc: 'Pomodoro sessions with tracking',           color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { icon: Flame,         title: 'Study Streak',      desc: 'Daily activity heatmap calendar',           color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30'   },
    { icon: Target,        title: 'Goals & Plans',     desc: 'AI study plans & progress tracking',        color: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-950/30'     },
    { icon: Calculator,    title: 'AI Solver',         desc: 'Step-by-step math & code solutions',        color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { icon: SmilePlus,     title: 'Mood Tracker',      desc: 'Track emotional study trends',              color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950/30'     },
    { icon: BarChart3,     title: 'Statistics',        desc: 'Deep insights into your learning',          color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { icon: Headphones,    title: 'Focus Sounds',      desc: 'Ambient audio for deep focus',              color: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-950/30'     },
    { icon: Trophy,        title: 'Achievements',      desc: 'Unlock badges & milestones',                color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30'   },
  ];

  const techStack = [
    { name: 'Next.js 15',    icon: Layers,   color: 'text-foreground'  },
    { name: 'TypeScript',    icon: Code2,    color: 'text-blue-500'    },
    { name: 'Groq AI',       icon: Cpu,      color: 'text-emerald-500' },
    { name: 'Tailwind CSS',  icon: Sparkles, color: 'text-cyan-500'    },
    { name: 'shadcn/ui',     icon: Layers,   color: 'text-violet-500'  },
    { name: 'Prisma ORM',    icon: Database, color: 'text-teal-500'    },
    { name: 'Framer Motion', icon: Zap,      color: 'text-pink-500'    },
    { name: 'Zustand',       icon: Shield,   color: 'text-orange-500'  },
  ];

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const item      = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm shrink-0">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">About</h2>
          <p className="text-xs text-muted-foreground">FSK EDU AI · v1.0.0</p>
        </div>
      </div>

      <ScrollArea className="flex-1 h-full min-h-0">
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          {/* ══════════════════════════════════════
              HERO CARD — Logo + App Info
          ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Card className="border border-border/60 shadow-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
              <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center">

                {/* Logo */}
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative mb-4 sm:mb-5"
                >
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-emerald-400/25 via-teal-400/15 to-cyan-400/25 blur-2xl scale-125 pointer-events-none" />
                  <div className="relative w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-200/60 dark:border-emerald-700/40 flex items-center justify-center shadow-2xl shadow-emerald-500/10 overflow-hidden">
                    <img
                      src="/fsk-logo.png"
                      alt="FSK EDU AI Logo"
                      className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 object-contain drop-shadow-md"
                      style={{ objectPosition: 'center top' }}
                    />
                  </div>
                </motion.div>

                {/* App name + subtitle */}
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight">FSK EDU AI</h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium mt-1">
                  AI-Powered Educational Assistant
                </p>

                {/* Badges */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 flex-wrap">
                  <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5">
                    v1.0.0
                  </Badge>
                  <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5">
                    <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1 fill-amber-500 text-amber-500" /> Open Beta
                  </Badge>
                  <Badge className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5">
                    <Rocket className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1" /> Free to Use
                  </Badge>
                </div>

                {/* Description */}
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg">
                  FSK EDU AI is a comprehensive AI-powered study assistant designed for university students.
                  It leverages cutting-edge AI to provide personalized teaching, instant explanations,
                  and powerful study tools that help you learn more effectively.
                </p>

                {/* Stat pills */}
                <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                  {[
                    { label: '14+ Features',       icon: Sparkles      },
                    { label: 'Groq AI Powered',    icon: Cpu           },
                    { label: 'For Students',        icon: GraduationCap },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted/60 border border-border/50 text-[10px] sm:text-xs text-muted-foreground font-medium">
                      <Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500" />
                      {label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ══════════════════════════════════════
              DEVELOPER CARD — Faisal + Links
          ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
          >
            <Card className="border border-border/60 shadow-md overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-violet-400 via-pink-400 to-rose-400" />
              <CardContent className="p-4 sm:p-5 space-y-3 sm:space-y-4">

                {/* ── Profile row ── */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-white text-lg sm:text-xl font-bold select-none ring-2 ring-emerald-300/30 dark:ring-emerald-700/30">
                      FK
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center shadow-sm">
                      <Award className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base tracking-tight">Faisal Arslan Khan</h3>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-0 font-semibold">
                        Creator
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <GraduationCap className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground shrink-0" />
                      <p className="text-xs sm:text-sm text-muted-foreground">Software Engineering Student</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">Pakistan</p>
                    </div>
                  </div>
                </div>

                {/* ── Bio ── */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border/40">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Passionate Software Engineering student with a love for building AI-powered tools that make
                    education more accessible and effective. FSK EDU AI was born from a simple idea — every student
                    deserves a smart study companion that actually understands them.
                  </p>
                </div>

                {/* ── Find Faisal Here ── */}
                <div>
                  {/* Divider label */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-2 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Find Faisal Here
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
                  </div>

                  {/* ── Social Links ── */}
                  <div className="space-y-2">
                    <a
                      href="https://www.linkedin.com/in/faisal-arslan-khan-a3140232a/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                        <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">LinkedIn</p>
                        <p className="text-[10px] sm:text-xs text-blue-600/70 dark:text-blue-400/70 truncate">
                          linkedin.com/in/faisal-arslan-khan
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors shrink-0" />
                    </a>

                    <a
                      href="https://www.instagram.com/faisu._khan01/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center shrink-0 shadow-md shadow-pink-500/30 group-hover:scale-105 transition-transform">
                        <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs sm:text-sm font-bold text-pink-700 dark:text-pink-300">Instagram</p>
                        <p className="text-[10px] sm:text-xs text-pink-600/70 dark:text-pink-400/70 truncate">
                          @faisu._khan01
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-pink-400 group-hover:text-pink-600 dark:group-hover:text-pink-300 transition-colors shrink-0" />
                    </a>

                    <a
                      href="https://faisalarslankhan.netlify.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all duration-200 group cursor-pointer"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">Portfolio Website</p>
                        <p className="text-[10px] sm:text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">
                          faisalarslankhan.netlify.app
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors shrink-0" />
                    </a>

                    <div className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-all duration-200 group">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/30 group-hover:scale-105 transition-transform">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-300">Email</p>
                        <p className="text-[10px] sm:text-xs text-teal-600/70 dark:text-teal-400/70 truncate">
                          faisalkhan0297@outlook.com
                        </p>
                      </div>
                      <button
                        onClick={copyEmail}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors shrink-0"
                        title="Copy email"
                      >
                        {copiedEmail
                          ? <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-500" />
                          : <Copy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-teal-500 dark:text-teal-400" />
                        }
                      </button>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>

          {/* ══════════════════════════════════════
              FEATURES GRID
          ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-sm mb-3 sm:mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {features.length} Features Included
                </h3>
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  {features.map((f) => (
                    <motion.div
                      key={f.title}
                      variants={item}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-accent/60 transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${f.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                        <f.icon className={`w-4 h-4 ${f.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-tight">{f.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ══════════════════════════════════════
              TECH STACK
          ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="border border-border/60 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Built With
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  {techStack.map((t) => (
                    <div key={t.name} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border/40 hover:bg-accent transition-colors">
                      <t.icon className={`w-3.5 h-3.5 shrink-0 ${t.color}`} />
                      <span className="text-xs font-medium truncate">{t.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ══════════════════════════════════════
              FOOTER
          ══════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <Card className="border border-border/60 shadow-sm bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 overflow-hidden">
              <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
              <CardContent className="p-4 sm:p-5 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <p className="text-sm font-semibold">Made for Students, by a Student</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Built with passion by{' '}
                  <span className="font-semibold text-foreground">Faisal Arslan Khan</span>
                  {' '}· FSK EDU AI v1.0.0
                </p>
                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">Next.js 15</Badge>
                  <Badge variant="secondary" className="text-[10px]">Groq AI</Badge>
                  <Badge variant="secondary" className="text-[10px]">Open Source</Badge>
                  <Badge variant="secondary" className="text-[10px]">Free to Use</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </ScrollArea>
    </div>
  );
}
