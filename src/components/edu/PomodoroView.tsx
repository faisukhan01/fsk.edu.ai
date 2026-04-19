'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain, Settings, Volume2, VolumeX, History, Trash2, CheckCircle2, XCircle, CloudRain, TreePine, VolumeOff, Moon, Flame, Clock, TrendingUp, Zap, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
type AmbientSound = 'silence' | 'rain' | 'forest' | 'waves' | 'fireplace';

interface PastSession {
  id: string;
  type: string;
  duration: number;
  completed: boolean;
  createdAt: string;
}

interface WeeklyDay {
  day: string;
  minutes: number;
}

interface AmbientNodes {
  sources: AudioBufferSourceNode[];
  gainNode: GainNode;
  oscillators: OscillatorNode[];
  intervalIds: NodeJS.Timeout[];
}

const ambientOptions: { id: AmbientSound; label: string; icon: React.ElementType }[] = [
  { id: 'silence', label: 'Off', icon: VolumeOff },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'forest', label: 'Forest', icon: TreePine },
  { id: 'waves', label: 'Waves', icon: Waves },
  { id: 'fireplace', label: 'Fire', icon: Flame },
];

// Web Audio API ambient sound generators
function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  return buffer;
}

function createRainSound(ctx: AudioContext, volume: number): AmbientNodes {
  const buffer = createBrownNoiseBuffer(ctx);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
  return { sources: [source], gainNode, oscillators: [], intervalIds: [] };
}

function createForestSound(ctx: AudioContext, volume: number): AmbientNodes {
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;
  gainNode.connect(ctx.destination);
  const oscillators: OscillatorNode[] = [];
  const intervalIds: NodeJS.Timeout[] = [];
  const freqs = [220, 277, 330, 440, 554];
  freqs.forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq + (Math.random() - 0.5) * 2;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.03;
    osc.connect(oscGain);
    oscGain.connect(gainNode);
    osc.start();
    oscillators.push(osc);
    // Subtle detune drift
    const interval = setInterval(() => {
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 4, ctx.currentTime);
      oscGain.gain.setValueAtTime(0.02 + Math.random() * 0.03, ctx.currentTime);
    }, 2000 + Math.random() * 3000);
    intervalIds.push(interval);
  });
  // Add subtle brown noise floor
  const brownBuffer = createBrownNoiseBuffer(ctx);
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = brownBuffer;
  noiseSource.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.05;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 200;
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(gainNode);
  noiseSource.start();
  return { sources: [noiseSource], gainNode, oscillators, intervalIds };
}

function createWavesSound(ctx: AudioContext, volume: number): AmbientNodes {
  const buffer = createBrownNoiseBuffer(ctx);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume * 0.8;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
  // Slow amplitude modulation for wave effect
  let phase = 0;
  const interval = setInterval(() => {
    phase += 0.05;
    const mod = 0.3 + 0.7 * Math.abs(Math.sin(phase));
    gainNode.gain.setTargetAtTime(volume * mod, ctx.currentTime, 0.3);
  }, 100);
  return { sources: [source], gainNode, oscillators: [], intervalIds: [interval] };
}

function createFireplaceSound(ctx: AudioContext, volume: number): AmbientNodes {
  const buffer = createBrownNoiseBuffer(ctx);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume * 0.6;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 300;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
  // Subtle crackling via random gain changes
  const interval = setInterval(() => {
    const crackle = Math.random() > 0.85 ? (0.8 + Math.random() * 0.4) : 1.0;
    gainNode.gain.setTargetAtTime(volume * 0.6 * crackle, ctx.currentTime, 0.02);
  }, 80);
  return { sources: [source], gainNode, oscillators: [], intervalIds: [interval] };
}

function createAmbientSound(sound: AmbientSound, ctx: AudioContext, volume: number): AmbientNodes | null {
  switch (sound) {
    case 'rain': return createRainSound(ctx, volume);
    case 'forest': return createForestSound(ctx, volume);
    case 'waves': return createWavesSound(ctx, volume);
    case 'fireplace': return createFireplaceSound(ctx, volume);
    default: return null;
  }
}

