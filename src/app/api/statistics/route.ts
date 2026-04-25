import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const uid = session.userId;

    const [
      totalNotes,
      totalDecks,
      totalCourses,
      totalQuizzes,
      totalSessions,
      quizzesWithScore,
      masteredFlashcards,
      allSessions,
    ] = await Promise.all([
      db.note.count({ where: { userId: uid } }),
      db.flashcardDeck.count({ where: { userId: uid } }),
      db.course.count({ where: { userId: uid } }),
      db.quiz.count({ where: { userId: uid } }),
      db.studySession.count({ where: { userId: uid, completed: true } }),
      db.quiz.findMany({ where: { userId: uid, score: { not: null } } }),
      db.flashcard.count({ where: { deck: { userId: uid }, mastered: true } }),
      db.studySession.findMany({ where: { userId: uid, completed: true } }),
    ]);

    const totalStudyMinutes = allSessions.reduce((acc, s) => acc + s.duration, 0);
    const avgQuizScore =
      quizzesWithScore.length > 0
        ? Math.round(quizzesWithScore.reduce((acc, q) => acc + (q.score ?? 0), 0) / quizzesWithScore.length)
        : 0;

    return NextResponse.json({
      totalNotes,
      totalFlashcardDecks: totalDecks,
      totalCourses,
      totalQuizzes,
      totalStudySessions: totalSessions,
      avgQuizScore,
      totalFlashcardsMastered: masteredFlashcards,
      totalStudyMinutes,
      totalStudyHours: Math.round(totalStudyMinutes / 60),
    });
  } catch (error) {
    console.error('Statistics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
