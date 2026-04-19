import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const NOTIFICATIONS_DB = path.join(process.cwd(), 'db', 'notifications.json');
const GOALS_API = 'http://localhost:3000/api/goals';
const ACHIEVEMENTS_API = 'http://localhost:3000/api/achievements';

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'goal' | 'achievement' | 'reminder' | 'info';
  read: boolean;
  createdAt: string;
}

async function readDB(): Promise<Notification[]> {
  try {
    const data = await fs.readFile(NOTIFICATIONS_DB, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeDB(data: Notification[]): Promise<void> {
  const dir = path.dirname(NOTIFICATIONS_DB);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(NOTIFICATIONS_DB, JSON.stringify(data, null, 2));
}

export async function POST() {
  try {
    const notifications = await readDB();
    const created: Notification[] = [];
    const now = new Date();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    // 1. Check goals with approaching deadlines (within 3 days)
    try {
      const goalsResp = await fetch(GOALS_API);
      const goalsData = await goalsResp.json();
      const goals = Array.isArray(goalsData.goals) ? goalsData.goals : [];

      for (const goal of goals) {
        if (goal.isCompleted) continue;
        if (!goal.deadline) continue;

        const deadline = new Date(goal.deadline);
        const timeUntilDeadline = deadline.getTime() - now.getTime();

        // Within 3 days and not already notified
        if (timeUntilDeadline > 0 && timeUntilDeadline <= threeDaysMs) {
          const daysLeft = Math.ceil(timeUntilDeadline / (24 * 60 * 60 * 1000));
          const hoursLeft = Math.ceil(timeUntilDeadline / (60 * 60 * 1000));

          // Check if we already have a recent notification for this goal
          const existingNotif = notifications.find(
            (n) =>
              n.type === 'goal' &&
              n.description.includes(goal.id) &&
              (now.getTime() - new Date(n.createdAt).getTime()) < 6 * 60 * 60 * 1000 // 6 hours
          );

          if (!existingNotif) {
            const notif: Notification = {
              id: crypto.randomUUID(),
              title: 'Goal Deadline Approaching',
              description: `"${goal.title}" is due in ${daysLeft < 1 ? `${hoursLeft} hours` : `${daysLeft} day${daysLeft > 1 ? 's' : ''}`} (Goal ID: ${goal.id})`,
              type: 'goal',
              read: false,
              createdAt: now.toISOString(),
            };
            created.push(notif);
          }
        }
      }
    } catch (e) {
      console.error('Failed to check goals:', e);
    }

    // 2. Check for unread achievements
    try {
      const achievementsResp = await fetch(ACHIEVEMENTS_API);
      const achievementsData = await achievementsResp.json();
      const achievements = Array.isArray(achievementsData.achievements) ? achievementsData.achievements : [];

      for (const ach of achievements) {
        if (ach.unlockedAt) {
          // Check if we already notified about this achievement
          const existingNotif = notifications.find(
            (n) =>
              n.type === 'achievement' &&
              n.description.includes(ach.key) &&
              (now.getTime() - new Date(n.createdAt).getTime()) < 24 * 60 * 60 * 1000 // 24 hours
          );

          if (!existingNotif) {
            const notif: Notification = {
              id: crypto.randomUUID(),
              title: 'Achievement Unlocked! 🎉',
              description: `You earned "${ach.title}" — ${ach.description} (Key: ${ach.key})`,
              type: 'achievement',
              read: false,
              createdAt: now.toISOString(),
            };
            created.push(notif);
          }
        }
      }
    } catch (e) {
      console.error('Failed to check achievements:', e);
    }

    // Save new notifications
    if (created.length > 0) {
      const updated = [...notifications, ...created];
      await writeDB(updated);
    }

    return NextResponse.json({
      checked: true,
      createdCount: created.length,
      notifications: created,
    });
  } catch (error) {
    console.error('Notifications check error:', error);
    return NextResponse.json({ error: 'Failed to check notifications' }, { status: 500 });
  }
}
