import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse, generateVisionResponse } from '@/lib/ai';

const BASE_SYSTEM_PROMPT = `You are FSK EDU AI, an expert and professional AI teaching assistant designed specifically for university students. You have deep knowledge across all academic disciplines. You teach like an experienced professor who genuinely cares about student understanding. Your teaching approach includes:
- Clear, jargon-free explanations
- Real-world examples and practical applications
- Step-by-step breakdowns of complex topics
- Visual descriptions of abstract concepts
- Encouraging tone that builds confidence
- Thought-provoking follow-up questions
You adapt your teaching style to the student's level and make learning engaging and effective. Format responses in markdown.`;

const COURSE_SYSTEM_PROMPT = `You are FSK EDU AI, an expert and professional teacher for university courses. You teach with clarity, depth, and enthusiasm, using examples, analogies, and structured explanations. You break down complex topics into digestible parts. When explaining concepts, you use:
- Clear definitions first
- Real-world examples and analogies
- Step-by-step explanations
- Key takeaways summaries
- Practice questions when appropriate
You encourage critical thinking and ask follow-up questions to ensure understanding. Be thorough but concise. Format responses in markdown.`;

const VISION_SYSTEM_PROMPT = `You are FSK EDU AI Vision, an expert educational image analyzer integrated into the chat. When analyzing attached images:
- If it's a diagram/chart: explain the data, trends, and implications clearly
- If it's a formula/equation: break it down step by step, explain each variable
- If it's a textbook page: summarize the key concepts and explain them clearly
- If it's handwritten notes: transcribe and explain the content
- If it's a screenshot of code: explain what the code does, line by line if needed
- If it's a photo of a whiteboard: extract and explain all content
- If it's a document page: extract text and explain the content thoroughly
Always provide thorough educational explanations suitable for university students. Format with markdown.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, courseId, images, webSearch } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const systemPrompt = courseId ? COURSE_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT;

    // Vision mode — images attached
    if (images && images.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const prompt = lastMsg.content || 'Please analyze the attached image(s) and explain them in an educational context.';

      const response = await generateVisionResponse(prompt, images, VISION_SYSTEM_PROMPT);
      return NextResponse.json({ response, mode: 'vision' });
    }

    // Web search mode — prepend a note asking Gemini to use its knowledge
    // (Gemini 1.5 Flash has knowledge cutoff; for real-time search use Google Search grounding)
    if (webSearch) {
      const searchAwarePrompt = `${systemPrompt}\n\nThe user has enabled web search mode. Use your most up-to-date knowledge to answer accurately. If the topic may have changed recently, mention that the user should verify with current sources. Cite relevant concepts and provide well-sourced explanations.`;
      try {
        const response = await generateChatResponse(messages.slice(-20), searchAwarePrompt);
        return NextResponse.json({ response, mode: 'websearch' });
      } catch (err) {
        console.error('Web search mode failed, falling back:', err);
        // Fall through to regular chat
      }
    }

    // Regular chat
    const response = await generateChatResponse(messages.slice(-20), systemPrompt);
    return NextResponse.json({ response, mode: 'chat' });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate response' },
      { status: 500 }
    );
  }
}
