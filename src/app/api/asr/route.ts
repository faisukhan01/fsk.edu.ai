import { NextRequest, NextResponse } from 'next/server';

/**
 * Automatic Speech Recognition (ASR) endpoint
 *
 * Free server-side ASR options:
 * - Google Cloud Speech-to-Text: 60 min/month free (requires billing account)
 * - OpenAI Whisper: self-hosted (free, but needs GPU)
 *
 * Current implementation: Returns a signal to use the browser's
 * built-in Web Speech API (SpeechRecognition) which is completely free,
 * works in Chrome/Edge, and requires no API key.
 *
 * To enable server-side ASR in the future, add:
 * GOOGLE_SPEECH_API_KEY=your_key in .env
 */

async function googleCloudASR(audioBase64: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          model: 'latest_long',
          enableAutomaticPunctuation: true,
        },
        audio: { content: audioBase64 },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0]?.alternatives?.[0]?.transcript || null;
}

export async function POST(req: NextRequest) {
  try {
    const { audio } = await req.json();

    if (!audio) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    // Try Google Cloud Speech-to-Text if configured
    const transcript = await googleCloudASR(audio);
    if (transcript) {
      return NextResponse.json({ text: transcript });
    }

    // Fallback: tell client to use browser Web Speech API
    return NextResponse.json({
      useBrowserASR: true,
      message: 'Using browser speech recognition',
    });
  } catch (error) {
    console.error('ASR API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
