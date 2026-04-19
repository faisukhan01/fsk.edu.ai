'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Send, Sparkles, Clock, BookOpen, CheckCircle2,
  Lightbulb, Target, ChevronRight, Loader2, Download, RotateCcw,
  GraduationCap, ListChecks, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';

interface DailyPlan {
  day: string;
  tasks: string[];
  focus: string;
  estimatedMinutes: number;
  tips: string;
}

interface StudyPlan {
  title: string;
  overview: string;
  duration: string;
  dailyPlan: DailyPlan[];
  resources: string[];
  milestones: string[];
  keyConcepts: string[];
}

export function StudyPlanView() {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('1 week');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [textResponse, setTextResponse] = useState('');
  const [currentDay, setCurrentDay] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const generatePlan = async () => {
    if (!topic.trim() || isLoading) return;
    setIsLoading(true);
    setPlan(null);
    setTextResponse('');
    setCurrentDay(0);
    setCompletedTasks(new Set());

    try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), duration, difficulty, preferences }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
      } else if (data.response) {
        setTextResponse(data.response);
      }
    } catch {
      setTextResponse('Failed to generate study plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); generatePlan(); }
  };

  const toggleTask = (task: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(task)) next.delete(task);
      else next.add(task);
      return next;
    });
  };

  const exportPlan = () => {
    if (!plan) return;
    let text = `# ${plan.title}\n\n${plan.overview}\n\n`;
    text += `**Duration:** ${plan.duration}\n`;
    text += `**Difficulty:** ${difficulty}\n\n`;
    text += `## Key Concepts\n${plan.keyConcepts.map(c => `- ${c}`).join('\n')}\n\n`;
    text += `## Resources\n${plan.resources.map(r => `- ${r}`).join('\n')}\n\n`;
    text += `## Milestones\n${plan.milestones.map(m => `- ${m}`).join('\n')}\n\n`;
    plan.dailyPlan.forEach(day => {
      text += `## ${day.day}\n**Focus:** ${day.focus} (${day.estimatedMinutes} min)\n**Tips:** ${day.tips}\n`;
      day.tasks.forEach(t => { text += `- [ ] ${t}\n`; });
      text += '\n';
    });
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.replace(/\s+/g, '_')}_study_plan.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const topicSuggestions = [
    'Data Structures & Algorithms',
    'Organic Chemistry',
    'Calculus & Linear Algebra',
    'Machine Learning Fundamentals',
    'Operating Systems',
    'Web Development Full Stack',
  ];

  const totalTasks = plan?.dailyPlan.reduce((s, d) => s + d.tasks.length, 0) || 0;
  const completedCount = completedTasks.size;
  const planProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  if (plan) {
    const day = plan.dailyPlan[currentDay];
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CalendarDays className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm truncate max-w-[200px]">{plan.title}</h2>
              <p className="text-xs text-muted-foreground">Day {currentDay + 1} of {plan.dailyPlan.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">{planProgress}% done</Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exportPlan}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPlan(null); setTextResponse(''); }}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <Progress value={planProgress} className="h-1.5" />
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Day Navigation */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {plan.dailyPlan.map((d, i) => (
                <button key={i} onClick={() => setCurrentDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    i === currentDay
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent'
                  }`}>
                  {d.day.split(' - ')[0]}
                </button>
              ))}
            </div>

            {/* Current Day */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDay}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{day.day}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{day.estimatedMinutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        <span>{day.focus}</span>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-primary" />
                        Tasks
                      </h4>
                      {day.tasks.map((task, i) => {
                        const taskKey = `${currentDay}-${i}-${task}`;
                        const isCompleted = completedTasks.has(taskKey);
                        return (
                          <button key={i} onClick={() => toggleTask(taskKey)}
                            className={`w-full text-left flex items-start gap-3 p-2.5 rounded-xl border transition-all text-sm ${
                              isCompleted
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                : 'bg-card border-border hover:bg-accent'
                            }`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/30'
                            }`}>
                              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>{task}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Tips */}
                    <Card className="bg-amber-50 dark:bg-amber-950/20 border-0">
                      <CardContent className="p-3 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">{day.tips}</p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                {/* Day Navigation Buttons */}
                <div className="flex justify-between">
                  <Button variant="outline" className="rounded-xl gap-2"
                    disabled={currentDay === 0}
                    onClick={() => setCurrentDay(Math.max(0, currentDay - 1))}>
                    Previous Day
                  </Button>
                  <Button className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"
                    disabled={currentDay === plan.dailyPlan.length - 1}
                    onClick={() => setCurrentDay(Math.min(plan.dailyPlan.length - 1, currentDay + 1))}>
                    Next Day <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Key Concepts */}
                {currentDay === 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        Key Concepts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.keyConcepts.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resources */}
                {currentDay === 0 && plan.resources.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Recommended Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {plan.resources.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Milestones */}
                {currentDay === 0 && plan.milestones.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Milestones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {plan.milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-bold text-amber-600 dark:text-amber-400">{i + 1}</div>
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <CalendarDays className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">AI Study Plan</h2>
          <p className="text-xs text-muted-foreground">Generate personalized study plans with AI</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Input Card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">What do you want to study?</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="e.g., Data Structures & Algorithms, Organic Chemistry..."
                  className="rounded-xl text-sm" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {topicSuggestions.map(s => (
                  <button key={s} onClick={() => setTopic(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-all">
                    {s}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Duration</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 days">3 Days (Crash Course)</SelectItem>
                      <SelectItem value="1 week">1 Week</SelectItem>
                      <SelectItem value="2 weeks">2 Weeks</SelectItem>
                      <SelectItem value="1 month">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Preferences (optional)</label>
                <Input value={preferences} onChange={(e) => setPreferences(e.target.value)}
                  placeholder="e.g., Focus on practice problems, include visual explanations..."
                  className="rounded-xl text-sm" />
              </div>
              <Button onClick={generatePlan} disabled={isLoading || !topic.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isLoading ? 'Generating Your Study Plan...' : 'Generate Study Plan'}
              </Button>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 animate-fade-in-up">
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-muted" />
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm font-medium">Creating your personalized study plan</p>
              <p className="text-xs text-muted-foreground mt-1">Analyzing topic and structuring your learning path...</p>
            </div>
          )}

          {/* Text Response (fallback) */}
          {textResponse && !isLoading && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Your Study Plan
                  </h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPlan(null); setTextResponse(''); }}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="markdown-content text-sm">
                  <ReactMarkdown>{textResponse}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !textResponse && !plan && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                <CardContent className="p-4">
                  <CalendarDays className="w-6 h-6 text-emerald-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Personalized Plans</h4>
                  <p className="text-xs text-muted-foreground">AI creates a detailed study schedule tailored to your timeline and learning style.</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardContent className="p-4">
                  <Target className="w-6 h-6 text-amber-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Daily Tasks</h4>
                  <p className="text-xs text-muted-foreground">Break down complex topics into daily actionable tasks with tips and focus areas.</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20">
                <CardContent className="p-4">
                  <ListChecks className="w-6 h-6 text-sky-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Track Progress</h4>
                  <p className="text-xs text-muted-foreground">Check off tasks as you complete them and see your overall plan progress.</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
                <CardContent className="p-4">
                  <Download className="w-6 h-6 text-rose-600 mb-2" />
                  <h4 className="font-semibold text-sm mb-1">Export to Markdown</h4>
                  <p className="text-xs text-muted-foreground">Download your study plan as a Markdown file for offline reference.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