function stopAmbientSound(nodes: AmbientNodes) {
  nodes.sources.forEach(s => { try { s.stop(); } catch { /* ignore */ } });
  nodes.oscillators.forEach(o => { try { o.stop(); } catch { /* ignore */ } });
  nodes.intervalIds.forEach(id => clearInterval(id));
  try { nodes.gainNode.disconnect(); } catch { /* ignore */ }
}

export function PomodoroView() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDay[]>([]);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('silence');
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [deepWorkMode, setDeepWorkMode] = useState(false);
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [weekFocusMinutes, setWeekFocusMinutes] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodesRef = useRef<AmbientNodes | null>(null);

  const fetchSessions = useCallback(() => {
    fetch('/api/study-sessions?type=pomodoro')
      .then(r => r.json())
      .then(data => { if (data.sessions) setPastSessions(data.sessions.slice(0, 10)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSessions();
    fetch('/api/weekly')
      .then(r => r.json())
      .then(data => {
        if (data.weeklyData) {
          setWeeklyData(data.weeklyData);
          setWeekFocusMinutes(data.weeklyData.reduce((s: number, d: WeeklyDay) => s + d.minutes, 0));
        }
      })
      .catch(() => {});
    fetch('/api/study-sessions')
      .then(r => r.json())
      .then(data => {
        if (data.sessions) {
          const today = new Date().toDateString();
          const todaySessions = data.sessions.filter((s: PastSession) => new Date(s.createdAt).toDateString() === today);
          setTodayFocusMinutes(todaySessions.reduce((sum: number, s: PastSession) => sum + (s.duration || 0), 0));
        }
      })
      .catch(() => {});
  }, [fetchSessions]);

  const durations: Record<TimerMode, number> = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
  const modeLabels: Record<TimerMode, string> = { focus: 'Focus Time', shortBreak: 'Short Break', longBreak: 'Long Break' };
  const modeColors: Record<TimerMode, string> = { focus: 'bg-orange-500', shortBreak: 'bg-emerald-500', longBreak: 'bg-sky-500' };
  const modeGradients: Record<TimerMode, string> = { focus: 'from-orange-500 to-amber-500', shortBreak: 'from-emerald-500 to-teal-400', longBreak: 'from-sky-500 to-cyan-400' };
  const modeIcons: Record<TimerMode, typeof Brain> = { focus: Brain, shortBreak: Coffee, longBreak: Coffee };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            if (mode === 'focus') {
              const newSessions = sessions + 1;
              setSessions(newSessions);
              setTotalFocusTime(t => t + durations[mode] / 60);
              fetch('/api/study-sessions', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'pomodoro', duration: Math.round(durations[mode] / 60) })
              }).then(() => fetchSessions()).catch(() => {});
              if (newSessions % 4 === 0) switchMode('longBreak');
              else switchMode('shortBreak');
            } else {
              switchMode('focus');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, sessions]);

  // Ambient sound management
  const startAmbient = useCallback((sound: AmbientSound) => {
    // Stop current sound
    if (ambientNodesRef.current) {
      stopAmbientSound(ambientNodesRef.current);
      ambientNodesRef.current = null;
    }
    if (sound === 'silence') return;
    // Create AudioContext if needed
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const nodes = createAmbientSound(sound, ctx, ambientVolume);
    if (nodes) ambientNodesRef.current = nodes;
  }, [ambientVolume]);

  const stopAmbient = useCallback(() => {
    if (ambientNodesRef.current) {
      stopAmbientSound(ambientNodesRef.current);
      ambientNodesRef.current = null;
    }
  }, []);

  // Start/stop ambient sound when selection changes
  useEffect(() => {
    if (ambientSound !== 'silence') {
      startAmbient(ambientSound);
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [ambientSound, startAmbient, stopAmbient]);

  // Update volume on existing sound
  useEffect(() => {
    if (ambientNodesRef.current) {
      ambientNodesRef.current.gainNode.gain.setTargetAtTime(ambientVolume, audioCtxRef.current?.currentTime || 0, 0.1);
    }
  }, [ambientVolume]);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (ambientNodesRef.current) stopAmbientSound(ambientNodesRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const handleAmbientSelect = (sound: AmbientSound) => {
    setAmbientSound(sound);
  };

  const reset = () => { setTimeLeft(durations[mode]); setIsRunning(false); };
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  const activeAmbient = ambientSound !== 'silence';

  return (
    <div className={`flex flex-col h-full ${deepWorkMode ? 'deep-work-mode' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${deepWorkMode ? 'deep-work-card' : 'bg-card/50'} backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${deepWorkMode ? 'bg-orange-900/60' : 'bg-orange-100 dark:bg-orange-900/40'} flex items-center justify-center`}>
            <Timer className="w-4.5 h-4.5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className={`font-semibold text-sm flex items-center gap-2 ${deepWorkMode ? 'text-orange-300' : ''}`}>
              Focus Timer
              {deepWorkMode && (
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 border text-[9px] px-1.5 h-4 gap-0.5">
                  <Moon className="w-2.5 h-2.5" /> Deep Work
                </Badge>
              )}
            </h2>
            <p className={`text-xs ${deepWorkMode ? 'text-orange-200/50' : 'text-muted-foreground'}`}>Stay focused with Pomodoro technique</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${deepWorkMode ? 'text-orange-300 hover:bg-orange-900/30' : ''}`}
                onClick={() => setDeepWorkMode(!deepWorkMode)}
              >
                <Moon className={`w-4 h-4 ${deepWorkMode ? 'text-orange-400' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{deepWorkMode ? 'Exit Deep Work' : 'Deep Work Mode'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${deepWorkMode ? 'text-orange-300 hover:bg-orange-900/30' : ''}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{soundEnabled ? 'Mute sounds' : 'Enable sounds'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className={`max-w-lg mx-auto space-y-4 ${deepWorkMode ? 'deep-work-card' : ''}`}>

          {/* Mode Selector */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
            {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${mode === m ? `${modeColors[m]} text-white shadow-sm` : `${deepWorkMode ? 'text-orange-200/50 hover:text-orange-200' : 'text-muted-foreground hover:text-foreground'}`}`}>
                {modeLabels[m]}
              </button>
            ))}
          </div>

          {/* Timer Card */}
          <Card className={`border-0 shadow-sm overflow-hidden ${deepWorkMode ? 'deep-work-card !bg-transparent border-0' : ''}`}>
            <CardContent className="p-8 flex flex-col items-center">
              <div className="relative w-52 h-52 md:w-60 md:h-60 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className={deepWorkMode ? 'text-orange-900/40' : 'text-muted/30'} />
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="4" strokeLinecap="round"
                    className={mode === 'focus' ? 'text-orange-500' : mode === 'shortBreak' ? 'text-emerald-500' : 'text-sky-500'}
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl md:text-5xl font-bold tabular-nums tracking-tight ${deepWorkMode ? 'text-orange-200' : ''}`}>{formatTime(timeLeft)}</span>
                  <Badge variant="secondary" className={`mt-2 text-xs ${deepWorkMode ? 'bg-orange-900/50 text-orange-300 border-orange-800/50' : ''}`}>{modeLabels[mode]}</Badge>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="icon" className={`h-12 w-12 rounded-2xl ${deepWorkMode ? 'border-orange-800/50 text-orange-300 hover:bg-orange-900/30' : ''}`} onClick={reset}>
                  <RotateCcw className="w-5 h-5" />
                </Button>
                <Button onClick={() => setIsRunning(!isRunning)}
                  className={`h-12 w-12 rounded-2xl ${isRunning ? 'bg-rose-600 hover:bg-rose-700' : `bg-gradient-to-br ${modeGradients[mode]} hover:opacity-90 shadow-lg`}`}>
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ambient Sound Selector */}
          <Card className={`border-0 shadow-sm ${deepWorkMode ? 'deep-work-card !bg-transparent border-0' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold text-sm flex items-center gap-2 ${deepWorkMode ? 'text-orange-200' : ''}`}>
                  <Volume2 className={`w-4 h-4 ${deepWorkMode ? 'text-orange-400' : 'text-primary'}`} />
                  Ambient Sounds
                </h3>
                {activeAmbient && (
                  <Badge variant="secondary" className={`text-[10px] h-5 ${deepWorkMode ? 'bg-orange-900/50 text-orange-300 border-orange-800/50' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-0'}`}>
                    Active
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ambientOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = ambientSound === option.id;
                  return (
                    <Tooltip key={option.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleAmbientSelect(option.id)}
                          className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all duration-200 ${
                            isActive
                              ? 'border-teal-400 dark:border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)] dark:shadow-[0_0_10px_rgba(20,184,166,0.3)] bg-teal-50 dark:bg-teal-950/30'
                              : `${deepWorkMode ? 'border-orange-800/30 text-orange-200/50 hover:text-orange-200' : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'}`
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                          <span className={`text-[9px] font-medium ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`}>{option.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{option.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              {activeAmbient && (
                <div className={`mt-3 space-y-2 ${deepWorkMode ? 'text-orange-200/60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={ambientVolume}
                      onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-teal-500
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:shadow-sm
                        [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-teal-500 [&::-moz-range-thumb]:border-0"
                    />
                    <span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <p className={`text-[10px] text-center ${deepWorkMode ? 'text-orange-200/40' : 'text-muted-foreground/60'}`}>
                    🎧 {ambientOptions.find(a => a.id === ambientSound)?.label} ambient sound playing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className={`border-0 shadow-sm gradient-border gradient-border-warm ${deepWorkMode ? 'deep-work-card !bg-transparent border-0' : ''}`}>
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-lg ${deepWorkMode ? 'bg-orange-900/40' : 'bg-orange-50 dark:bg-orange-950/30'} flex items-center justify-center mx-auto mb-1.5`}>
                  <Flame className={`w-4 h-4 text-orange-500`} />
                </div>
                <p className={`text-lg font-bold text-orange-500 tabular-nums ${deepWorkMode ? '' : ''}`}>{sessions}</p>
                <p className={`text-[10px] ${deepWorkMode ? 'text-orange-200/50' : 'text-muted-foreground'}`}>Today</p>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-sm gradient-border ${deepWorkMode ? 'deep-work-card !bg-transparent border-0' : ''}`}>
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-lg ${deepWorkMode ? 'bg-emerald-900/40' : 'bg-emerald-50 dark:bg-emerald-950/30'} flex items-center justify-center mx-auto mb-1.5`}>
                  <Clock className={`w-4 h-4 text-emerald-500`} />
                </div>
                <p className={`text-lg font-bold text-emerald-500 tabular-nums`}>{todayFocusMinutes}m</p>
                <p className={`text-[10px] ${deepWorkMode ? 'text-orange-200/50' : 'text-muted-foreground'}`}>Focus Today</p>
              </CardContent>
            </Card>
            <Card className={`border-0 shadow-sm gradient-border ${deepWorkMode ? 'deep-work-card !bg-transparent border-0' : ''}`}>
              <CardContent className="p-3 text-center">
                <div className={`w-8 h-8 rounded-lg ${deepWorkMode ? 'bg-teal-900/40' : 'bg-teal-50 dark:bg-teal-950/30'} flex items-center justify-center mx-auto mb-1.5`}>
                  <TrendingUp className={`w-4 h-4 text-teal-500`} />
                </div>
                <p className={`text-lg font-bold text-teal-500 tabular-nums`}>{weekFocusMinutes}m</p>
                <p className={`text-[10px] ${deepWorkMode ? 'text-orange-200/50' : 'text-muted-foreground'}`}>This Week</p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Focus Chart */}
          <Card className={`border-0 shadow-sm ${deepWorkMode ? 'deep-work-card !bg-transparent border-0' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold text-sm flex items-center gap-2 ${deepWorkMode ? 'text-orange-200' : ''}`}>
                  <Zap className={`w-4 h-4 ${deepWorkMode ? 'text-orange-400' : 'text-primary'}`} />
                  Weekly Focus Time
                </h3>
                <span className={`text-xs ${deepWorkMode ? 'text-orange-200/50' : 'text-muted-foreground'}`}>Last 7 days</span>
              </div>
              {weeklyData.length > 0 ? (
                <div className="space-y-2">
                  {weeklyData.map((d) => (
                    <div key={d.day} className="flex items-center gap-2">
                      <span className={`text-xs ${deepWorkMode ? 'text-orange-200/60' : 'text-muted-foreground'} w-8 text-right font-medium`}>{d.day}</span>
                      <div className={`flex-1 h-5 rounded-full overflow-hidden ${deepWorkMode ? 'bg-orange-900/40' : 'bg-muted'}`}>
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 rounded-full transition-all duration-500 chart-bar-gradient"
                          style={{ width: `${Math.min((d.minutes / Math.max(...weeklyData.map(w => w.minutes), 25)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs ${deepWorkMode ? 'text-orange-200/50' : 'text-muted-foreground'} w-10 text-left tabular-nums`}>{d.minutes}m</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${deepWorkMode ? 'text-orange-200/40' : 'text-muted-foreground'} text-center py-3`}>No data yet this week</p>
              )}
            </CardContent>
          </Card>

          {/* Deep Work Tips */}
          {deepWorkMode && (
            <Card className="border-0 bg-gradient-to-r from-orange-950/40 to-amber-950/30 border-orange-800/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-2 text-orange-300 flex items-center gap-2">
                  <Moon className="w-4 h-4" /> Deep Work Tips
                </h3>
                <ul className="space-y-1 text-xs text-orange-200/60">
                  <li>• Close all unnecessary tabs and apps</li>
                  <li>• Put your phone on Do Not Disturb</li>
                  <li>• Set a clear intention for this session</li>
                  <li>• Take breaks only when the timer ends</li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* How Pomodoro Works */}
          <Card className={`border-0 shadow-sm ${deepWorkMode ? 'deep-work-card !bg-transparent border-0' : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20'}`}>
            <CardContent className="p-4">
              <h3 className={`font-semibold text-sm mb-2 ${deepWorkMode ? 'text-orange-200' : ''}`}>How Pomodoro Works</h3>
              <ul className={`space-y-1 text-xs ${deepWorkMode ? 'text-orange-200/60' : 'text-muted-foreground'}`}>
                <li>1. Focus for 25 minutes</li>
                <li>2. Take a 5-minute short break</li>
                <li>3. After 4 sessions, take a 15-minute long break</li>
                <li>4. Repeat and stay productive!</li>
              </ul>
            </CardContent>
          </Card>

          {/* Session History */}
          <Card className={`border-0 shadow-sm ${deepWorkMode ? 'deep-work-card !bg-transparent border-0' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h3 className={`font-semibold text-sm ${deepWorkMode ? 'text-orange-200' : ''}`}>Session History</h3>
                </div>
                {pastSessions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-xs gap-1 ${deepWorkMode ? 'text-orange-200/50 hover:text-orange-200' : 'text-muted-foreground hover:text-destructive'}`}
                    onClick={() => {
                      fetch('/api/study-sessions?type=pomodoro', { method: 'DELETE' })
                        .then(() => fetchSessions())
                        .catch(() => {});
                    }}
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </Button>
                )}
              </div>

              {pastSessions.length === 0 ? (
                <div className="text-center py-6">
                  <Timer className={`w-8 h-8 ${deepWorkMode ? 'text-orange-800/40' : 'text-muted-foreground/40'} mx-auto mb-2`} />
                  <p className={`text-xs ${deepWorkMode ? 'text-orange-200/40' : 'text-muted-foreground'}`}>No sessions yet. Complete your first focus session!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {pastSessions.map((s) => {
                    const date = new Date(s.createdAt);
                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg ${deepWorkMode ? 'bg-orange-900/20 hover:bg-orange-900/30' : 'bg-muted/50 hover:bg-muted'} transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          {s.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                          )}
                          <div>
                            <p className={`text-xs font-medium ${deepWorkMode ? 'text-orange-200' : ''}`}>{dateStr} at {timeStr}</p>
                            <p className={`text-[10px] ${deepWorkMode ? 'text-orange-200/50' : 'text-muted-foreground'}`}>{s.duration} minutes</p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-5 ${
                            s.completed
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {s.completed ? 'Completed' : 'Incomplete'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
