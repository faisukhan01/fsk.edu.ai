import { create } from 'zustand';

export type View = 'dashboard' | 'chat' | 'quiz' | 'flashcards' | 'notes' | 'pomodoro' | 'websearch' | 'courses' | 'statistics' | 'explain' | 'goals' | 'studyplan' | 'summarizer' | 'streak' | 'mood' | 'solver' | 'achievements' | 'settings';

export type NotificationType = 'achievement' | 'goal' | 'study' | 'reminder';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  timestamp?: string;
  images?: string[];
  mode?: 'chat' | 'vision' | 'websearch';
  reactions?: 'up' | 'down' | null;
}

// ── Explainer ──────────────────────────────────────────────────────────────
export type ExplainType = 'formula' | 'concept' | 'proof' | 'example';
export interface ExplainerState {
  topic: string;
  selectedType: ExplainType;
  result: string;
}

// ── Solver ─────────────────────────────────────────────────────────────────
export type SolverProblemType = 'math' | 'code' | 'general';
export interface SolverState {
  question: string;
  selectedType: SolverProblemType;
  solution: string;
  solutionType: SolverProblemType;
  error: string;
}

// ── Summarizer ─────────────────────────────────────────────────────────────
export type SummaryStyle = 'brief' | 'detailed' | 'bullet-points' | 'eli5';
export interface SummarizerState {
  text: string;
  selectedStyle: SummaryStyle;
  summary: string;
  originalWordCount: number;
  summaryWordCount: number;
  reduction: number;
}

// ── Quiz ───────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}
export interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
  score?: number | null;
  totalQuestions: number;
}
export interface QuizState {
  topic: string;
  numQuestions: string;
  difficulty: string;
  currentQuiz: QuizData | null;
  currentQIndex: number;
  selectedAnswer: string | null;
  showResult: boolean;
  isSubmitted: boolean;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
}

interface AppState {
  currentView: View;
  setCurrentView: (view: View) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  selectedCourse: string | null;
  setSelectedCourse: (courseId: string | null) => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  // Persistent chat state (AI Teacher)
  chatMessages: ChatMessage[];
  setChatMessages: (msgs: ChatMessage[]) => void;
  chatConversationId: string | null;
  setChatConversationId: (id: string | null) => void;
  // Persistent AI Explainer state
  explainer: ExplainerState;
  setExplainer: (state: Partial<ExplainerState>) => void;
  // Persistent AI Solver state
  solver: SolverState;
  setSolver: (state: Partial<SolverState>) => void;
  // Persistent Summarizer state
  summarizer: SummarizerState;
  setSummarizer: (state: Partial<SummarizerState>) => void;
  // Persistent Quiz state
  quiz: QuizState;
  setQuiz: (state: Partial<QuizState>) => void;
  toasts: Array<{ id: string; title: string; description?: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number }>;
  addToast: (toast: Omit<AppState['toasts'][number], 'id'>) => void;
  removeToast: (id: string) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  isRecording: false,
  setIsRecording: (recording) => set({ isRecording: recording }),
  selectedCourse: null,
  setSelectedCourse: (courseId) => set({ selectedCourse: courseId }),
  showHelp: false,
  setShowHelp: (show) => set({ showHelp: show }),
  chatMessages: [],
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  chatConversationId: null,
  setChatConversationId: (id) => set({ chatConversationId: id }),
  // AI Explainer
  explainer: { topic: '', selectedType: 'formula', result: '' },
  setExplainer: (partial) => set((s) => ({ explainer: { ...s.explainer, ...partial } })),
  // AI Solver
  solver: { question: '', selectedType: 'math', solution: '', solutionType: 'math', error: '' },
  setSolver: (partial) => set((s) => ({ solver: { ...s.solver, ...partial } })),
  // Summarizer
  summarizer: { text: '', selectedStyle: 'brief', summary: '', originalWordCount: 0, summaryWordCount: 0, reduction: 0 },
  setSummarizer: (partial) => set((s) => ({ summarizer: { ...s.summarizer, ...partial } })),
  // Quiz
  quiz: { topic: '', numQuestions: '5', difficulty: 'medium', currentQuiz: null, currentQIndex: 0, selectedAnswer: null, showResult: false, isSubmitted: false },
  setQuiz: (partial) => set((s) => ({ quiz: { ...s.quiz, ...partial } })),
  toasts: [],
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, { ...toast, id: crypto.randomUUID(), duration: toast.duration || 4000 }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  notifications: [
    {
      id: 'n1',
      type: 'achievement',
      title: 'First Steps',
      description: 'Complete your first quiz to unlock your first achievement',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'n2',
      type: 'study',
      title: 'Study Streak',
      description: 'Start studying today to maintain your streak!',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'n3',
      type: 'goal',
      title: 'Set a Goal',
      description: 'Create your first study goal to track your progress',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...state.notifications,
    ],
  })),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
  markRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
}));
