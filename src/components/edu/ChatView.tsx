'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Mic, MicOff, Volume2, VolumeX, Trash2, Plus, Sparkles, Copy, Check,
  Paperclip, X, Image as ImageIcon, FileText, Globe, Loader2, RotateCcw,
  ThumbsUp, ThumbsDown, ArrowUp, StopCircle, Zap, Hash, Clock, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAppStore, type ChatMessage } from '@/lib/store';
import { speakWithFallback, stopBrowserSpeak } from '@/lib/tts';

// ── Types ──────────────────────────────────────────────────
interface Attachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  size: number;
  dataUrl: string;
  mimeType: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.substring(0, max) + '…';
}

// ── Component ──────────────────────────────────────────────
export function ChatView() {
  const {
    chatMessages: messages,
    setChatMessages: setMessages,
    chatConversationId: currentConversationId,
    setChatConversationId: setCurrentConversationId,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isSavingRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat-history');
      if (res.ok) {
        const data = await res.json();
        setConversations((data as ConversationSummary[]).slice(0, 20));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, [isRecording]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const saveConversation = useCallback(async (convId: string, msgs: ChatMessage[]) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      const apiMessages = msgs
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));
      await fetch('/api/chat-history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: convId, messages: apiMessages }),
      });
      loadConversations();
    } catch { /* silent */ }
    finally { isSavingRef.current = false; }
  }, [loadConversations]);

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    const imageUrls = attachments.filter(a => a.type === 'image').map(a => a.dataUrl);
    const docInfo = attachments.filter(a => a.type === 'document');
    let textContent = input.trim();
    if (docInfo.length > 0) {
      textContent += `\n\n${docInfo.map(d => `[Attached: ${d.name} (${formatFileSize(d.size)})]`).join('\n')}`;
    }
    const userMsg: ChatMessage = {
      role: 'user',
      content: textContent || 'Please analyze the attached image(s).',
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      images: imageUrls.length > 0 ? imageUrls : undefined,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    let convId = currentConversationId;
    if (!convId) {
      try {
        const title = truncate(textContent.replace(/\n/g, ' ') || 'Untitled', 40);
        const res = await fetch('/api/chat-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, messages: [{ role: 'user', content: textContent || 'Please analyze the attached image(s).' }] }),
        });
        if (res.ok) {
          const data = await res.json();
          convId = data.id;
          setCurrentConversationId(convId);
          loadConversations();
        }
      } catch { /* silent */ }
    }

    abortRef.current = new AbortController();
    try {
      const body: Record<string, unknown> = {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      };
      if (imageUrls.length > 0) body.images = imageUrls;
      if (webSearchEnabled) body.webSearch = true;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      const data = await res.json();

      let replyContent: string;
      if (data.response) {
        replyContent = data.response;
      } else if (data.error) {
        const isKeyError = data.error.toLowerCase().includes('groq_api_key') || data.error.toLowerCase().includes('api key');
        replyContent = isKeyError
          ? '⚠️ **AI not configured yet.**\n\nTo enable the AI Teacher:\n1. Go to **[console.groq.com](https://console.groq.com)** and sign up (free)\n2. Create an API Key\n3. Add it to your `.env` file\n4. Restart the dev server'
          : `⚠️ Error: ${data.error}`;
      } else {
        replyContent = '⚠️ No response received. Please try again.';
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: replyContent,
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toISOString(),
        mode: data.mode || 'chat',
      };
      const allMessages = [...newMessages, assistantMsg];
      setMessages(allMessages);
      if (convId && data.response) saveConversation(convId, allMessages);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: '⚠️ Network error — could not reach the server.',
        id: (Date.now() + 1).toString(),
        timestamp: new Date().toISOString(),
      };
      const allMessages = [...newMessages, errorMsg];
      setMessages(allMessages);
      if (convId) saveConversation(convId, allMessages);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat-history?id=${convId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.messages) {
        const loaded: ChatMessage[] = data.messages.map((m: { role: string; content: string }, i: number) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          id: `loaded-${i}-${Date.now()}`,
          timestamp: data.updatedAt || new Date().toISOString(),
        }));
        setMessages(loaded);
        setCurrentConversationId(convId);
        setShowHistory(false);
      }
    } catch { /* silent */ }
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch('/api/chat-history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: convId }),
      });
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (currentConversationId === convId) {
        setMessages([]);
        setCurrentConversationId(null);
      }
    } catch { /* silent */ }
  };

  const newChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setWebSearchEnabled(false);
    setShowHistory(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          id: crypto.randomUUID(),
          type: file.type.startsWith('image/') ? 'image' : 'document',
          name: file.name, size: file.size,
          dataUrl: reader.result as string, mimeType: file.type,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file || file.size > 10 * 1024 * 1024) continue;
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments(prev => [...prev, {
            id: crypto.randomUUID(), type: 'image', name: 'Pasted image',
            size: file.size, dataUrl: reader.result as string, mimeType: file.type,
          }]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const res = await fetch('/api/asr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio: base64 }) });
            const data = await res.json();
            if (data.text) { setInput(prev => prev + (prev ? ' ' : '') + data.text); textareaRef.current?.focus(); }
          } catch { /* silent */ }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch { /* silent */ }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const speakText = async (text: string) => {
    if (isSpeaking) {
      currentAudioRef.current?.pause();
      currentAudioRef.current = null;
      stopBrowserSpeak();
      setIsSpeaking(false);
      return;
    }
    try {
      setIsSpeaking(true);
      const { audio, usedBrowser } = await speakWithFallback(text);
      if (audio) {
        currentAudioRef.current = audio;
        audio.onended = () => { setIsSpeaking(false); currentAudioRef.current = null; };
        audio.play();
      } else if (usedBrowser) {
        const estimatedMs = (text.split(/\s+/).length / 2.5) * 1000;
        setTimeout(() => setIsSpeaking(false), Math.min(estimatedMs, 30000));
      }
    } catch { setIsSpeaking(false); }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const setReaction = (msgId: string, reaction: 'up' | 'down' | null) => {
    setMessages(messages.map(m => m.id === msgId ? { ...m, reactions: m.reactions === reaction ? null : reaction } : m));
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const regenerate = (msgId: string) => {
    const idx = messages.findIndex(m => m.id === msgId);
    if (idx < 0) return;
    const userMsgs = messages.slice(0, idx).filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;
    const lastUserMsg = userMsgs[userMsgs.length - 1];
    setMessages(messages.slice(0, idx));
    setInput(lastUserMsg.content);
    textareaRef.current?.focus();
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const canSend = (input.trim() || attachments.length > 0) && !isLoading;

  const suggestions = [
    { text: 'Explain quantum computing simply', icon: '💡' },
    { text: 'Key concepts in machine learning?', icon: '🤖' },
    { text: 'Help me with calculus derivatives', icon: '📐' },
    { text: 'Explain the OSI model', icon: '🌐' },
    { text: 'Solve: integral of x² dx', icon: '🔢' },
    { text: 'Explain photosynthesis step by step', icon: '🌱' },
  ];

  return (
    <div className="flex flex-col h-full relative bg-background">

      {/* ── History Sidebar ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20" onClick={() => setShowHistory(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-30 w-72 bg-card border-r border-border shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-3.5 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-semibold text-sm">Chat History</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{conversations.length}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setShowHistory(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No conversations yet</p>
                  </div>
                ) : conversations.map(conv => (
                  <button key={conv.id} onClick={() => loadConversation(conv.id)}
                    className={`group w-full text-left px-3 py-2.5 rounded-lg transition-all relative ${
                      currentConversationId === conv.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-l-emerald-500'
                        : 'hover:bg-accent border-l-2 border-l-transparent'
                    }`}>
                    <p className={`text-xs font-medium truncate ${currentConversationId === conv.id ? 'text-emerald-700 dark:text-emerald-300' : ''}`}>
                      {truncate(conv.title, 32)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                        <Hash className="w-2.5 h-2.5" />{conv.messageCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{getRelativeTime(conv.updatedAt)}
                      </span>
                    </div>
                    <button onClick={(e) => deleteConversation(conv.id, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>
              <div className="p-3 border-t">
                <Button variant="outline" className="w-full h-8 text-xs gap-1.5 rounded-lg border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" onClick={newChat}>
                  <Plus className="w-3.5 h-3.5" /> New Conversation
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm leading-tight">FSK EDU AI Teacher</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span className="text-[11px] text-muted-foreground">Online — Ask me anything</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-accent" onClick={clearChat}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear chat</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-accent" onClick={newChat}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto chat-pattern-bg" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-5 shadow-xl shadow-emerald-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-1.5">How can I help you <span className="text-emerald-500">learn</span>?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">Ask me about any subject — I'll explain it clearly, step by step.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 w-full max-w-2xl">
                {suggestions.map((s, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                    className="text-left text-xs p-3 rounded-xl border border-border/70 bg-card hover:bg-accent hover:border-emerald-400/40 transition-all duration-150 group">
                    <span className="mr-1.5">{s.icon}</span>{s.text}
                  </motion.button>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {[
                  { icon: <ImageIcon className="w-3 h-3" />, label: 'Images' },
                  { icon: <FileText className="w-3 h-3" />, label: 'Documents' },
                  { icon: <Mic className="w-3 h-3" />, label: 'Voice' },
                  { icon: <Globe className="w-3 h-3" />, label: 'Web Search' },
                ].map((f, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 text-[10px] text-muted-foreground">
                    {f.icon}{f.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

              {/* Avatar */}
              <Avatar className="w-7 h-7 mt-0.5 shrink-0 ring-1 ring-border/40">
                <AvatarFallback className={msg.role === 'user'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-semibold'
                  : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-semibold'}>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </AvatarFallback>
              </Avatar>

              <div className={`flex flex-col max-w-[82%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                {/* Bubble */}
                {msg.role === 'user' ? (
                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-sm">
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="max-h-40 rounded-lg object-cover shadow-sm" />
                        ))}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                ) : (
                  <Card className="border-0 shadow-sm bg-card rounded-2xl rounded-bl-sm overflow-hidden">
                    <CardContent className="p-3.5 sm:p-4 text-sm">
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {msg.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="max-h-40 rounded-lg object-cover shadow-sm" />
                          ))}
                        </div>
                      )}
                      <div className="markdown-content prose prose-sm dark:prose-invert max-w-none
                        prose-p:my-1.5 prose-p:leading-relaxed
                        prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
                        prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5
                        prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                        prose-pre:bg-muted prose-pre:rounded-xl prose-pre:text-xs
                        prose-blockquote:border-l-emerald-400 prose-blockquote:text-muted-foreground
                        prose-strong:text-foreground prose-a:text-emerald-600 dark:prose-a:text-emerald-400">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Meta row */}
                <div className={`flex items-center gap-1 mt-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-muted-foreground/50 px-0.5">
                    {msg.timestamp ? formatTime(new Date(msg.timestamp)) : ''}
                  </span>
                  {msg.mode === 'websearch' && (
                    <Badge variant="secondary" className="h-4 text-[9px] px-1.5 gap-0.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-0">
                      <Globe className="w-2.5 h-2.5" /> Web
                    </Badge>
                  )}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg px-1 py-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 rounded hover:bg-accent transition-colors" onClick={() => setReaction(msg.id, 'up')}>
                            <ThumbsUp className={`w-3 h-3 ${msg.reactions === 'up' ? 'text-emerald-500' : 'text-muted-foreground/60 hover:text-emerald-500'}`} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Good response</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 rounded hover:bg-accent transition-colors" onClick={() => setReaction(msg.id, 'down')}>
                            <ThumbsDown className={`w-3 h-3 ${msg.reactions === 'down' ? 'text-rose-500' : 'text-muted-foreground/60 hover:text-rose-500'}`} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Needs improvement</TooltipContent>
                      </Tooltip>
                      <div className="w-px h-3 bg-border/50 mx-0.5" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 rounded hover:bg-accent transition-colors" onClick={() => copyText(msg.content, msg.id)}>
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground/60 hover:text-foreground" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Copy</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 rounded hover:bg-accent transition-colors" onClick={() => speakText(msg.content)}>
                            {isSpeaking ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-muted-foreground/60 hover:text-foreground" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{isSpeaking ? 'Stop' : 'Read aloud'}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1 rounded hover:bg-accent transition-colors" onClick={() => regenerate(msg.id)}>
                            <RotateCcw className="w-3 h-3 text-muted-foreground/60 hover:text-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Regenerate</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <Avatar className="w-7 h-7 mt-0.5 shrink-0 ring-1 ring-border/40">
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-semibold">AI</AvatarFallback>
              </Avatar>
              <Card className="border-0 shadow-sm bg-card rounded-2xl rounded-bl-sm">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="typing-bounce">
                      <div className="typing-bounce-dot" />
                      <div className="typing-bounce-dot" />
                      <div className="typing-bounce-dot" />
                    </div>
                    <span className="text-xs text-muted-foreground">{webSearchEnabled ? 'Searching the web...' : 'Thinking...'}</span>
                    {webSearchEnabled && <Loader2 className="w-3 h-3 text-teal-500 animate-spin" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border/80 shadow-md flex items-center justify-center hover:bg-accent transition-colors">
            <ArrowUp className="w-4 h-4 rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Attachment preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="border-t border-border/50 px-4 py-2 bg-card/30 overflow-hidden">
            <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto pb-1">
              {attachments.map(att => (
                <div key={att.id} className="relative shrink-0 group">
                  {att.type === 'image' ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border shadow-sm">
                      <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-border bg-muted/50 flex flex-col items-center justify-center p-1.5 gap-0.5">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[8px] text-muted-foreground truncate max-w-[60px]">{att.name}</span>
                    </div>
                  )}
                  <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => setAttachments([])} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors shrink-0 px-2 py-1 rounded hover:bg-destructive/10">
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2.5 rounded-full bg-destructive/95 text-white shadow-lg">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-medium">Recording {formatRecordingTime(recordingTime)}</span>
            <button onClick={stopRecording} className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors">
              <MicOff className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Area ── */}
      <div className="border-t bg-card/60 backdrop-blur-sm px-3 sm:px-4 pt-2.5 pb-3 shrink-0">
        <div className="max-w-3xl mx-auto">

          {/* Web search toggle — only when chatting */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  webSearchEnabled
                    ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                    : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
                }`}>
                <Globe className={`w-3 h-3 ${webSearchEnabled ? 'text-teal-500' : ''}`} />
                Search web
                {webSearchEnabled && <Zap className="w-2.5 h-2.5 text-teal-500" />}
              </button>
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2">
            {/* Attach */}
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className={`h-9 w-9 rounded-xl shrink-0 ${showAttachMenu ? 'bg-accent' : 'hover:bg-accent'}`}
                    onClick={() => setShowAttachMenu(!showAttachMenu)}>
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
              <AnimatePresence>
                {showAttachMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAttachMenu(false)} />
                    <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full left-0 mb-2 z-20 w-48 rounded-xl border border-border/80 bg-popover shadow-lg p-1.5">
                      {[
                        { icon: <ImageIcon className="w-4 h-4 text-sky-500" />, label: 'Image', sub: 'PNG, JPG up to 10MB', bg: 'bg-sky-100 dark:bg-sky-900/40' },
                        { icon: <FileText className="w-4 h-4 text-violet-500" />, label: 'Document', sub: 'Any file up to 10MB', bg: 'bg-violet-100 dark:bg-violet-900/40' },
                      ].map((item) => (
                        <button key={item.label} onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-colors text-left">
                          <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>{item.icon}</div>
                          <div>
                            <p className="text-xs font-medium">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              <input ref={fileInputRef} type="file" className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx" multiple onChange={handleFileSelect} />
            </div>

            {/* Textarea */}
            <div className="flex-1 relative">
              <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown} onPaste={handlePaste}
                placeholder={isRecording ? 'Listening...' : 'Ask me anything about your studies...'}
                className="min-h-[40px] max-h-[140px] resize-none text-sm rounded-xl border-primary/20 focus:border-primary/40 shadow-sm leading-relaxed"
                rows={1} disabled={isRecording} />
            </div>

            {/* Voice / Stop / Send */}
            {isLoading ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10" onClick={stopGeneration}>
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop</TooltipContent>
              </Tooltip>
            ) : isRecording ? (
              <Button variant="destructive" size="icon" className="h-9 w-9 rounded-xl shrink-0 animate-pulse" onMouseDown={stopRecording}>
                <MicOff className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl shrink-0 text-muted-foreground hover:bg-accent"
                      onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={() => { if (isRecording) stopRecording(); }}>
                      <Mic className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Hold to record</TooltipContent>
                </Tooltip>
                <Button onClick={sendMessage} disabled={!canSend} size="icon"
                  className="h-9 w-9 rounded-xl shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm shadow-emerald-500/20 disabled:opacity-40 transition-all">
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/40 mt-1.5 text-center">
            FSK EDU AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

