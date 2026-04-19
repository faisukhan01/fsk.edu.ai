import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

const SYSTEM_PROMPT = `You are an expert tutor for university students. When given a math or code problem, provide a clear step-by-step solution with explanations. Format your response in markdown. Use code blocks with language tags for code. Show all work clearly.`;

const TYPE_CONTEXT: Record<string, string> = {
  math: 'This is a math problem. Show all steps of the calculation, explain each step, and provide the final answer clearly. Use proper mathematical notation where appropriate.',
  code: 'This is a programming question. Provide clean, well-commented code with language-appropriate syntax highlighting. Explain the approach, time/space complexity, and edge cases.',
  general: 'This is a general academic question. Provide a clear, comprehensive explanation with relevant examples, concepts, and applications.',
};

export async function POST(req: NextRequest) {
  try {
    const { question, type = 'math' } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (question.trim().length < 3) {
      return NextResponse.json({ error: 'Please provide at least 3 characters.' }, { status: 400 });
    }

    const validTypes = ['math', 'code', 'general'];
    const selectedType = validTypes.includes(type) ? type : 'math';
    const contextNote = TYPE_CONTEXT[selectedType];

    const prompt = `${SYSTEM_PROMPT}\n\n${contextNote}\n\nProblem:\n"${question.trim()}"`;

    const solution = await generateText(prompt);

    if (!solution) {
      return NextResponse.json({ error: 'No solution generated' }, { status: 500 });
    }

    return NextResponse.json({ solution, type: selectedType });
  } catch (error) {
    console.error('Solve API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate solution' },
      { status: 500 }
    );
  }
}
