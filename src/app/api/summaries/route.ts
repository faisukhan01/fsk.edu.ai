import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    // Create fresh client to ensure model is available after schema changes
    const db = new PrismaClient();
    const summaries = await db.summary.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    await db.$disconnect();
    return NextResponse.json({ summaries });
  } catch (error) {
    // Return empty array if model not yet available (Turbopack cache)
    return NextResponse.json({ summaries: [] });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { action, id } = await req.json();
    const db = new PrismaClient();

    if (action === 'delete' && id) {
      await db.summary.delete({ where: { id } });
      await db.$disconnect();
      return NextResponse.json({ success: true });
    }
    await db.$disconnect();
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Summaries DELETE API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete summary' },
      { status: 500 }
    );
  }
}
