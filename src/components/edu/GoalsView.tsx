'use client';

import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Circle, Clock, Flame, Loader2, Calendar, ChevronDown, ChevronUp, TrendingUp, Award, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetMinutes: number;
  completedMinutes: number;
  deadline: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTarget, setFormTarget] = useState('60');
  const [formDeadline, setFormDeadline] = useState('');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [addingProgress, setAddingProgress] = useState<string | null>(null);

  const loadGoals = () => {
    fetch('/api/goals').then(r => r.json()).then(data => { if (data.goals) setGoals(data.goals); }).catch(() => {});
  };

  useEffect(() => { loadGoals(); }, []);

  const createGoal = async () => {
    if (!formTitle.trim() || !formTarget) return;
    await fetch('/api/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', title: formTitle.trim(), description: formDesc.trim(), targetMinutes: formTarget, deadline: formDeadline || null })
    });
    setFormTitle(''); setFormDesc(''); setFormTarget('60'); setFormDeadline('');
    setShowNewGoal(false); loadGoals();
  };

  const toggleComplete = async (id: string) => {
    await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_complete', id }) });
    loadGoals();
  };

  const addProgress = async (id: string, minutes: number) => {
    setAddingProgress(id);
    await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_progress', id, completedMinutes: minutes }) });
    loadGoals();
    setAddingProgress(null);
  };

  const deleteGoal = async (id: string) => {
    await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) });
    setExpandedGoal(null);
    loadGoals();
  };

  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);
  const totalTarget = activeGoals.reduce((s, g) => s + g.targetMinutes, 0);
  const totalCompleted = activeGoals.reduce((s, g) => s + g.completedMinutes, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  const getMotivationMessage = () => {
    if (overallProgress >= 80) return { text: 'Almost there! Keep pushing! 🔥', color: 'text-emerald-500' };
    if (overallProgress >= 50) return { text: 'Great progress! Halfway through! 💪', color: 'text-amber-500' };
    if (overallProgress > 0) return { text: 'Good start! Keep the momentum! 🚀', color: 'text-sky-500' };
    return { text: 'Set your first study goal to get started!', color: 'text-muted-foreground' };
  };

  const motivation = getMotivationMessage();
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const getDaysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Target className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Study Goals</h2>
            <p className="text-xs text-muted-foreground">{activeGoals.length} active · {completedGoals.length} completed</p>
          </div>
        </div>
        <Dialog open={showNewGoal} onOpenChange={setShowNewGoal}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Goal Title</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g., Master Linear Algebra" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Description (optional)</Label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="What do you want to achieve?" className="rounded-xl mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Target (minutes)</Label>
                  <Input type="number" value={formTarget} onChange={(e) => setFormTarget(e.target.value)} placeholder="60" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Deadline (optional)</Label>
                  <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} className="rounded-xl mt-1" />
                </div>
              </div>
              <Button onClick={createGoal} disabled={!formTitle.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Overall Progress Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Overall Progress
                  </h3>
                  <p className={`text-sm mt-1 ${motivation.color}`}>{motivation.text}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
                  <p className="text-xs text-muted-foreground">{totalCompleted}/{totalTarget} min</p>
                </div>
              </div>
              <Progress value={overallProgress} className="h-2.5" />
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>{activeGoals.length} active goals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{completedGoals.length} goals achieved</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" /> Active Goals
              </h3>
              <div className="space-y-2">
                {activeGoals.map(goal => {
                  const progress = Math.round((goal.completedMinutes / goal.targetMinutes) * 100);
                  const daysLeft = getDaysLeft(goal.deadline);
                  const isExpanded = expandedGoal === goal.id;
                  return (
                    <Card key={goal.id} className="border-0 shadow-sm overflow-hidden">
                      <div className={`h-0.5 bg-emerald-500`} style={{ width: `${progress}%` }} />
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleComplete(goal.id)} className="mt-0.5 shrink-0">
                            <Circle className={`w-5 h-5 transition-colors ${progress > 0 ? 'text-emerald-500 fill-emerald-100 dark:fill-emerald-900/40' : 'text-muted-foreground/40'}`} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">{goal.title}</h4>
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                {goal.deadline && daysLeft !== null && (
                                  <Badge variant="outline" className={`text-[10px] ${daysLeft <= 2 ? 'border-rose-300 text-rose-600 dark:text-rose-400' : daysLeft <= 7 ? 'border-amber-300 text-amber-600 dark:text-amber-400' : ''}`}>
                                    <Calendar className="w-2.5 h-2.5 mr-1" />
                                    {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                                  </Badge>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </div>
                            {goal.description && <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>}
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">{goal.completedMinutes} / {goal.targetMinutes} min</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-3 animate-fade-in-up">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">Add progress:</span>
                              {[5, 15, 30, 60].map(min => (
                                <Button key={min} size="sm" variant="outline" className="h-7 px-2.5 text-xs rounded-lg"
                                  disabled={addingProgress === goal.id || goal.completedMinutes + min > goal.targetMinutes}
                                  onClick={() => addProgress(goal.id, min)}>
                                  {addingProgress === goal.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  +{min}m
                                </Button>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                Created: {formatDate(goal.createdAt)}
                              </div>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => deleteGoal(goal.id)}>
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed ({completedGoals.length})
              </h3>
              <div className="space-y-2">
                {completedGoals.map(goal => (
                  <Card key={goal.id} className="border-0 shadow-sm bg-emerald-50/50 dark:bg-emerald-950/10">
                    <CardContent className="p-3 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate line-through text-muted-foreground">{goal.title}</p>
                        <p className="text-[10px] text-muted-foreground">{goal.targetMinutes} min goal</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 sm:opacity-0 sm:hover:opacity-100" onClick={() => deleteGoal(goal.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {goals.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-semibold mb-1">No Study Goals Yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Set study goals to stay on track. Break down your learning into manageable targets and track your progress!
                </p>
                <Button onClick={() => setShowNewGoal(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
                  <Sparkles className="w-4 h-4" /> Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
