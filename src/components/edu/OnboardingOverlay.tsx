'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, MessageSquare, Brain, BookOpen, Timer,
  Sparkles, Keyboard, ArrowRight, X, ChevronRight,
  Lightbulb, Rocket, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ONBOARDING_KEY = 'fsk-edu-onboarding-done';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const features = [
  {
    icon: MessageSquare,
    title: 'AI Teacher',
    description: 'Get instant, intelligent answers to any academic question from your AI tutor.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  {
    icon: Brain,
    title: 'Quizzes',
    description: 'Generate custom quizzes on any topic to test and reinforce your knowledge.',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
  },
  {
    icon: BookOpen,
    title: 'Flashcards',
    description: 'Create AI-powered flashcard decks and master subjects with spaced repetition.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    description: 'Stay productive with Pomodoro technique and track your study sessions.',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-100 dark:bg-teal-900/40',
  },
];

export function OnboardingOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only localStorage check
      setIsVisible(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
  };

  const handleNext = () => {
    if (step < 2) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={handleSkip}
        />

        {/* Overlay Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20"
          style={{
            background: 'linear-gradient(145deg, #064e3b 0%, #065f46 30%, #0d9488 70%, #0f766e 100%)',
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 w-32 h-32 bg-white/[0.04] rounded-full pointer-events-none" />

          {/* Skip button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={handleSkip}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all duration-200"
              aria-label="Skip onboarding"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 md:p-8 min-h-[380px] flex flex-col">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 1: Welcome */}
              {step === 0 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  {/* Logo */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg shadow-black/10 ring-1 ring-white/20"
                  >
                    <img
                      src="/fsk-logo.png"
                      alt="FSK EDU AI Logo"
                      className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-contain"
                    />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight"
                  >
                    Welcome to <span className="text-emerald-300">FSK EDU AI</span>!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-sm md:text-base text-emerald-100/80 leading-relaxed max-w-sm"
                  >
                    Your intelligent AI-powered study companion. Learn faster, study smarter, and achieve your academic goals with personalized assistance.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="flex items-center gap-2 mt-4"
                  >
                    <Rocket className="w-4 h-4 text-emerald-300" />
                    <span className="text-xs text-emerald-200/60 font-medium">Let&apos;s get you started</span>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 2: Features */}
              {step === 1 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col"
                >
                  <div className="text-center mb-5">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1.5 flex items-center justify-center gap-2">
                      <Target className="w-5 h-5 text-emerald-300" />
                      Key Features
                    </h2>
                    <p className="text-xs text-emerald-200/60">Everything you need for academic success</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {features.map((feature, i) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                      >
                        <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3.5 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all duration-200 group h-full">
                          <div className={`w-9 h-9 rounded-lg ${feature.bg} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-200`}>
                            <feature.icon className={`w-4.5 h-4.5 ${feature.color}`} />
                          </div>
                          <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                          <p className="text-[11px] text-emerald-100/60 leading-relaxed">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Tips */}
              {step === 2 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 rounded-2xl bg-emerald-400/20 flex items-center justify-center mb-5 ring-1 ring-emerald-400/20"
                  >
                    <Lightbulb className="w-8 h-8 text-emerald-300" />
                  </motion.div>

                  <h2 className="text-xl md:text-2xl font-bold text-white mb-5 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    Pro Tips
                  </h2>

                  <div className="w-full space-y-3 mb-6">
                    {/* Keyboard shortcuts callout */}
                    <motion.div
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 text-left"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <Keyboard className="w-4 h-4 text-emerald-300 shrink-0" />
                        <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
                      </div>
                      <p className="text-xs text-emerald-100/60 leading-relaxed">
                        Press <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1.5 rounded bg-white/15 border border-white/20 font-mono text-[10px] text-emerald-200 mx-0.5">?</kbd> anytime to see all available shortcuts. Navigate between tools instantly!
                      </p>
                    </motion.div>

                    {/* Press ? tip */}
                    <motion.div
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 text-left"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <ChevronRight className="w-4 h-4 text-teal-300 shrink-0" />
                        <h3 className="text-sm font-semibold text-white">Quick Tip</h3>
                      </div>
                      <p className="text-xs text-emerald-100/60 leading-relaxed">
                        Use <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1.5 rounded bg-white/15 border border-white/20 font-mono text-[10px] text-emerald-200 mx-0.5">Ctrl</kbd>
                        {' + '}
                        <kbd className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1.5 rounded bg-white/15 border border-white/20 font-mono text-[10px] text-emerald-200 mx-0.5">K</kbd> to quickly search the web for academic resources.
                      </p>
                    </motion.div>
                  </div>

                  {/* Start Learning Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleComplete}
                    className="w-full py-3.5 px-6 rounded-xl bg-white text-emerald-800 font-bold text-base shadow-lg shadow-black/10 hover:shadow-xl hover:bg-emerald-50 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Start Learning!
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                {/* Skip / Back */}
                <div>
                  {step > 0 ? (
                    <button
                      onClick={handlePrev}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors font-medium"
                    >
                      ← Back
                    </button>
                  ) : (
                    <button
                      onClick={handleSkip}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors font-medium"
                    >
                      Skip
                    </button>
                  )}
                </div>

                {/* Progress Dots */}
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i === step
                          ? 'w-7 h-2 bg-white'
                          : 'w-2 h-2 bg-white/30'
                      }`}
                    />
                  ))}
                </div>

                {/* Next / Get Started */}
                <div>
                  {step < 2 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 transition-colors font-semibold group"
                    >
                      Next
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
