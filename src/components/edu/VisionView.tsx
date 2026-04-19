'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, ImageIcon, Sparkles, Volume2, VolumeX, Copy, Check, Loader2, X, Camera, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { speakWithFallback, stopBrowserSpeak } from '@/lib/tts';

export function VisionView() {
  const [image, setImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const analyzeImage = async () => {
    if (!image) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, question: question || 'Explain this image in detail for a university student.' })
      });
      const data = await res.json();
      if (data.response) setResult(data.response);
    } catch { setResult('Failed to analyze image. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const speakText = async (text: string) => {
    if (isSpeaking) {
      if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
      stopBrowserSpeak();
      setIsSpeaking(false);
      return;
    }
    try {
      setIsSpeaking(true);
      const { audio } = await speakWithFallback(text);
      if (audio) {
        currentAudioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
        audio.play();
      } else {
        const wordCount = text.split(/\s+/).length;
        setTimeout(() => setIsSpeaking(false), Math.min((wordCount / 2.5) * 1000, 30000));
      }
    } catch { setIsSpeaking(false); }
  };

  const copyResult = () => {
    if (result) { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const clearAll = () => { setImage(null); setResult(null); setQuestion(''); };

  const quickQuestions = [
    'Explain this concept in detail',
    'What are the key formulas shown?',
    'Create a summary of this content',
    'Generate quiz questions from this',
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Camera className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Image Analyzer</h2>
            <p className="text-xs text-muted-foreground">Upload images for AI-powered explanations</p>
          </div>
        </div>
        {image && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearAll}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {!image ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-8 md:p-12 text-center cursor-pointer hover:border-primary/40 hover:bg-accent/50 transition-all duration-300 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ImageIcon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold mb-1">Upload an Image</h3>
              <p className="text-sm text-muted-foreground mb-4">Drag & drop or click to upload</p>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Choose File
              </Button>
              <p className="text-xs text-muted-foreground mt-3">Supports PNG, JPG, WEBP, GIF</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="relative">
                  <img src={image} alt="Uploaded" className="w-full max-h-64 object-contain bg-muted/50" />
                </div>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="relative">
                    <Textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isLoading) analyzeImage();
                        }
                      }}
                      placeholder="What would you like to know about this image? (Enter to send)"
                      className="min-h-[80px] resize-none text-sm rounded-xl border-primary/20 focus:border-primary/50 pr-12"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={analyzeImage}
                          disabled={isLoading}
                          size="icon"
                          className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-lg bg-amber-600 hover:bg-amber-700 shadow-sm disabled:opacity-40"
                        >
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Analyze image (Enter)</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {quickQuestions.map((q, i) => (
                      <button key={i} onClick={() => setQuestion(q)}
                        className="text-[11px] px-2.5 py-1 rounded-full border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                  <Button onClick={analyzeImage} disabled={isLoading} className="w-full mt-3 bg-amber-600 hover:bg-amber-700 rounded-xl gap-2">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isLoading ? 'Analyzing...' : 'Analyze Image'}
                  </Button>
                </CardContent>
              </Card>

              {result && (
                <Card className="border-0 shadow-sm animate-fade-in-up">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Analysis Result
                      </h3>
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => speakText(result)}>
                              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{isSpeaking ? 'Stop speaking' : 'Read aloud'}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyResult}>
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="markdown-content text-sm">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
