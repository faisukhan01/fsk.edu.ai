import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import { promises as fs } from 'fs';
import path from 'path';

const CHALLENGE_FILE = path.join(process.cwd(), 'db', 'daily-challenge.json');

interface DailyChallenge {
  date: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
  difficulty: string;
  stats: {
    attempted: number;
    correct: number;
  };
}

interface ChallengeJSON {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
  difficulty: string;
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
    if (challenge.date === getTodayStr()) {
      return challenge;
    }
  } catch {
    // File doesn't exist or invalid
  }
  return null;
}

async function saveChallenge(challenge: DailyChallenge): Promise<void> {
  await fs.writeFile(CHALLENGE_FILE, JSON.stringify(challenge, null, 2), 'utf-8');
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

The correctIndex must be 0, 1, 2, or 3 (pointing to the correct answer in the options array). Make the question educational but engaging.`;

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

export async function GET() {
  try {
    let challenge = await loadChallenge();

    if (!challenge) {
      challenge = await generateChallenge();
      await saveChallenge(challenge);
    }

    // Return challenge without revealing the correct answer
    return NextResponse.json({
      date: challenge.date,
      question: challenge.question,
      options: challenge.options,
      subject: challenge.subject,
      difficulty: challenge.difficulty,
      stats: challenge.stats,
      answered: challenge.stats.attempted > 0,
    });
  } catch (error) {
    console.error('Daily Challenge API Error:', error);
    return NextResponse.json({ error: 'Failed to load daily challenge' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    if (!challenge) {
      return NextResponse.json({ error: 'No challenge available' }, { status: 404 });
    }

    const correct = selectedIndex === challenge.correctIndex;
    challenge.stats.attempted += 1;
    if (correct) challenge.stats.correct += 1;
    await saveChallenge(challenge);

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
