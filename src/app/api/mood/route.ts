import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

const MOOD_SCORES: Record<string, number> = {
  great: 5, good: 4, okay: 3, bad: 2, terrible: 1,
};
const VALID_MOODS = ['great', 'good', 'okay', 'bad', 'terrible'];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const entries = await db.moodEntry.findMany({
      where: { userId: session.userId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
    });

    const moodDistribution: Record<string, number> = { great: 0, good: 0, okay: 0, bad: 0, terrible: 0 };
    let totalScore = 0, totalCount = 0, greatStudyMinutes = 0, greatDays = 0;

    for (const entry of entries) {
      const score = MOOD_SCORES[entry.mood] ?? 3;
      totalScore += score;
      totalCount++;
      moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
      if (entry.mood === 'great') { greatStudyMinutes += entry.studyMinutes; greatDays++; }
    }

    const averageMood = totalCount > 0 ? (totalScore / totalCount).toFixed(1) : '0';
    const avgStudyOnGreat = greatDays > 0 ? Math.round(greatStudyMinutes / greatDays) : 0;

    const entriesByDate = new Map<string, string>();
    for (const entry of entries) {
      const dateStr = toDateString(new Date(entry.createdAt));
      if (!entriesByDate.has(dateStr)) entriesByDate.set(dateStr, entry.mood);
    }

    let positiveStreak = 0;
    const checkDate = new Date(now);
    while (true) {
      const mood = entriesByDate.get(toDateString(checkDate));
      if (mood === 'good' || mood === 'great') { positiveStreak++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    }

    const trendData: { date: string; mood: string; score: number; hasEntry: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = toDateString(d);
      const mood = entriesByDate.get(dateStr);
      trendData.push({ date: dateStr, mood: mood || '', score: mood ? (MOOD_SCORES[mood] ?? 3) : 0, hasEntry: !!mood });
    }

    const rollingAverages: { date: string; avg: number }[] = [];
    for (let i = 0; i < trendData.length; i++) {
      if (i < 6) { rollingAverages.push({ date: trendData[i].date, avg: 0 }); }
      else {
        const window = trendData.slice(i - 6, i + 1).filter(d => d.hasEntry);
        const avg = window.length > 0 ? window.reduce((sum, d) => sum + d.score, 0) / window.length : 0;
        rollingAverages.push({ date: trendData[i].date, avg: Math.round(avg * 10) / 10 });
      }
    }

    let mostCommonMood = '', maxCount = 0;
    for (const [mood, count] of Object.entries(moodDistribution)) {
      if (count > maxCount) { maxCount = count; mostCommonMood = mood; }
    }

    return NextResponse.json({
      entries,
      summary: {
        averageMood, moodDistribution, positiveStreak, mostCommonMood,
        avgStudyOnGreat, totalEntries: entries.length,
        latestRollingAvg: rollingAverages[rollingAverages.length - 1]?.avg ?? 0,
      },
      trendData,
      rollingAverages,
    });
  } catch (error) {
    console.error('Mood API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch mood data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { mood, note, studyMinutes } = await req.json();
    if (!mood || !VALID_MOODS.includes(mood)) {
      return NextResponse.json({ error: 'Valid mood is required' }, { status: 400 });
    }

    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

    const existingEntry = await db.moodEntry.findFirst({
      where: { userId: session.userId, createdAt: { gte: startOfDay, lte: endOfDay } },
    });

    let entry;
    if (existingEntry) {
      entry = await db.moodEntry.update({
        where: { id: existingEntry.id },
        data: { mood, note: note || null, studyMinutes: parseInt(studyMinutes) || 0 },
      });
    } else {
      entry = await db.moodEntry.create({
        data: { userId: session.userId, mood, note: note || null, studyMinutes: parseInt(studyMinutes) || 0 },
      });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Mood API Error:', error);
    return NextResponse.json({ error: 'Failed to save mood entry' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, id } = await req.json();
    if (action !== 'delete' || !id) {
      return NextResponse.json({ error: 'Action "delete" and id are required' }, { status: 400 });
    }
    const existing = await db.moodEntry.findFirst({ where: { id, userId: session.userId } });
    if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });

    await db.moodEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mood API Error:', error);
    return NextResponse.json({ error: 'Failed to delete mood entry' }, { status: 500 });
  }
}
