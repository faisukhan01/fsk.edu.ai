import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const where = { userId: session.userId, ...(type ? { type } : {}) };

    const sessions = await db.studySession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const totalMinutes = sessions.filter(s => s.completed).reduce((acc, s) => acc + s.duration, 0);
    return NextResponse.json({
      sessions,
      totalMinutes,
      totalSessions: sessions.filter(s => s.completed).length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch study sessions' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const where = { userId: session.userId, ...(type ? { type } : {}) };
    const result = await db.studySession.deleteMany({ where });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete study sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { type, duration, courseId } = await req.json();
    const studySession = await db.studySession.create({
      data: { userId: session.userId, type, duration, courseId, completed: true },
    });
    return NextResponse.json({ session: studySession });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save study session' }, { status: 500 });
  }
}
