import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decks = await db.flashcardDeck.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: 'desc' },
      include: { cards: true },
    });
    return NextResponse.json({ decks });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch flashcard decks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, deckId, title, front, back } = await req.json();

    if (action === 'create_deck') {
      const deck = await db.flashcardDeck.create({
        data: {
          userId: session.userId,
          title,
          cards: front ? { create: [{ front, back }] } : undefined,
        },
      });
      return NextResponse.json({ deck });
    }

    if (action === 'add_card' && deckId) {
      // Verify deck belongs to user
      const deck = await db.flashcardDeck.findFirst({ where: { id: deckId, userId: session.userId } });
      if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });

      const card = await db.flashcard.create({ data: { deckId, front, back } });
      return NextResponse.json({ card });
    }

    if (action === 'toggle_mastered') {
      // deckId is actually cardId here
      const card = await db.flashcard.findUnique({
        where: { id: deckId },
        include: { deck: true },
      });
      if (!card || card.deck.userId !== session.userId) {
        return NextResponse.json({ error: 'Card not found' }, { status: 404 });
      }
      const updated = await db.flashcard.update({
        where: { id: deckId },
        data: { mastered: !card.mastered },
      });
      return NextResponse.json({ card: updated });
    }

    if (action === 'delete_deck' && deckId) {
      const deck = await db.flashcardDeck.findFirst({ where: { id: deckId, userId: session.userId } });
      if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });

      await db.flashcardDeck.delete({ where: { id: deckId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Flashcards API Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
