import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, question, solution, type } = await req.json();

    if (action === 'save' && question && solution) {
      const saved = await db.solvedProblem.create({
        data: {
          userId: session.userId,
          question: question.trim(),
          solution,
          type: type || 'math',
        },
      });
      return NextResponse.json({ success: true, id: saved.id });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Solved POST API Error:', error);
    return NextResponse.json({ error: 'Failed to save solved problem' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const problems = await db.solvedProblem.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({ problems });
  } catch {
    return NextResponse.json({ problems: [] });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, id } = await req.json();

    if (action === 'delete' && id) {
      const existing = await db.solvedProblem.findFirst({ where: { id, userId: session.userId } });
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      await db.solvedProblem.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Solved DELETE API Error:', error);
    return NextResponse.json({ error: 'Failed to delete solved problem' }, { status: 500 });
  }
}
