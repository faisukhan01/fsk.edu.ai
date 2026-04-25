import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';

const DB_DIR = path.join(process.cwd(), 'db', 'notifications');

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'goal' | 'achievement' | 'reminder' | 'info';
  read: boolean;
  createdAt: string;
}

function getUserDBPath(userId: string): string {
  return path.join(DB_DIR, `${userId}.json`);
}

async function readDB(userId: string): Promise<Notification[]> {
  try {
    const data = await fs.readFile(getUserDBPath(userId), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeDB(userId: string, data: Notification[]): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(getUserDBPath(userId), JSON.stringify(data, null, 2));
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const notifications = await readDB(session.userId);
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ notifications: sorted });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, description, type, read } = body as {
      title: string;
      description: string;
      type: 'goal' | 'achievement' | 'reminder' | 'info';
      read?: boolean;
    };

    if (!title || !description || !type) {
      return NextResponse.json({ error: 'Title, description, and type are required' }, { status: 400 });
    }

    const validTypes = ['goal', 'achievement', 'reminder', 'info'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const notification: Notification = {
      id: crypto.randomUUID(),
      title,
      description,
      type,
      read: read ?? false,
      createdAt: new Date().toISOString(),
    };

    const notifications = await readDB(session.userId);
    notifications.push(notification);
    await writeDB(session.userId, notifications);

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, markAllRead } = body as { id?: string; markAllRead?: boolean };

    const notifications = await readDB(session.userId);

    if (markAllRead) {
      let changed = 0;
      for (const n of notifications) {
        if (!n.read) { n.read = true; changed++; }
      }
      await writeDB(session.userId, notifications);
      return NextResponse.json({ success: true, changed });
    }

    if (!id) return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });

    const idx = notifications.findIndex(n => n.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });

    notifications[idx].read = true;
    await writeDB(session.userId, notifications);
    return NextResponse.json({ notification: notifications[idx] });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, clearAll } = body as { id?: string; clearAll?: boolean };

    if (clearAll) {
      await writeDB(session.userId, []);
      return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: 'Notification id is required' }, { status: 400 });

    const notifications = await readDB(session.userId);
    const filtered = notifications.filter(n => n.id !== id);
    if (filtered.length === notifications.length) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await writeDB(session.userId, filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
