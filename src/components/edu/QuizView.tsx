'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, CheckCircle2, XCircle, Loader2, Trophy, RotateCcw, ChevronRight, History, Clock, HelpCircle, FileText as FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/lib/store';
import type { QuizData } from '@/lib/store';

interface PastQuiz {
  id: string;
  title: string;
  score: number | null;
  totalQuestions: number;
  createdAt: string;
}

export function QuizView() {
  const { quiz, setQuiz } = useAppStore();
  const { topic, numQuestions, difficulty, currentQuiz, currentQIndex, selectedAnswer, showResult, isSubmitted } = quiz;

  const [isGenerating, setIsGenerating] = useState(false);
  const [quizHistory, setQuizHistory] = useState<PastQuiz[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/quiz')
      .then(r => r.json())
      .then(data => { if (data.quizzes) setQuizHistory(data.quizzes as PastQuiz[]); })
      .catch(() => {});
  }, []);

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), numQuestions: parseInt(numQuestions), difficulty })
      });
      const data = await res.json();
      if (data.error) {
        setGenerateError(data.error);
      } else if (data.questions) {
        const newQuiz: QuizData = { id: data.quizId, title: data.title, questions: data.questions, totalQuestions: data.questions.length };
        setQuiz({ currentQuiz: newQuiz, currentQIndex: 0, selectedAnswer: null, showResult: false, isSubmitted: false });
      } else {
        setGenerateError('Failed to generate quiz. Please try again.');
      }
    } catch {
      setGenerateError('Network error. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = () => {
    if (!selectedAnswer || !currentQuiz) return;
    const updated: QuizData = {
      ...currentQuiz,
      questions: currentQuiz.questions.map((q, i) =>
        i === currentQIndex ? { ...q, userAnswer: selectedAnswer, isCorrect: selectedAnswer === q.correctAnswer } : q
      ),
    };
    setQuiz({ currentQuiz: updated, isSubmitted: true });
  };

  const nextQuestion = () => {
    if (!currentQuiz) return;
    if (currentQIndex < currentQuiz.questions.length - 1) {
      setQuiz({ currentQIndex: currentQIndex + 1, selectedAnswer: null, isSubmitted: false });
    } else {
      const answers = currentQuiz.questions
        .filter(q => q.userAnswer)
        .map(q => ({ questionId: q.id, answer: q.userAnswer! }));
      fetch('/api/quiz', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: currentQuiz.id, answers })
      }).then(r => r.json()).then(data => {
        if (data.score !== undefined) {
          const updated: QuizData = { ...currentQuiz, score: data.score };
          setQuiz({ currentQuiz: updated });
          const pastEntry: PastQuiz = {
            id: updated.id,
            title: updated.title,
            score: data.score,
            totalQuestions: updated.totalQuestions,
            createdAt: new Date().toISOString(),
          };
          setQuizHistory(prev => [pastEntry, ...prev.filter(q => q.id !== pastEntry.id)]);
        }
      }).catch(() => {});
      setQuiz({ showResult: true });
    }
  };

  const retakeQuiz = () => {
    if (!currentQuiz) return;
    setQuiz({
      currentQuiz: { ...currentQuiz, questions: currentQuiz.questions.map(q => ({ ...q, userAnswer: undefined, isCorrect: undefined })), score: undefined },
      currentQIndex: 0,
      selectedAnswer: null,
      showResult: false,
      isSubmitted: false,
    });
  };

  const score = currentQuiz?.questions.filter(q => q.isCorrect).length || 0;
  const total = currentQuiz?.questions.length || 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const topicSuggestions = ['Data Structures', 'Organic Chemistry', 'Thermodynamics', 'Microeconomics', 'European History', 'Linear Algebra'];

  function getTimeAgo(dateString: string): string {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diff = Math.max(0, now - then);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  }

  function getScoreColor(score: number | null, total: number): string {
    if (score === null) return 'bg-muted text-muted-foreground';
    const pct = total > 0 ? (score / total) * 100 : 0;
    if (pct >= 70) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (pct >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
  }

  if (currentQuiz && showResult) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
            <Trophy className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Quiz Results</h2>
            <p className="text-xs text-muted-foreground">{currentQuiz.title}</p>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold ${percentage >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : percentage >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                  {percentage}%
                </div>
                <h3 className="text-xl font-bold mb-1">{score} / {total} Correct</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {percentage >= 80 ? 'Excellent work! 🎉' : percentage >= 60 ? 'Good effort! Keep studying 💪' : 'Keep practicing! You can do better 📚'}
                </p>
                <Progress value={percentage} className="h-2 mb-4" />
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={retakeQuiz} className="gap-2">
                    <RotateCcw className="w-4 h-4" /> Retake Quiz
                  </Button>
                  <Button onClick={() => setQuiz({ currentQuiz: null, showResult: false })} className="bg-rose-600 hover:bg-rose-700">
                    New Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>

            {currentQuiz.questions.map((q, i) => (
              <Card key={q.id} className={`border-0 shadow-sm ${q.isCorrect ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {q.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />}
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  <div className="ml-6 space-y-1">
                    <p className="text-xs text-muted-foreground">Your answer: <span className={q.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{q.userAnswer}</span></p>
                    {!q.isCorrect && <p className="text-xs text-muted-foreground">Correct: <span className="text-emerald-600">{q.correctAnswer}</span></p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (currentQuiz && !showResult) {
    const q = currentQuiz.questions[currentQIndex];
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">{currentQuiz.title}</h2>
              <p className="text-xs text-muted-foreground">Question {currentQIndex + 1} of {total}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">{Math.round(((currentQIndex) / total) * 100)}% complete</Badge>
        </div>
        <div className="px-4"><Progress value={(currentQIndex / total) * 100} className="h-1" /></div>
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="border-0 shadow-sm animate-fade-in-up">
              <CardContent className="p-5">
                <h3 className="text-base font-semibold mb-4">{q.question}</h3>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    let variant = 'outline' as const;
                    if (isSubmitted) {
                      if (opt === q.correctAnswer) variant = 'default';
                      else if (opt === selectedAnswer && opt !== q.correctAnswer) variant = 'destructive';
                    } else if (opt === selectedAnswer) {
                      variant = 'default';
                    }
                    return (
                      <button key={opt} onClick={() => !isSubmitted && setQuiz({ selectedAnswer: opt })}
                        className={`w-full text-left p-3 rounded-xl border text-sm transition-all duration-200 flex items-center gap-3 ${
                          isSubmitted && opt === q.correctAnswer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' :
                          isSubmitted && opt === selectedAnswer && opt !== q.correctAnswer ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' :
                          !isSubmitted && opt === selectedAnswer ? 'border-primary bg-primary/5 text-primary' :
                          'hover:bg-accent border-border'
                        }`}>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSubmitted && opt === q.correctAnswer ? 'border-emerald-500 bg-emerald-500 text-white' :
                          isSubmitted && opt === selectedAnswer ? 'border-rose-500 bg-rose-500 text-white' :
                          opt === selectedAnswer ? 'border-primary bg-primary text-primary-foreground' :
                          'border-muted-foreground/30'
                        }`}>
                          {opt === selectedAnswer || (isSubmitted && opt === q.correctAnswer) ? '✓' : ''}
                        </div>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {isSubmitted && (
              <Card className={`border-0 shadow-sm p-4 ${q.isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'} animate-fade-in-up`}>
                <p className={`text-sm font-medium ${q.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {q.isCorrect ? '✅ Correct! Great job!' : `❌ Incorrect. The correct answer is: ${q.correctAnswer}`}
                </p>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              {!isSubmitted ? (
                <Button onClick={submitAnswer} disabled={!selectedAnswer} className="bg-rose-600 hover:bg-rose-700 rounded-xl">
                  Submit Answer <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="bg-rose-600 hover:bg-rose-700 rounded-xl">
                  {currentQIndex < total - 1 ? 'Next Question' : 'See Results'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
          <Brain className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Quiz Generator</h2>
          <p className="text-xs text-muted-foreground">Test your knowledge with AI-generated quizzes</p>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Topic or Paste Your Content</label>
                  <span className="text-[11px] text-muted-foreground">{topic.length} chars</span>
                </div>
                <Textarea
                  value={topic}
                  onChange={(e) => setQuiz({ topic: e.target.value })}
                  placeholder="Enter a topic (e.g. Organic Chemistry) or paste a paragraph / notes you want to be quizzed on..."
                  className="rounded-xl resize-none min-h-[96px] text-sm"
                  rows={4}
                />
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <FileTextIcon className="w-3 h-3" />
                  You can paste lecture notes, a paragraph, or just type a subject name.
                </p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {topicSuggestions.map(t => (
                  <button key={t} onClick={() => setQuiz({ topic: t })} className="text-[11px] px-2.5 py-1 rounded-full border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-all">
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Number of Questions</label>
                  <Select value={numQuestions} onValueChange={(v) => setQuiz({ numQuestions: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Difficulty</label>
                  <Select value={difficulty} onValueChange={(v) => setQuiz({ difficulty: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={generateQuiz} disabled={isGenerating || !topic.trim()} className="w-full bg-rose-600 hover:bg-rose-700 rounded-xl">
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isGenerating ? 'Generating Quiz...' : 'Generate Quiz'}
              </Button>
              {generateError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 dark:text-rose-300">{generateError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz History Section */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                <History className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="font-semibold text-sm">Past Quizzes</h3>
            </div>
            {quizHistory.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No quizzes completed yet.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Generate your first quiz!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {quizHistory.map(q => {
                  const pct = q.score !== null && q.totalQuestions > 0 ? Math.round((q.score / q.totalQuestions) * 100) : null;
                  return (
                    <Card key={q.id} className="border-0 shadow-sm hover:bg-accent/50 transition-colors">
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{q.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{q.totalQuestions} questions</span>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {q.createdAt ? getTimeAgo(q.createdAt) : '—'}
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${getScoreColor(q.score, q.totalQuestions)}`}>
                          {q.score !== null ? `${q.score}/${q.totalQuestions}` : '—'}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
