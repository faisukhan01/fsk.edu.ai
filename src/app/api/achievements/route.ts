import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'db', 'achievements.json');

const DEFAULT_ACHIEVEMENTS = [
  { key: 'first_chat', title: 'First Conversation', description: 'Complete your first AI chat', icon: '💬', category: 'getting-started' },
  { key: 'quiz_master', title: 'Quiz Master', description: 'Complete 3 quizzes', icon: '🧠', category: 'knowledge' },
  { key: 'flashcard_creator', title: 'Card Architect', description: 'Create 3 flashcard decks', icon: '🃏', category: 'knowledge' },
  { key: 'note_taker', title: 'Note Taker', description: 'Create 5 notes', icon: '📝', category: 'knowledge' },
  { key: 'streak_3', title: '3-Day Streak', description: 'Study 3 days in a row', icon: '🔥', category: 'consistency' },
  { key: 'streak_7', title: 'Week Warrior', description: 'Study 7 days in a row', icon: '⚡', category: 'consistency' },
  { key: 'focus_5', title: 'Deep Focus', description: 'Complete 5 Pomodoro sessions', icon: '🎯', category: 'study-focus' },
  { key: 'focus_25', title: 'Focus Champion', description: 'Complete 25 Pomodoro sessions', icon: '🏆', category: 'study-focus' },
  { key: 'summarizer', title: 'Quick Learner', description: 'Create your first summary', icon: '📄', category: 'knowledge' },
  { key: 'solver', title: 'Problem Solver', description: 'Solve your first problem', icon: '🧮', category: 'knowledge' },
  { key: 'goal_setter', title: 'Goal Setter', description: 'Set your first study goal', icon: '🎯', category: 'study-focus' },
  { key: 'course_enrolled', title: 'Enrolled', description: 'Add your first course', icon: '🎓', category: 'getting-started' },
  { key: 'explorer', title: 'Explorer', description: 'Try all features (visit each view at least once)', icon: '🗺️', category: 'getting-started' },
  { key: 'mood_logger', title: 'Self-Aware', description: 'Log 5 mood entries', icon: '😊', category: 'consistency' },
];

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt: string | null;
}

async function ensureDataFile(): Promise<Achievement[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Initialize with defaults
    const initial = DEFAULT_ACHIEVEMENTS.map((a, i) => ({
      id: `ach_${i}`,
      key: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      unlockedAt: null,
    }));
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

async function saveData(data: Achievement[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const achievements = await ensureDataFile();
    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Achievements GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, action } = body as { key?: string; action?: string };

    if (action === 'check-progress') {
      return handleCheckProgress();
    }

    if (!key) {
      return NextResponse.json({ error: 'Achievement key is required' }, { status: 400 });
    }

    const achievements = await ensureDataFile();
    const idx = achievements.findIndex((a) => a.key === key);

    if (idx === -1) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    if (achievements[idx].unlockedAt) {
      return NextResponse.json({ achievement: achievements[idx], message: 'Already unlocked', alreadyUnlocked: true });
    }

    achievements[idx].unlockedAt = new Date().toISOString();
    await saveData(achievements);

    return NextResponse.json({ achievement: achievements[idx], message: 'Achievement unlocked!', newlyUnlocked: true });
  } catch (error) {
    console.error('Achievements POST error:', error);
    return NextResponse.json({ error: 'Failed to process achievement' }, { status: 500 });
  }
}

async function handleCheckProgress() {
  try {
    const newlyUnlocked: string[] = [];
    const achievements = await ensureDataFile();

    // Gather stats from existing API endpoints
    let chatSessions = 0, quizzes = 0, decks = 0, notes = 0, sessions = 0;
    let summaries = 0, problems = 0, goals = 0, courses = 0, moods = 0;

    try {
      const [cs, q, d, n, ss, su, p, g, c, m] = await Promise.all([
        fetch('http://localhost:3000/api/study-sessions').then(r => r.json()).catch(() => ({})),
        fetch('http://localhost:3000/api/quiz').then(r => r.json()).catch(() => ({ quizzes: [] })),
        fetch('http://localhost:3000/api/flashcards').then(r => r.json()).catch(() => ({ decks: [] })),
        fetch('http://localhost:3000/api/notes').then(r => r.json()).catch(() => ({ notes: [] })),
        fetch('http://localhost:3000/api/statistics').then(r => r.json()).catch(() => ({})),
        fetch('http://localhost:3000/api/summaries').then(r => r.json()).catch(() => ({ summaries: [] })),
        fetch('http://localhost:3000/api/solved').then(r => r.json()).catch(() => ({ problems: [] })),
        fetch('http://localhost:3000/api/goals').then(r => r.json()).catch(() => ({ goals: [] })),
        fetch('http://localhost:3000/api/courses').then(r => r.json()).catch(() => ({ courses: [] })),
        fetch('http://localhost:3000/api/mood').then(r => r.json()).catch(() => ({ moods: [] })),
      ]);
      chatSessions = cs.totalSessions || Array.isArray(cs.sessions) ? cs.sessions.length : 0;
      quizzes = Array.isArray(q.quizzes) ? q.quizzes.length : (q.totalQuizzes || 0);
      decks = Array.isArray(d.decks) ? d.decks.length : (d.totalFlashcardDecks || 0);
      notes = Array.isArray(n.notes) ? n.notes.length : (n.totalNotes || 0);
      sessions = cs.totalSessions || 0;
      summaries = Array.isArray(su.summaries) ? su.summaries.length : (su.totalSummaries || 0);
      problems = Array.isArray(p.problems) ? p.problems.length : (p.totalSolved || 0);
      goals = Array.isArray(g.goals) ? g.goals.length : (g.totalGoals || 0);
      courses = Array.isArray(c.courses) ? c.courses.length : (c.totalCourses || 0);
      moods = Array.isArray(m.moods) ? m.moods.length : (m.totalMoods || 0);
    } catch (e) {
      console.error('Failed to gather stats:', e);
    }

    // Simple streak calculation from study sessions
    let streak = 0;
    try {
      const streakResp = await fetch('http://localhost:3000/api/streak').then(r => r.json()).catch(() => ({}));
      streak = streakResp.longestStreak || streakResp.currentStreak || 0;
    } catch {}

    const conditions: Record<string, boolean> = {
      first_chat: chatSessions >= 1,
      quiz_master: quizzes >= 3,
      flashcard_creator: decks >= 3,
      note_taker: notes >= 5,
      streak_3: streak >= 3,
      streak_7: streak >= 7,
      focus_5: sessions >= 5,
      focus_25: sessions >= 25,
      summarizer: summaries >= 1,
      solver: problems >= 1,
      goal_setter: goals >= 1,
      course_enrolled: courses >= 1,
      mood_logger: moods >= 5,
    };

    for (const [key, met] of Object.entries(conditions)) {
      if (met) {
        const idx = achievements.findIndex((a) => a.key === key);
        if (idx !== -1 && !achievements[idx].unlockedAt) {
          achievements[idx].unlockedAt = new Date().toISOString();
          newlyUnlocked.push(key);
        }
      }
    }

    await saveData(achievements);

    return NextResponse.json({ achievements, newlyUnlocked });
  } catch (error) {
    console.error('Check progress error:', error);
    return NextResponse.json({ error: 'Failed to check progress' }, { status: 500 });
  }
}
