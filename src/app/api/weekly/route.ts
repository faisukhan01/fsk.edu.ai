import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const todayDayOfWeek = now.getDay();
    const daysSinceMonday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const sessions = await db.studySession.findMany({
      where: {
        userId: session.userId,
        completed: true,
        createdAt: { gte: weekStart, lt: weekEnd },
      },
      orderBy: { createdAt: 'asc' },
    });

    const weekData = DAY_LABELS.map(day => ({ day, minutes: 0 }));
    let totalMinutes = 0;
    let todayMinutes = 0;

    for (const s of sessions) {
      const sessionDay = s.createdAt.getDay();
      const minutes = s.duration || 0;
      weekData[sessionDay].minutes += minutes;
      totalMinutes += minutes;

      const sessionDate = new Date(s.createdAt);
      if (
        sessionDate.getDate() === now.getDate() &&
        sessionDate.getMonth() === now.getMonth() &&
        sessionDate.getFullYear() === now.getFullYear()
      ) {
        todayMinutes += minutes;
      }
    }

    const orderedWeekData = [
      weekData[1], weekData[2], weekData[3], weekData[4],
      weekData[5], weekData[6], weekData[0],
    ];

    return NextResponse.json({ weeklyData: orderedWeekData, totalMinutes, todayMinutes });
  } catch (error) {
    console.error('Weekly Study API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly study data' }, { status: 500 });
  }
}
