import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function GET() {
  try {
    // Calculate the start of the current week (Monday 00:00)
    const now = new Date();
    const todayDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    // Calculate days since last Monday (0 if today is Monday)
    const daysSinceMonday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceMonday);
    weekStart.setHours(0, 0, 0, 0);

    // End of the week is Sunday 23:59:59
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    // Fetch all completed study sessions within this week
    const sessions = await db.studySession.findMany({
      where: {
        completed: true,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Initialize each day with 0 minutes
    const weekData = DAY_LABELS.map((day) => ({ day, minutes: 0 }));

    // Aggregate minutes by day of week
    let totalMinutes = 0;
    let todayMinutes = 0;
    const todayLabel = DAY_LABELS[now.getDay()];

    for (const session of sessions) {
      const sessionDay = session.createdAt.getDay(); // 0-6 (Sun-Sat)
      const minutes = session.duration || 0;
      weekData[sessionDay].minutes += minutes;
      totalMinutes += minutes;

      // Track today's minutes
      const sessionDate = new Date(session.createdAt);
      if (
        sessionDate.getDate() === now.getDate() &&
        sessionDate.getMonth() === now.getMonth() &&
        sessionDate.getFullYear() === now.getFullYear()
      ) {
        todayMinutes += minutes;
      }
    }

    // Reorder to start from Monday
    const orderedWeekData = [
      weekData[1], // Mon
      weekData[2], // Tue
      weekData[3], // Wed
      weekData[4], // Thu
      weekData[5], // Fri
      weekData[6], // Sat
      weekData[0], // Sun
    ];

    return NextResponse.json({
      weeklyData: orderedWeekData,
      totalMinutes,
      todayMinutes,
    });
  } catch (error) {
    console.error('Weekly Study API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly study data' },
      { status: 500 }
    );
  }
}
