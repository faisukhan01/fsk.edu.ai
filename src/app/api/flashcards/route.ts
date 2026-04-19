import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const decks = await db.flashcardDeck.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { cards: true }
    });
    return NextResponse.json({ decks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch flashcard decks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, deckId, title, front, back } = await req.json();

    if (action === 'create_deck') {
      const deck = await db.flashcardDeck.create({
        data: { title, cards: front ? { create: [{ front, back }] } : undefined }
      });
      return NextResponse.json({ deck });
    }

    if (action === 'add_card' && deckId) {
      const card = await db.flashcard.create({
        data: { deckId, front, back }
      });
      return NextResponse.json({ card });
    }

    if (action === 'toggle_mastered') {
      const card = await db.flashcard.update({
        where: { id: deckId }, // deckId is actually cardId here
        data: { mastered: { toggle: true } } // This will set to opposite
      });
      return NextResponse.json({ card });
    }

    if (action === 'delete_deck' && deckId) {
      await db.flashcardDeck.delete({ where: { id: deckId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Flashcards API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
