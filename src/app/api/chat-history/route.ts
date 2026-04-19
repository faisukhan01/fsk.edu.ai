import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db', 'chat-history.json');

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

async function readDB(): Promise<ChatConversation[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeDB(data: ChatConversation[]): Promise<void> {
  const dir = path.dirname(DB_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// GET: Return all conversations (without full messages) or single conversation by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const conversations = await readDB();

    if (id) {
      const conversation = conversations.find(c => c.id === id);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    // Return all conversations sorted by updatedAt desc, without full messages
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
  try {
    const body = await request.json();
    const { title, messages } = body as { title?: string; messages?: ChatMessage[] };

    const conversation: ChatConversation = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 8),
      title: title || (messages?.find(m => m.role === 'user')?.content.substring(0, 40) || 'Untitled'),
      messages: messages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const conversations = await readDB();
    conversations.push(conversation);
    await writeDB(conversations);

    return NextResponse.json({ id: conversation.id, title: conversation.title }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

// PUT: Update existing conversation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, messages } = body as { id: string; messages: ChatMessage[] };

    if (!id) {
      return NextResponse.json({ error: 'Conversation id is required' }, { status: 400 });
    }

    const conversations = await readDB();
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

    await writeDB(conversations);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

// DELETE: Delete conversation
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: 'Conversation id is required' }, { status: 400 });
    }

    const conversations = await readDB();
    const filtered = conversations.filter(c => c.id !== id);

    if (filtered.length === conversations.length) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    await writeDB(filtered);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
