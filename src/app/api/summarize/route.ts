import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';
import { db } from '@/lib/db';

const SYSTEM_PROMPT = `You are an expert academic summarizer for university students. Summarize the following text in a clear, structured way. Your goal is to help students quickly understand the key concepts and main ideas from their study materials. Always be accurate and preserve the most important information.`;

const STYLE_INSTRUCTIONS: Record<string, string> = {
  brief: 'Provide a concise, brief summary that captures the main idea in 2-3 short paragraphs. Focus only on the most critical points.',
  detailed: 'Provide a comprehensive summary that covers all major points, key arguments, supporting evidence, and important nuances. Use clear section headers.',
  'bullet-points': 'Summarize the text using well-organized bullet points. Group related points under subheadings. Keep each bullet concise but informative.',
  eli5: 'Explain the text as if the reader is 5 years old. Use simple language, fun analogies, and relatable examples. Avoid jargon entirely. Be engaging and easy to understand.',
};

export async function POST(req: NextRequest) {
  try {
    const { text, style = 'brief' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide at least 20 characters of text to summarize.' },
        { status: 400 }
      );
    }

    const validStyles = ['brief', 'detailed', 'bullet-points', 'eli5'];
    const selectedStyle = validStyles.includes(style) ? style : 'brief';
    const styleInstruction = STYLE_INSTRUCTIONS[selectedStyle];

    const prompt = `${SYSTEM_PROMPT}\n\nSummarize the following text using the "${selectedStyle}" style:\n\n${styleInstruction}\n\n---\n\n${text}`;

    const summary = await generateText(prompt);

    if (!summary) {
      return NextResponse.json({ error: 'No summary generated' }, { status: 500 });
    }

    const originalWordCount = text.trim().split(/\s+/).length;
    const summaryWordCount = summary.trim().split(/\s+/).length;

    // Save to database
    const saved = await db.summary.create({
      data: {
        originalText: text.trim(),
        summary,
        style: selectedStyle,
        wordCount: summaryWordCount,
      },
    });

    return NextResponse.json({
      summary,
      originalWordCount,
      summaryWordCount,
      reduction: originalWordCount > 0
        ? Math.round(((originalWordCount - summaryWordCount) / originalWordCount) * 100)
        : 0,
      id: saved.id,
    });
  } catch (error) {
    console.error('Summarize API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
