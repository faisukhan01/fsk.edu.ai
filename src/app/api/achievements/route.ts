import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

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
  { key: 'explorer', title: 'Explorer', description: 'Try all features', icon: '🗺️', category: 'getting-started' },
  { key: 'mood_logger', title: 'Self-Aware', description: 'Log 5 mood entries', icon: '😊', category: 'consistency' },
];

async function ensureUserAchievements(userId: string) {
  const existing = await db.achievement.findMany({ where: { userId } });
  const existingKeys = new Set(existing.map(a => a.key));

  const missing = DEFAULT_ACHIEVEMENTS.filter(a => !existingKeys.has(a.key));
  if (missing.length > 0) {
    await db.achievement.createMany({
      data: missing.map(a => ({
        userId,
        key: a.key,
        title: a.title,
        description: a.description,
        icon: a.icon,
        category: a.category,
        unlockedAt: null,
      })),
    });
  }

  return db.achievement.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const achievements = await ensureUserAchievements(session.userId);
    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Achievements GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { key, action } = body as { key?: string; action?: string };

    if (action === 'check-progress') {
      return handleCheckProgress(session.userId);
    }

    if (!key) {
      return NextResponse.json({ error: 'Achievement key is required' }, { status: 400 });
    }

    const achievements = await ensureUserAchievements(session.userId);
    const achievement = achievements.find(a => a.key === key);

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    if (achievement.unlockedAt) {
      return NextResponse.json({ achievement, message: 'Already unlocked', alreadyUnlocked: true });
    }

    const updated = await db.achievement.update({
      where: { id: achievement.id },
      data: { unlockedAt: new Date() },
    });

    return NextResponse.json({ achievement: updated, message: 'Achievement unlocked!', newlyUnlocked: true });
  } catch (error) {
    console.error('Achievements POST error:', error);
    return NextResponse.json({ error: 'Failed to process achievement' }, { status: 500 });
  }
}

async function handleCheckProgress(userId: string) {
  try {
    const achievements = await ensureUserAchievements(userId);
    const newlyUnlocked: string[] = [];

    const [quizzes, decks, notes, sessions, summaries, problems, goals, courses, moods, streak] = await Promise.all([
      db.quiz.count({ where: { userId } }),
      db.flashcardDeck.count({ where: { userId } }),
      db.note.count({ where: { userId } }),
      db.studySession.count({ where: { userId, completed: true } }),
      db.summary.count({ where: { userId } }),
      db.solvedProblem.count({ where: { userId } }),
      db.studyGoal.count({ where: { userId } }),
      db.course.count({ where: { userId } }),
      db.moodEntry.count({ where: { userId } }),
      // Calculate current streak
      db.studySession.findMany({ where: { userId, completed: true }, select: { createdAt: true }, orderBy: { createdAt: 'asc' } }),
    ]);

    // Calculate streak from sessions
    const toDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const allDatesSet = new Set(streak.map(s => toDateString(new Date(s.createdAt))));
    let currentStreak = 0;
    const checkDate = new Date();
    while (allDatesSet.has(toDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const conditions: Record<string, boolean> = {
      first_chat: sessions >= 1,
      quiz_master: quizzes >= 3,
      flashcard_creator: decks >= 3,
      note_taker: notes >= 5,
      streak_3: currentStreak >= 3,
      streak_7: currentStreak >= 7,
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
        const ach = achievements.find(a => a.key === key);
        if (ach && !ach.unlockedAt) {
          await db.achievement.update({ where: { id: ach.id }, data: { unlockedAt: new Date() } });
          newlyUnlocked.push(key);
        }
      }
    }

    const updated = await db.achievement.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ achievements: updated, newlyUnlocked });
  } catch (error) {
    console.error('Check progress error:', error);
    return NextResponse.json({ error: 'Failed to check progress' }, { status: 500 });
  }
}
