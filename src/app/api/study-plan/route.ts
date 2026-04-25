import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, generateText } from '@/lib/ai';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

interface DayPlan {
  day: string;
  tasks: string[];
  focus: string;
  estimatedMinutes: number;
  tips: string;
}

interface StudyPlan {
  title: string;
  overview: string;
  duration: string;
  dailyPlan: DayPlan[];
  resources: string[];
  milestones: string[];
  keyConcepts: string[];
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { topic, duration, difficulty, preferences } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Get user's courses for context
    let coursesContext = '';
    try {
      const courses = await db.course.findMany({ where: { userId: session.userId }, take: 10 });
      if (courses.length > 0) {
        coursesContext = `\n\nStudent's enrolled courses: ${courses.map((c: { name: string; code: string }) => `${c.name} (${c.code})`).join(', ')}`;
      }
    } catch {
      // Ignore DB errors
    }

    const systemInstruction = `You are an expert study planner and academic advisor for FSK EDU AI. Create comprehensive, personalized study plans for university students. Always return valid JSON only — no markdown, no extra text.`;

    const prompt = `Create a detailed study plan for a university student.

Topic: ${topic}
Available time: ${duration || '1 week'}
Difficulty level: ${difficulty || 'intermediate'}
Student preferences: ${preferences || 'balanced approach'}${coursesContext}

Return ONLY valid JSON in this exact format:
{
  "title": "Study Plan Title",
  "overview": "Brief overview paragraph",
  "duration": "${duration || '1 week'}",
  "dailyPlan": [
    {
      "day": "Day 1 - Title",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "focus": "Main focus area",
      "estimatedMinutes": 60,
      "tips": "Helpful tip for this day"
    }
  ],
  "resources": ["Resource 1", "Resource 2"],
  "milestones": ["Milestone 1", "Milestone 2"],
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"]
}

Make the plan realistic, actionable, and educational. Include specific study techniques like active recall, spaced repetition, and practice problems.`;

    const planData = await generateJSON<StudyPlan>(prompt, systemInstruction);

    if (!planData) {
      // Fallback: return as plain text
      const textResponse = await generateText(
        `Create a detailed study plan for: ${topic}. Duration: ${duration || '1 week'}. Difficulty: ${difficulty || 'intermediate'}. Format in markdown.`
      );
      return NextResponse.json({ response: textResponse, format: 'text' });
    }

    return NextResponse.json({ plan: planData });
  } catch (error) {
    console.error('Study Plan API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate study plan' },
      { status: 500 }
    );
  }
}
