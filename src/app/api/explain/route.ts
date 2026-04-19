import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

const SYSTEM_PROMPT = `You are FSK EDU AI Formula Explainer. When explaining formulas:
- Break down each variable clearly
- Show step-by-step derivation
- Provide a worked example with real numbers
- Include practical applications
- Use LaTeX-style notation for formulas
Format response in clean markdown.`;

const TYPE_CONTEXT: Record<string, string> = {
  formula: 'Provide the mathematical formula, explain every variable, show a step-by-step derivation, and give a worked example with real numbers.',
  concept: 'Explain the core concept, its significance, how it relates to other ideas, and give intuitive analogies.',
  proof: 'Provide a rigorous step-by-step proof or justification, clearly stating assumptions and each logical step.',
  example: 'Focus on worked examples with detailed calculations. Walk through multiple scenarios with different values.',
};

export async function POST(req: NextRequest) {
  try {
    const { topic, type } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const typeLabel = type && TYPE_CONTEXT[type] ? type : 'formula';
    const contextNote = TYPE_CONTEXT[typeLabel];

    const prompt = `${SYSTEM_PROMPT}\n\nPlease explain the following as a ${typeLabel}:\n\n"${topic}"\n\n${contextNote}`;

    const response = await generateText(prompt);

    if (!response) {
      return NextResponse.json({ error: 'No response generated' }, { status: 500 });
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Explain API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
