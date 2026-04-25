import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

// Chat history is stored in-memory per user via a simple JSON file approach,
// but now keyed by userId so each user only sees their own conversations.
import { promises as fs } from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'db', 'chat-history');

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

function getUserDBPath(userId: string): string {
  return path.join(DB_DIR, `${userId}.json`);
}

async function readUserDB(userId: string): Promise<ChatConversation[]> {
  try {
    const data = await fs.readFile(getUserDBPath(userId), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUserDB(userId: string, data: ChatConversation[]): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(getUserDBPath(userId), JSON.stringify(data, null, 2));
}

// GET: Return all conversations or single conversation by id
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const conversations = await readUserDB(session.userId);

    if (id) {
      const conversation = conversations.find(c => c.id === id);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    const summaries = conversations
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map(c => ({
        id: c.id,
        title: c.title,
        messageCount: c.messages.length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

    return NextResponse.json(summaries);
  } catch {
    return NextResponse.json({ error: 'Failed to read conversations' }, { status: 500 });
  }
}

// POST: Create new conversation
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, messages } = body as { title?: string; messages?: ChatMessage[] };

    const conversation: ChatConversation = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 8),
      userId: session.userId,
      title: title || (messages?.find(m => m.role === 'user')?.content.substring(0, 40) || 'Untitled'),
      messages: messages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const conversations = await readUserDB(session.userId);
    conversations.push(conversation);
    await writeUserDB(session.userId, conversations);

    return NextResponse.json({ id: conversation.id, title: conversation.title }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

// PUT: Update existing conversation
export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, messages } = body as { id: string; messages: ChatMessage[] };

    if (!id) {
      return NextResponse.json({ error: 'Conversation id is required' }, { status: 400 });
    }

    const conversations = await readUserDB(session.userId);
    const index = conversations.findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const title = conversations[index].title
      || messages?.find(m => m.role === 'user')?.content.substring(0, 40)
      || 'Untitled';

    conversations[index] = {
      ...conversations[index],
      title,
      messages: messages || conversations[index].messages,
      updatedAt: new Date().toISOString(),
    };

    await writeUserDB(session.userId, conversations);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

// DELETE: Delete conversation
export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: 'Conversation id is required' }, { status: 400 });
    }

    const conversations = await readUserDB(session.userId);
    const filtered = conversations.filter(c => c.id !== id);

    if (filtered.length === conversations.length) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    await writeUserDB(session.userId, filtered);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
