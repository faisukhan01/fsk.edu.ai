import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
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
      db.note.count(),
      db.flashcardDeck.count(),
      db.course.count(),
      db.quiz.count(),
      db.studySession.count({ where: { completed: true } }),
      db.quiz.findMany({ where: { score: { not: null } } }),
      db.flashcard.count({ where: { mastered: true } }),
      db.studySession.findMany({ where: { completed: true } }),
    ]);

    const totalStudyMinutes = allSessions.reduce((acc, s) => acc + s.duration, 0);

    const avgQuizScore =
      quizzesWithScore.length > 0
        ? Math.round(
            quizzesWithScore.reduce((acc, q) => acc + (q.score ?? 0), 0) /
              quizzesWithScore.length
          )
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
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
