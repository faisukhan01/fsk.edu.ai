import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const summaries = await db.summary.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({ summaries });
  } catch {
    return NextResponse.json({ summaries: [] });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, id } = await req.json();

    if (action === 'delete' && id) {
      const existing = await db.summary.findFirst({ where: { id, userId: session.userId } });
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      await db.summary.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Summaries DELETE API Error:', error);
    return NextResponse.json({ error: 'Failed to delete summary' }, { status: 500 });
  }
}
