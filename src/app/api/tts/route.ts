import { NextRequest, NextResponse } from 'next/server';

/**
 * Text-to-Speech endpoint
 *
 * Server-side TTS options that are free:
 * - Google Cloud TTS: 1M chars/month free (requires billing account)
 * - Microsoft Azure TTS: 500K chars/month free
 *
 * Current implementation: Returns a signal to use the browser's
 * built-in Web Speech API (SpeechSynthesis) which is completely free,
 * works offline, and requires no API key.
 *
 * The client-side ChatView already has Web Speech API support.
 * This endpoint returns a 200 with useBrowserTTS: true so the
 * client knows to fall back to the browser engine.
 *
 * To enable server-side TTS in the future, add:
 * GOOGLE_TTS_API_KEY=your_key in .env
 */

async function googleCloudTTS(text: string, voice: string, speed: number): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return null;

  const voiceMap: Record<string, { languageCode: string; name: string }> = {
    default: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
    female: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
    male: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
  };

  const selectedVoice = voiceMap[voice] || voiceMap.default;

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: text.substring(0, 5000) },
        voice: selectedVoice,
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: Math.min(Math.max(speed, 0.25), 4.0),
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.audioContent) return null;

  return Buffer.from(data.audioContent, 'base64');
}

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'default', speed = 1.0 } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Try Google Cloud TTS if configured
    const audioBuffer = await googleCloudTTS(text, voice, speed);
    if (audioBuffer) {
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Fallback: tell client to use browser Web Speech API
    return NextResponse.json({
      useBrowserTTS: true,
      text: text.substring(0, 5000),
      message: 'Using browser speech synthesis',
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
