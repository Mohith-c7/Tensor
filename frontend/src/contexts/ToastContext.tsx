import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { Toast, ToastVariant } from '../types/domain';

interface ShowToastOptions {
  variant: ToastVariant;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (options: ShowToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;
const AUTO_DISMISS_VARIANTS: ToastVariant[] = ['success', 'info'];
const AUTO_DISMISS_DELAY = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ShowToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = { id, ...options };

      setToasts((prev) => {
        const next = [...prev, toast];
        // Keep only the last MAX_VISIBLE toasts visible
        return next.slice(-MAX_VISIBLE);
      });

      if (AUTO_DISMISS_VARIANTS.includes(options.variant)) {
        const timer = setTimeout(() => dismissToast(id), AUTO_DISMISS_DELAY);
        timers.current.set(id, timer);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}
