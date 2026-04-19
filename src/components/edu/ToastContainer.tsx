'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Info, AlertTriangle, X
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const toastStyles: Record<string, { icon: React.ElementType; border: string; iconColor: string; bg: string }> = {
  success: {
    icon: CheckCircle2,
    border: 'border-l-emerald-500',
    iconColor: 'text-emerald-500',
    bg: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    border: 'border-l-rose-500',
    iconColor: 'text-rose-500',
    bg: 'bg-rose-500',
  },
  info: {
    icon: Info,
    border: 'border-l-sky-500',
    iconColor: 'text-sky-500',
    bg: 'bg-sky-500',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-l-amber-500',
    iconColor: 'text-amber-500',
    bg: 'bg-amber-500',
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: { id: string; title: string; description?: string; type: 'success' | 'error' | 'info' | 'warning'; duration?: number };
  onRemove: (id: string) => void;
}) {
  const style = toastStyles[toast.type] || toastStyles.info;
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`pointer-events-auto flex items-start gap-3 w-80 p-3.5 rounded-xl shadow-lg border border-border/50 border-l-[3px] ${style.border} bg-background/90 backdrop-blur-xl`}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg ${style.bg}/10 flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${style.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 transition-all shrink-0 mt-0.5"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col-reverse gap-2 pointer-events-none max-h-[calc(100vh-2rem)] overflow-hidden">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
