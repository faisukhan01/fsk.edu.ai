import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

interface Activity {
  id: string;
  type: 'quiz' | 'study' | 'note' | 'flashcard' | 'goal';
  title: string;
  subtitle: string;
  time: string;
  timeAgo: string;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffWeek === 1) return '1 week ago';
  if (diffWeek < 4) return `${diffWeek} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const uid = session.userId;

    const [sessions, quizzes, notes, decks, goals] = await Promise.all([
      db.studySession.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 20 }),
      db.quiz.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 20 }),
      db.note.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 20 }),
      db.flashcardDeck.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 20 }),
      db.studyGoal.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    const activities: Activity[] = [];

    for (const s of sessions) {
      if (!s.completed) continue;
      const typeLabel = s.type === 'pomodoro' ? 'Pomodoro' : 'Free Study';
      activities.push({
        id: `study-${s.id}`,
        type: 'study',
        title: `${typeLabel} Session`,
        subtitle: `${s.duration} minutes focused study`,
        time: s.createdAt.toISOString(),
        timeAgo: timeAgo(s.createdAt),
      });
    }

    for (const q of quizzes) {
      let subtitle = 'Created';
      if (q.score !== null && q.totalQuestions > 0) {
        const pct = Math.round((q.score / q.totalQuestions) * 100);
        subtitle = `Score: ${pct}% (${q.score}/${q.totalQuestions})`;
      }
      activities.push({
        id: `quiz-${q.id}`,
        type: 'quiz',
        title: q.title,
        subtitle,
        time: q.createdAt.toISOString(),
        timeAgo: timeAgo(q.createdAt),
      });
    }

    for (const n of notes) {
      const wasUpdated = n.updatedAt.getTime() - n.createdAt.getTime() > 1000;
      activities.push({
        id: `note-${n.id}`,
        type: 'note',
        title: n.title,
        subtitle: wasUpdated ? 'Updated note' : 'Created note',
        time: (wasUpdated ? n.updatedAt : n.createdAt).toISOString(),
        timeAgo: timeAgo(wasUpdated ? n.updatedAt : n.createdAt),
      });
    }

    for (const d of decks) {
      activities.push({
        id: `flashcard-${d.id}`,
        type: 'flashcard',
        title: d.title,
        subtitle: 'Created deck',
        time: d.createdAt.toISOString(),
        timeAgo: timeAgo(d.createdAt),
      });
    }

    for (const g of goals) {
      activities.push({
        id: `goal-${g.id}`,
        type: 'goal',
        title: g.title,
        subtitle: g.isCompleted ? 'Completed goal' : 'Created goal',
        time: g.createdAt.toISOString(),
        timeAgo: timeAgo(g.createdAt),
      });
    }

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Activity Feed API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
