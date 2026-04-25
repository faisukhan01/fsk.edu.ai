import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const notes = await db.note.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, content, color, courseId } = await req.json();
    const note = await db.note.create({
      data: {
        userId: session.userId,
        title: title || 'Untitled Note',
        content: content || '',
        color: color || '#ffffff',
        courseId,
      },
    });
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, title, content, color, isPinned } = await req.json();
    // Ensure the note belongs to this user
    const existing = await db.note.findFirst({ where: { id, userId: session.userId } });
    if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    const note = await db.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(color !== undefined && { color }),
        ...(isPinned !== undefined && { isPinned }),
      },
    });
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Note ID required' }, { status: 400 });

    const existing = await db.note.findFirst({ where: { id, userId: session.userId } });
    if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

    await db.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
