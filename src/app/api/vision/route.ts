import { NextRequest, NextResponse } from 'next/server';
import { generateVisionResponse } from '@/lib/ai';

const SYSTEM_PROMPT = `You are FSK EDU AI Vision, an expert educational image analyzer. When analyzing images:
- If it's a diagram/chart: explain the data, trends, and implications clearly
- If it's a formula/equation: break it down step by step, explain each variable
- If it's a textbook page: summarize the key concepts and explain them clearly
- If it's handwritten notes: transcribe and explain the content
- If it's a screenshot of code: explain what the code does, line by line if needed
- If it's a photo of a whiteboard: extract and explain all content
Always provide thorough educational explanations suitable for university students. Format with markdown.`;

export async function POST(req: NextRequest) {
  try {
    const { image, question } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const finalQuestion = question?.trim() || 'Explain this image in detail for a university student.';

    const response = await generateVisionResponse(finalQuestion, [image], SYSTEM_PROMPT);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Vision API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
