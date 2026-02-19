'use client';

/**
 * Idesaign — ARIA Live Region Component
 *
 * Provides a visually-hidden live region for screen reader announcements.
 * Automatically clears message after a delay to allow re-announcement of
 * the same text on subsequent calls.
 *
 * Also exports a context-based useAnnounce hook for convenient global announcements
 * from anywhere in the app.
 *
 * @module lib/a11y/AriaLive
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
  useMemo,
  type ReactNode,
} from 'react';
import styles from './AriaLive.module.css';

/* ================================================================
   Types
   ================================================================ */

/** Props for AriaLive component */
export interface AriaLiveProps {
  /** Message to announce */
  message: string;

  /** ARIA live region politeness level */
  politeness?: 'polite' | 'assertive';

  /** Clear message after this many milliseconds (default: 1000) */
  clearAfterMs?: number;
}

/** Context value for useAnnounce hook */
interface AriaLiveContextValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

/* ================================================================
   AriaLive Component
   ================================================================ */

/**
 * Renders a visually-hidden div with aria-live and role="status".
 * Automatically clears the message after a delay.
 *
 * @example
 * ```tsx
 * const [message, setMessage] = useState('');
 *
 * const handleSave = () => {
 *   // perform save
 *   setMessage('File saved successfully');
 * };
 *
 * return (
 *   <>
 *     <AriaLive message={message} politeness="polite" clearAfterMs={2000} />
 *     <button onClick={handleSave}>Save</button>
 *   </>
 * );
 * ```
 */
export function AriaLive({
  message,
  politeness = 'polite',
  clearAfterMs = 1000,
}: AriaLiveProps) {
  const [displayMessage, setDisplayMessage] = useState(message);

  useEffect(() => {
    if (!message) return;

    setDisplayMessage(message);

    const timerId = setTimeout(() => {
      setDisplayMessage('');
    }, clearAfterMs);

    return () => clearTimeout(timerId);
  }, [message, clearAfterMs]);

  return (
    <div
      className={styles.ariaLive}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
    >
      {displayMessage}
    </div>
  );
}

/* ================================================================
   Context & Hook
   ================================================================ */

const AriaLiveContext = createContext<AriaLiveContextValue | null>(null);
AriaLiveContext.displayName = 'AriaLiveContext';

interface AriaLiveProviderProps {
  children: ReactNode;
}

/**
 * Provider component for useAnnounce hook.
 * Wraps the app (usually in _app.tsx after AuthProvider).
 *
 * @example
 * ```tsx
 * export default function IdesaignApp({ Component, pageProps }: AppProps) {
 *   return (
 *     <AppErrorBoundary>
 *       <AuthProvider>
 *         <AriaLiveProvider>
 *           <Component {...pageProps} />
 *         </AriaLiveProvider>
 *       </AuthProvider>
 *     </AppErrorBoundary>
 *   );
 * }
 * ```
 */
export function AriaLiveProvider({ children }: AriaLiveProviderProps) {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite');

  const announce = useCallback(
    (newMessage: string, newPoliteness: 'polite' | 'assertive' = 'polite') => {
      setPoliteness(newPoliteness);
      setMessage(newMessage);
    },
    [],
  );

  const value = useMemo<AriaLiveContextValue>(() => ({ announce }), [announce]);

  return (
    <AriaLiveContext.Provider value={value}>
      <AriaLive message={message} politeness={politeness} clearAfterMs={1000} />
      {children}
    </AriaLiveContext.Provider>
  );
}

/**
 * Hook to announce messages to screen readers from anywhere in the app.
 * Must be used within an AriaLiveProvider.
 *
 * @example
 * ```tsx
 * const announce = useAnnounce();
 *
 * const handleDelete = () => {
 *   deleteItem(id);
 *   announce('Item deleted', 'polite');
 * };
 * ```
 *
 * @throws Error if used outside AriaLiveProvider
 */
export function useAnnounce(): (message: string, politeness?: 'polite' | 'assertive') => void {
  const ctx = useContext(AriaLiveContext);

  if (!ctx) {
    throw new Error('useAnnounce must be used within <AriaLiveProvider>');
  }

  return ctx.announce;
}
