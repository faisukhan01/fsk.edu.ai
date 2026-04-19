import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Fresh PrismaClient to avoid Turbopack caching with new models
const db = new PrismaClient();

const MOOD_SCORES: Record<string, number> = {
  great: 5,
  good: 4,
  okay: 3,
  bad: 2,
  terrible: 1,
};

const VALID_MOODS = ['great', 'good', 'okay', 'bad', 'terrible'];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const entries = await db.moodEntry.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary stats
    const moodDistribution: Record<string, number> = {
      great: 0,
      good: 0,
      okay: 0,
      bad: 0,
      terrible: 0,
    };

    let totalScore = 0;
    let totalCount = 0;
    let greatStudyMinutes = 0;
    let greatDays = 0;

    for (const entry of entries) {
      const score = MOOD_SCORES[entry.mood] ?? 3;
      totalScore += score;
      totalCount++;
      moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;

      if (entry.mood === 'great') {
        greatStudyMinutes += entry.studyMinutes;
        greatDays++;
      }
    }

    const averageMood = totalCount > 0 ? (totalScore / totalCount).toFixed(1) : '0';
    const avgStudyOnGreat = greatDays > 0 ? Math.round(greatStudyMinutes / greatDays) : 0;

    // Calculate streak of positive days (good or great) going backwards from today
    const todayStr = toDateString(now);
    const entriesByDate = new Map<string, string>();

    for (const entry of entries) {
      const dateStr = toDateString(new Date(entry.createdAt));
      if (!entriesByDate.has(dateStr)) {
        entriesByDate.set(dateStr, entry.mood);
      }
    }

    let positiveStreak = 0;
    const checkDate = new Date(now);

    while (true) {
      const dateStr = toDateString(checkDate);
      const mood = entriesByDate.get(dateStr);
      if (mood === 'good' || mood === 'great') {
        positiveStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Build 30-day trend data (chronological order for chart)
    const trendData: { date: string; mood: string; score: number; hasEntry: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = toDateString(d);
      const mood = entriesByDate.get(dateStr);
      trendData.push({
        date: dateStr,
        mood: mood || '',
        score: mood ? (MOOD_SCORES[mood] ?? 3) : 0,
        hasEntry: !!mood,
      });
    }

    // Calculate 7-day rolling averages
    const rollingAverages: { date: string; avg: number }[] = [];
    for (let i = 0; i < trendData.length; i++) {
      if (i < 6) {
        rollingAverages.push({ date: trendData[i].date, avg: 0 });
      } else {
        const window = trendData.slice(i - 6, i + 1).filter((d) => d.hasEntry);
        const avg = window.length > 0
          ? window.reduce((sum, d) => sum + d.score, 0) / window.length
          : 0;
        rollingAverages.push({ date: trendData[i].date, avg: Math.round(avg * 10) / 10 });
      }
    }

    const latestRollingAvg = rollingAverages.length > 0 ? rollingAverages[rollingAverages.length - 1].avg : 0;

    // Most common mood
    let mostCommonMood = '';
    let maxCount = 0;
    for (const [mood, count] of Object.entries(moodDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMood = mood;
      }
    }

    return NextResponse.json({
      entries,
      summary: {
        averageMood,
        moodDistribution,
        positiveStreak,
        mostCommonMood,
        avgStudyOnGreat,
        totalEntries: entries.length,
        latestRollingAvg,
      },
      trendData,
      rollingAverages,
    });
  } catch (error) {
    console.error('Mood API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mood, note, studyMinutes } = await req.json();

    if (!mood || !VALID_MOODS.includes(mood)) {
      return NextResponse.json(
        { error: 'Valid mood is required (great, good, okay, bad, terrible)' },
        { status: 400 }
      );
    }

    // Check if there's already an entry for today
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const existingEntry = await db.moodEntry.findFirst({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    let entry;
    if (existingEntry) {
      // Update today's entry
      entry = await db.moodEntry.update({
        where: { id: existingEntry.id },
        data: {
          mood,
          note: note || null,
          studyMinutes: parseInt(studyMinutes) || 0,
        },
      });
    } else {
      // Create new entry
      entry = await db.moodEntry.create({
        data: {
          mood,
          note: note || null,
          studyMinutes: parseInt(studyMinutes) || 0,
        },
      });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Mood API Error:', error);
    return NextResponse.json(
      { error: 'Failed to save mood entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { action, id } = await req.json();

    if (action !== 'delete' || !id) {
      return NextResponse.json({ error: 'Action "delete" and id are required' }, { status: 400 });
    }

    await db.moodEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mood API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete mood entry' },
      { status: 500 }
    );
  }
}
