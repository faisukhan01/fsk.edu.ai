import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai';

/**
 * Web Research endpoint
 * Uses Gemini to provide AI-powered research summaries.
 * For real-time web results, Gemini 1.5 Flash uses its training knowledge.
 *
 * Future upgrade: Add Google Custom Search API (100 free queries/day)
 * by setting GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX in .env
 */

async function googleCustomSearch(query: string, num: number) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) return null;

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${Math.min(num, 10)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  return data.items?.map((item: { title: string; snippet: string; link: string }) => ({
    title: item.title,
    snippet: item.snippet,
    url: item.link,
  })) || [];
}

export async function POST(req: NextRequest) {
  try {
    const { query, num = 8 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Try Google Custom Search first (if configured)
    const searchResults = await googleCustomSearch(
      `${query} educational academic university study`,
      Math.min(num, 15)
    );

    if (searchResults) {
      return NextResponse.json({ results: { results: searchResults } });
    }

    // Fallback: Use Groq to generate a research summary
    const prompt = `You are a web research assistant for university students. The user is researching: "${query}"

Provide a comprehensive research summary with:
1. Key findings and facts (5-8 bullet points)
2. Important concepts to understand
3. Recommended search terms for further research
4. Suggested academic sources or textbooks

Format as clear, educational markdown. Be accurate and cite well-known sources where possible.`;

    const summary = await generateText(prompt);

    // Return structured results that the frontend can render
    const aiResults = [
      {
        url: '#',
        name: `AI Research Summary: ${query}`,
        snippet: summary,
        host_name: 'FSK EDU AI',
        rank: 1,
        date: new Date().toISOString(),
        favicon: '',
        isAiSummary: true,
      },
    ];

    return NextResponse.json({ results: aiResults });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
