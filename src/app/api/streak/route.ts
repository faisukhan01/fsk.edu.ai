import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const sessions = await db.studySession.findMany({
      where: {
        userId: session.userId,
        completed: true,
        createdAt: { gte: ninetyDaysAgo },
      },
      select: { duration: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const allSessions = await db.studySession.findMany({
      where: { userId: session.userId, completed: true },
      select: { duration: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const toDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const todayStr = toDateString(now);

    const heatmapMap = new Map<string, { minutes: number; sessions: number }>();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      heatmapMap.set(toDateString(d), { minutes: 0, sessions: 0 });
    }

    for (const s of sessions) {
      const dateStr = toDateString(new Date(s.createdAt));
      const existing = heatmapMap.get(dateStr);
      if (existing) {
        existing.minutes += s.duration;
        existing.sessions += 1;
      }
    }

    const heatmap = Array.from(heatmapMap.entries()).map(([date, data]) => ({
      date,
      minutes: data.minutes,
      sessions: data.sessions,
    }));

    const allDatesSet = new Set<string>();
    for (const s of allSessions) {
      allDatesSet.add(toDateString(new Date(s.createdAt)));
    }

    let currentStreak = 0;
    const checkDate = new Date(now);
    while (allDatesSet.has(toDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

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
        tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessions.filter(s => new Date(s.createdAt) >= startOfWeek).length;

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalActiveDays: allDatesSet.size,
      todayActive: allDatesSet.has(todayStr),
      heatmap,
      thisWeekSessions,
    });
  } catch (error) {
    console.error('Streak API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 });
  }
}
