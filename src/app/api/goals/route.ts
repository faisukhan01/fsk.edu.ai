import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const goals = await db.studyGoal.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Goals API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, id, title, description, targetMinutes, deadline, completedMinutes } = await req.json();

    if (action === 'create') {
      if (!title || !targetMinutes) {
        return NextResponse.json({ error: 'Title and target minutes are required' }, { status: 400 });
      }
      const goal = await db.studyGoal.create({
        data: {
          userId: session.userId,
          title,
          description: description || null,
          targetMinutes: parseInt(targetMinutes),
          deadline: deadline ? new Date(deadline) : null,
        },
      });
      return NextResponse.json({ goal });
    }

    if (action === 'update_progress') {
      if (!id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
      const existing = await db.studyGoal.findFirst({ where: { id, userId: session.userId } });
      if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      const newMinutes = Math.min((existing.completedMinutes || 0) + (completedMinutes || 0), existing.targetMinutes);
      const isCompleted = newMinutes >= existing.targetMinutes;
      const goal = await db.studyGoal.update({
        where: { id },
        data: { completedMinutes: newMinutes, isCompleted },
      });
      return NextResponse.json({ goal });
    }

    if (action === 'toggle_complete') {
      if (!id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
      const existing = await db.studyGoal.findFirst({ where: { id, userId: session.userId } });
      if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      const goal = await db.studyGoal.update({
        where: { id },
        data: {
          isCompleted: !existing.isCompleted,
          completedMinutes: !existing.isCompleted ? existing.targetMinutes : 0,
        },
      });
      return NextResponse.json({ goal });
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
      const existing = await db.studyGoal.findFirst({ where: { id, userId: session.userId } });
      if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      await db.studyGoal.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Goals API Error:', error);
    return NextResponse.json({ error: 'Failed to process goal' }, { status: 500 });
  }
}
