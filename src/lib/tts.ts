/**
 * Shared TTS utility
 * Tries server-side TTS first (Google Cloud if configured),
 * then falls back to browser Web Speech API (free, no key needed).
 */

export async function speakWithFallback(
  text: string,
  options?: { voice?: string; speed?: number }
): Promise<{ audio: HTMLAudioElement | null; usedBrowser: boolean }> {
  const cleanText = text.replace(/[#*`_\[\]()>]/g, '').substring(0, 5000);

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, voice: options?.voice, speed: options?.speed }),
    });

    if (!res.ok) throw new Error('TTS request failed');

    const contentType = res.headers.get('content-type') || '';

    // Server returned audio binary
    if (contentType.includes('audio/')) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      return { audio, usedBrowser: false };
    }

    // Server returned JSON — check for browser fallback signal
    const data = await res.json();
    if (data.useBrowserTTS) {
      browserSpeak(data.text || cleanText, options?.speed);
      return { audio: null, usedBrowser: true };
    }
  } catch {
    // Network error — fall back to browser
  }

  // Final fallback: browser Web Speech API
  browserSpeak(cleanText, options?.speed);
  return { audio: null, usedBrowser: true };
}

export function browserSpeak(text: string, rate = 1.0): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Math.min(Math.max(rate, 0.5), 2.0);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

export function stopBrowserSpeak(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
