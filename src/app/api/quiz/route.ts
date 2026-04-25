import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getSessionFromRequest } from '@/lib/auth';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { topic, numQuestions = 5, difficulty = 'medium', courseId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const systemInstruction = `You are a quiz generator for FSK EDU AI. Generate educational multiple choice quizzes for university students. Always return valid JSON only — no markdown, no extra text.`;

    const prompt = `Generate a quiz with exactly ${numQuestions} multiple choice questions about "${topic}". Difficulty level: ${difficulty}.

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz title",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}

Make questions educational, clear, and unambiguous. Ensure exactly one correct answer per question.`;

    const quizData = await generateJSON<QuizData>(prompt, systemInstruction);

    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      return NextResponse.json({ error: 'Failed to parse quiz. Please try again.' }, { status: 500 });
    }

    // Save quiz to database
    const quizId = uuidv4();
    await db.quiz.create({
      data: {
        id: quizId,
        userId: session.userId,
        title: quizData.title || `Quiz: ${topic}`,
        courseId: courseId || null,
        totalQuestions: quizData.questions.length,
        questions: {
          create: quizData.questions.map((q) => ({
            id: uuidv4(),
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
          })),
        },
      },
    });

    return NextResponse.json({ quizId, ...quizData });
  } catch (error) {
    console.error('Quiz API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const quizzes = await db.quiz.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { questions: true },
    });
    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Quiz GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { quizId, answers } = await req.json();

    // Verify quiz belongs to user
    const quiz = await db.quiz.findFirst({ where: { id: quizId, userId: session.userId } });
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    let correct = 0;
    for (const answer of answers) {
      const question = await db.quizQuestion.findUnique({ where: { id: answer.questionId } });
      if (question) {
        await db.quizQuestion.update({
          where: { id: answer.questionId },
          data: { userAnswer: answer.answer, isCorrect: question.correctAnswer === answer.answer },
        });
        if (question.correctAnswer === answer.answer) correct++;
      }
    }

    await db.quiz.update({
      where: { id: quizId },
      data: { score: correct },
    });

    return NextResponse.json({ score: correct, total: answers.length });
  } catch (error) {
    console.error('Quiz PUT Error:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
