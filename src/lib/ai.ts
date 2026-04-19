/**
 * Central AI client for FSK EDU AI
 *
 * PRIMARY:  Groq API — completely free, no credit card needed
 *           Models: llama-3.3-70b-versatile (chat), llama-3.2-11b-vision-preview (vision)
 *           Free tier: 14,400 req/day, 30 req/min
 *           Get key: https://console.groq.com (sign up → API Keys → Create)
 *
 * FALLBACK: Google Gemini — free tier (1500 req/day)
 *           Get key: https://aistudio.google.com/app/apikey
 *
 * Setup: Add to .env →  GROQ_API_KEY=your_key_here
 *
 * Multi-user ready: all functions are stateless and safe to call
 * concurrently. Pass userId per request for future per-user rate limiting.
 */

import Groq from 'groq-sdk';

// ── Groq client ──────────────────────────────────────────────────────────────

function getGroqClient(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'your_groq_api_key_here') {
    throw new Error(
      'GROQ_API_KEY is not set. Get a free key at https://console.groq.com and add it to .env as GROQ_API_KEY=your_key'
    );
  }
  return new Groq({ apiKey: key });
}

// ── Gemini fallback (vision only, when Groq vision quota is hit) ─────────────

async function geminiVisionFallback(
  prompt: string,
  imageDataUrls: string[],
  systemInstruction?: string
): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'your_gemini_api_key_here') return null;

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    type InlinePart = { text: string } | { inlineData: { mimeType: string; data: string } };
    const parts: InlinePart[] = [
      { text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt },
    ];

    for (const dataUrl of imageDataUrls) {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }

    const result = await model.generateContent(parts as never);
    return result.response.text();
  } catch {
    return null;
  }
}

// ── Core message type ────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// ── generateText ─────────────────────────────────────────────────────────────

/**
 * Simple single-turn text generation.
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const groq = getGroqClient();

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content ?? '';
}

// ── generateChatResponse ─────────────────────────────────────────────────────

/**
 * Multi-turn chat. Accepts {role, content} messages.
 * Maps 'assistant' role correctly for Groq.
 */
export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>,
  systemInstruction: string
): Promise<string> {
  const groq = getGroqClient();

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemInstruction },
    ...messages.map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: groqMessages,
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content ?? '';
}

// ── generateVisionResponse ───────────────────────────────────────────────────

/**
 * Analyze images with a text prompt.
 * imageDataUrls: array of base64 data URLs (data:image/...;base64,...)
 * Uses Groq vision model, falls back to Gemini if available.
 */
export async function generateVisionResponse(
  prompt: string,
  imageDataUrls: string[],
  systemInstruction?: string
): Promise<string> {
  const groq = getGroqClient();

  // Build multimodal content array
  const imageContent: Groq.Chat.ChatCompletionContentPart[] = imageDataUrls.map((dataUrl) => {
    // Ensure it's a proper data URL
    const url = dataUrl.startsWith('data:') ? dataUrl : `data:image/jpeg;base64,${dataUrl}`;
    return {
      type: 'image_url' as const,
      image_url: { url },
    };
  });

  const userContent: Groq.Chat.ChatCompletionContentPart[] = [
    { type: 'text', text: prompt },
    ...imageContent,
  ];

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: userContent });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });
    return completion.choices[0]?.message?.content ?? '';
  } catch (err) {
    console.warn('Groq vision failed, trying Gemini fallback:', err);
    const fallback = await geminiVisionFallback(prompt, imageDataUrls, systemInstruction);
    if (fallback) return fallback;
    throw err;
  }
}

// ── generateJSON ─────────────────────────────────────────────────────────────

/**
 * Generate structured JSON output.
 * Strips markdown fences and extracts the first JSON object.
 */
export async function generateJSON<T = Record<string, unknown>>(
  prompt: string,
  systemInstruction?: string
): Promise<T | null> {
  const text = await generateText(prompt, systemInstruction);

  // Strip markdown code fences
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Extract first JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}
