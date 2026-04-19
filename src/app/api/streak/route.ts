import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Calculate the date 90 days ago
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    // Fetch all completed study sessions from the last 90 days
    const sessions = await db.studySession.findMany({
      where: {
        completed: true,
        createdAt: {
          gte: ninetyDaysAgo,
        },
      },
      select: {
        duration: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Also fetch all sessions for longest streak calculation
    const allSessions = await db.studySession.findMany({
      where: { completed: true },
      select: {
        duration: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Helper: format date to YYYY-MM-DD string
    const toDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const todayStr = toDateString(now);

    // Build heatmap data for last 90 days
    const heatmapMap = new Map<string, { minutes: number; sessions: number }>();

    // Initialize all 90 days
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = toDateString(d);
      heatmapMap.set(dateStr, { minutes: 0, sessions: 0 });
    }

    // Aggregate sessions by date
    for (const session of sessions) {
      const dateStr = toDateString(new Date(session.createdAt));
      const existing = heatmapMap.get(dateStr);
      if (existing) {
        existing.minutes += session.duration;
        existing.sessions += 1;
      }
    }

    // Convert map to array
    const heatmap = Array.from(heatmapMap.entries()).map(([date, data]) => ({
      date,
      minutes: data.minutes,
      sessions: data.sessions,
    }));

    // Build date set for streak calculation from all sessions
    const allDatesSet = new Set<string>();
    for (const session of allSessions) {
      const dateStr = toDateString(new Date(session.createdAt));
      allDatesSet.add(dateStr);
    }

    // Calculate current streak: consecutive days from today backwards
    let currentStreak = 0;
    const checkDate = new Date(now);
    // If today has no activity, start checking from yesterday
    while (allDatesSet.has(toDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak from all data
    const allDatesSorted = Array.from(allDatesSet).sort();
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < allDatesSorted.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(allDatesSorted[i - 1]);
        const curr = new Date(allDatesSorted[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Count total active days
    const totalActiveDays = allDatesSet.size;

    // Check if today is active
    const todayActive = allDatesSet.has(todayStr);

    // Count this week's sessions
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessions.filter((s) => new Date(s.createdAt) >= startOfWeek).length;

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalActiveDays,
      todayActive,
      heatmap,
      thisWeekSessions,
    });
  } catch (error) {
    console.error('Streak API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 }
    );
  }
}
