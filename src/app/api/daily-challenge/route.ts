import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import { promises as fs } from 'fs';
import path from 'path';
import { getSessionFromRequest } from '@/lib/auth';

const CHALLENGE_FILE = path.join(process.cwd(), 'db', 'daily-challenge.json');
const USER_ANSWERS_DIR = path.join(process.cwd(), 'db', 'daily-answers');

interface DailyChallenge {
  date: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
  difficulty: string;
  stats: { attempted: number; correct: number };
}

interface ChallengeJSON {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
  difficulty: string;
}

interface UserAnswer {
  date: string;
  selectedIndex: number;
  correct: boolean;
}

const SUBJECTS = ['Math', 'Physics', 'CS', 'Chemistry', 'Biology', 'History', 'Literature', 'Economics'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

async function loadChallenge(): Promise<DailyChallenge | null> {
  try {
    const data = await fs.readFile(CHALLENGE_FILE, 'utf-8');
    const challenge: DailyChallenge = JSON.parse(data);
    if (challenge.date === getTodayStr()) return challenge;
  } catch {}
  return null;
}

async function saveChallenge(challenge: DailyChallenge): Promise<void> {
  await fs.writeFile(CHALLENGE_FILE, JSON.stringify(challenge, null, 2), 'utf-8');
}

async function getUserAnswer(userId: string): Promise<UserAnswer | null> {
  try {
    await fs.mkdir(USER_ANSWERS_DIR, { recursive: true });
    const data = await fs.readFile(path.join(USER_ANSWERS_DIR, `${userId}.json`), 'utf-8');
    const answer: UserAnswer = JSON.parse(data);
    if (answer.date === getTodayStr()) return answer;
  } catch {}
  return null;
}

async function saveUserAnswer(userId: string, answer: UserAnswer): Promise<void> {
  await fs.mkdir(USER_ANSWERS_DIR, { recursive: true });
  await fs.writeFile(path.join(USER_ANSWERS_DIR, `${userId}.json`), JSON.stringify(answer, null, 2));
}

async function generateChallenge(): Promise<DailyChallenge> {
  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  const difficulty = DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];

  const systemInstruction = `You are an educational quiz generator for FSK EDU AI. Create fun, quick educational challenges for university students. Always return valid JSON only — no markdown, no extra text.`;

  const prompt = `Generate a ${difficulty} difficulty educational challenge about ${subject} for university students.

Return ONLY valid JSON:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "1-2 sentence explanation of the correct answer",
  "subject": "${subject}",
  "difficulty": "${difficulty}"
}

The correctIndex must be 0, 1, 2, or 3. Make the question educational but engaging.`;

  const parsed = await generateJSON<ChallengeJSON>(prompt, systemInstruction);

  return {
    date: getTodayStr(),
    question: parsed?.question || 'What is the capital of France?',
    options: parsed?.options || ['London', 'Berlin', 'Paris', 'Madrid'],
    correctIndex: typeof parsed?.correctIndex === 'number' ? parsed.correctIndex : 2,
    explanation: parsed?.explanation || 'Paris is the capital and largest city of France.',
    subject: parsed?.subject || subject,
    difficulty: parsed?.difficulty || difficulty,
    stats: { attempted: 0, correct: 0 },
  };
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let challenge = await loadChallenge();
    if (!challenge) {
      challenge = await generateChallenge();
      await saveChallenge(challenge);
    }

    const userAnswer = await getUserAnswer(session.userId);

    return NextResponse.json({
      date: challenge.date,
      question: challenge.question,
      options: challenge.options,
      subject: challenge.subject,
      difficulty: challenge.difficulty,
      stats: challenge.stats,
      answered: !!userAnswer,
      // If already answered, reveal the result
      ...(userAnswer ? {
        correctIndex: challenge.correctIndex,
        explanation: challenge.explanation,
        userSelectedIndex: userAnswer.selectedIndex,
        wasCorrect: userAnswer.correct,
      } : {}),
    });
  } catch (error) {
    console.error('Daily Challenge API Error:', error);
    return NextResponse.json({ error: 'Failed to load daily challenge' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, selectedIndex } = await req.json();

    if (action === 'new') {
      const challenge = await generateChallenge();
      await saveChallenge(challenge);
      return NextResponse.json({
        date: challenge.date,
        question: challenge.question,
        options: challenge.options,
        subject: challenge.subject,
        difficulty: challenge.difficulty,
        stats: challenge.stats,
        answered: false,
      });
    }

    if (typeof selectedIndex !== 'number' || selectedIndex < 0 || selectedIndex > 3) {
      return NextResponse.json({ error: 'Invalid answer index' }, { status: 400 });
    }

    const challenge = await loadChallenge();
    if (!challenge) return NextResponse.json({ error: 'No challenge available' }, { status: 404 });

    // Check if user already answered today
    const existingAnswer = await getUserAnswer(session.userId);
    if (existingAnswer) {
      return NextResponse.json({
        correct: existingAnswer.correct,
        correctIndex: challenge.correctIndex,
        explanation: challenge.explanation,
        stats: challenge.stats,
        alreadyAnswered: true,
      });
    }

    const correct = selectedIndex === challenge.correctIndex;
    challenge.stats.attempted += 1;
    if (correct) challenge.stats.correct += 1;
    await saveChallenge(challenge);

    await saveUserAnswer(session.userId, { date: getTodayStr(), selectedIndex, correct });

    return NextResponse.json({
      correct,
      correctIndex: challenge.correctIndex,
      explanation: challenge.explanation,
      stats: challenge.stats,
    });
  } catch (error) {
    console.error('Daily Challenge Submit Error:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}
