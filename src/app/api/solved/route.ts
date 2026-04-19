import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { action, question, solution, type } = await req.json();
    const db = new PrismaClient();

    if (action === 'save' && question && solution) {
      const saved = await db.solvedProblem.create({
        data: {
          question: question.trim(),
          solution,
          type: type || 'math',
        },
      });
      await db.$disconnect();
      return NextResponse.json({ success: true, id: saved.id });
    }
    await db.$disconnect();
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Solved POST API Error:', error);
    return NextResponse.json(
      { error: 'Failed to save solved problem' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Create fresh client to ensure model is available after schema changes
    const db = new PrismaClient();
    const problems = await db.solvedProblem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    await db.$disconnect();
    return NextResponse.json({ problems });
  } catch {
    // Return empty array if model not yet available (Turbopack cache)
    return NextResponse.json({ problems: [] });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { action, id } = await req.json();
    const db = new PrismaClient();

    if (action === 'delete' && id) {
      await db.solvedProblem.delete({ where: { id } });
      await db.$disconnect();
      return NextResponse.json({ success: true });
    }
    await db.$disconnect();
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Solved DELETE API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete solved problem' },
      { status: 500 }
    );
  }
}
