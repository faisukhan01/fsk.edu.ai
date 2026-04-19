import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const notes = await db.note.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, color, courseId } = await req.json();
    const note = await db.note.create({
      data: { title: title || 'Untitled Note', content: content || '', color: color || '#ffffff', courseId }
    });
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, title, content, color, isPinned } = await req.json();
    const note = await db.note.update({
      where: { id },
      data: { ...(title !== undefined && { title }), ...(content !== undefined && { content }), ...(color !== undefined && { color }), ...(isPinned !== undefined && { isPinned }) }
    });
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    
    await db.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
