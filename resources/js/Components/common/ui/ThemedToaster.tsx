import { useTheme } from '@/Hooks/useTheme';
import { useEffect, useRef } from 'react';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';

const MAX_VISIBLE = 3;

export default function ThemedToaster() {
  const { actualTheme } = useTheme();
  const { toasts } = useToasterStore();
  const dismissingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const visible = toasts.filter((t) => t.visible);
    if (visible.length <= MAX_VISIBLE) return;

    // dismiss oldest ones beyond the limit, skip already-dismissing
    visible
      .slice(0, visible.length - MAX_VISIBLE)
      .filter((t) => !dismissingRef.current.has(t.id))
      .forEach((t) => {
        dismissingRef.current.add(t.id);
        toast.dismiss(t.id);
        // clean up ref after animation
        setTimeout(() => dismissingRef.current.delete(t.id), 1000);
      });
  });

  const isDark = actualTheme === 'dark';

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerStyle={{ top: 16, right: 16 }}
      toastOptions={{
        duration: 3000,
        style: {
          maxWidth: '400px',
          padding: '10px 18px',
          borderRadius: '7px',
          fontSize: '14px',
          fontWeight: 500,
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
          background: isDark ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: isDark ? '#ffffff' : '#000000',
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? '0 10px 30px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 10px 30px -10px rgba(0,0,0,0.1)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: isDark ? '#000' : '#fff',
          },
        },
        error: {
          duration: 4000,
          style: {
            fontWeight: 600,
            border: isDark
              ? '1px solid rgba(239, 68, 68, 0.2)'
              : '1px solid rgba(239, 68, 68, 0.1)',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#000' : '#fff',
          },
        },
        loading: {
          iconTheme: {
            primary: '#f59e0b',
            secondary: isDark ? '#000' : '#fff',
          },
        },
      }}
    />
  );
}
