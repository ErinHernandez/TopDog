/**
 * DevNav V2 - Developer Navigation Panel
 *
 * Premium dark navy design matching TopDog's aesthetic.
 * Features keyboard toggle (backtick), draggable positioning,
 * and organized link categories.
 */

import { useRouter } from 'next/router';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import { NAV_LINKS, CATEGORY_LABELS, DevNavCategory } from './devnav.constants';
import {
  DevNavPosition,
  DraftControlState,
  DraftControlAction,
  DevAuthOverride,
  STORAGE_KEYS,
  KEYBOARD_SHORTCUTS,
} from './devnav.types';
import styles from './DevNavV2.module.css';

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Safe auth hook that works even outside AuthProvider
 */
function useSafeAuth() {
  const [authState, setAuthState] = useState({
    user: null as any,
    isAuthenticated: false,
    isAnonymous: false,
    isLoading: true,
  });

  useEffect(() => {
    let unsubscribe = () => {};

    async function setupAuthListener() {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const auth = getAuth();

        unsubscribe = onAuthStateChanged(auth, user => {
          setAuthState({
            user: user
              ? {
                  uid: user.uid,
                  email: user.email,
                  displayName: user.displayName,
                  isAnonymous: user.isAnonymous,
                }
              : null,
            isAuthenticated: !!user && !user.isAnonymous,
            isAnonymous: user?.isAnonymous ?? false,
            isLoading: false,
          });
        });
      } catch {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    }

    setupAuthListener();
    return () => unsubscribe();
  }, []);

  return authState;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Collapsed state - minimal pill
 */
function CollapsedView({
  onExpand,
  onStartDrag,
  isDragging,
}: {
  onExpand: () => void;
  onStartDrag: (e: React.MouseEvent) => void;
  isDragging: boolean;
}) {
  return (
    <div
      className={`${styles.collapsed} ${isDragging ? styles.dragging : ''}`}
      onMouseDown={onStartDrag}
      onClick={e => {
        if (!isDragging) {
          e.stopPropagation();
          onExpand();
        }
      }}
    >
      <div className={styles.collapsedGrip}>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <span className={styles.collapsedLabel}>DEV</span>
      <span className={styles.collapsedHint}>`</span>
    </div>
  );
}

/**
 * Section with title and children
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

/**
 * Draft Controls - only shown on draft room page
 */
function DraftControls({
  state,
  onAction,
}: {
  state: DraftControlState;
  onAction: (action: DraftControlAction) => void;
}) {
  const statusClass =
    state.status === 'active' && !state.isPaused
      ? styles.draftStatusDotActive
      : state.status === 'active' && state.isPaused
        ? styles.draftStatusDotPaused
        : styles.draftStatusDotInactive;

  const statusText =
    state.status === 'active' && !state.isPaused
      ? 'Running'
      : state.status === 'active' && state.isPaused
        ? 'Paused'
        : state.status === 'waiting'
          ? 'Ready'
          : 'Loading...';

  return (
    <div className={styles.draftControls}>
      <div className={styles.draftStatus}>
        <div className={`${styles.draftStatusDot} ${statusClass}`} />
        <span className={styles.draftStatusText}>{statusText}</span>
      </div>

      <div className={styles.draftButtons}>
        <button
          className={`${styles.draftButton} ${styles.draftButtonPrimary} ${
            state.status === 'loading' ? styles.draftButtonDisabled : ''
          }`}
          onClick={() =>
            onAction(state.status !== 'active' ? 'start' : state.isPaused ? 'resume' : 'pause')
          }
          disabled={state.status === 'loading'}
        >
          {state.status !== 'active' ? '▶ Start' : state.isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button
          className={`${styles.draftButton} ${styles.draftButtonWarning} ${
            state.status !== 'active' ? styles.draftButtonDisabled : ''
          }`}
          onClick={() => onAction('forcePick')}
          disabled={state.status !== 'active'}
        >
          ⚡ Force Pick
        </button>

        <button
          className={`${styles.draftButton} ${
            state.fastMode ? styles.draftButtonPrimary : styles.draftButtonSecondary
          }`}
          onClick={() => onAction('toggleSpeed')}
        >
          {state.fastMode ? '⚡ Fast Mode' : '🐢 Normal Speed'}
        </button>

        <button
          className={`${styles.draftButton} ${styles.draftButtonDanger}`}
          onClick={() => onAction('restart')}
        >
          🔄 Restart
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function DevNavV2() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoading } = useSafeAuth();

  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<DevNavPosition>({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [devAuthOverride, setDevAuthOverride] = useState<DevAuthOverride>(null);
  const [draftState, setDraftState] = useState<DraftControlState>({
    status: 'waiting',
    isPaused: false,
    fastMode: false,
  });

  const dragOffset = useRef({ x: 0, y: 0 });

  // ============================================================================
  // Persistence
  // ============================================================================

  // Load saved state
  useEffect(() => {
    try {
      const savedExpanded = localStorage.getItem(STORAGE_KEYS.expanded);
      if (savedExpanded) setIsExpanded(JSON.parse(savedExpanded));

      const savedPosition = localStorage.getItem(STORAGE_KEYS.position);
      if (savedPosition) setPosition(JSON.parse(savedPosition));

      const savedAuthOverride = localStorage.getItem(STORAGE_KEYS.authOverride);
      if (savedAuthOverride) setDevAuthOverride(savedAuthOverride as DevAuthOverride);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save expanded state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.expanded, JSON.stringify(isExpanded));
    } catch {
      // Ignore
    }
  }, [isExpanded]);

  // Save position
  useEffect(() => {
    if (position.x !== null && position.y !== null) {
      try {
        localStorage.setItem(STORAGE_KEYS.position, JSON.stringify(position));
      } catch {
        // Ignore
      }
    }
  }, [position]);

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Backtick toggles
      if (e.key === KEYBOARD_SHORTCUTS.toggle) {
        e.preventDefault();
        setIsExpanded(prev => !prev);
        return;
      }

      // Ctrl/Cmd + Shift + D toggles
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === KEYBOARD_SHORTCUTS.toggleAlt
      ) {
        e.preventDefault();
        setIsExpanded(prev => !prev);
        return;
      }

      // Escape minimizes when expanded
      if (e.key === KEYBOARD_SHORTCUTS.minimize && isExpanded) {
        e.preventDefault();
        setIsExpanded(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // ============================================================================
  // Draft Controls Sync
  // ============================================================================

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.draftControls);
        if (stored) setDraftState(JSON.parse(stored));
      } catch {
        // Ignore
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 200);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleDraftAction = useCallback((action: DraftControlAction) => {
    window.dispatchEvent(new CustomEvent('devnav-draft-action', { detail: action }));
  }, []);

  // ============================================================================
  // Auth Toggle
  // ============================================================================

  const handleAuthToggle = useCallback(() => {
    setDevAuthOverride(prev => {
      const newValue = prev === 'logged-in' ? 'logged-out' : 'logged-in';
      try {
        localStorage.setItem(STORAGE_KEYS.authOverride, newValue);
        window.dispatchEvent(new CustomEvent('devAuthOverrideChange', { detail: newValue }));
      } catch {
        // Ignore
      }
      return newValue;
    });
  }, []);

  // ============================================================================
  // Dragging
  // ============================================================================

  const handleStartDrag = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;

      const maxX = window.innerWidth - containerRef.current.offsetWidth;
      const maxY = window.innerHeight - containerRef.current.offsetHeight;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ============================================================================
  // Render Helpers
  // ============================================================================

  // Group links by category
  const linksByCategory = NAV_LINKS.reduce(
    (acc, link) => {
      if (!acc[link.category]) acc[link.category] = [];
      const categoryLinks = acc[link.category];
      if (categoryLinks) {
        categoryLinks.push(link);
      }
      return acc;
    },
    {} as Record<DevNavCategory, typeof NAV_LINKS>,
  );

  // Position style
  const positionStyle: React.CSSProperties =
    position.x !== null && position.y !== null
      ? { left: position.x, top: position.y }
      : { bottom: 20, right: 20 };

  const isOnDraftPage = router.pathname === '/testing-grounds/vx2-draft-room';

  // ============================================================================
  // Render
  // ============================================================================

  if (!isExpanded) {
    return (
      <div ref={containerRef} className={styles.container} style={positionStyle}>
        <CollapsedView
          onExpand={() => setIsExpanded(true)}
          onStartDrag={handleStartDrag}
          isDragging={isDragging}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${styles.expanded} ${isDragging ? styles.dragging : ''}`}
      style={positionStyle}
    >
      {/* Header */}
      <div className={styles.header} onMouseDown={handleStartDrag}>
        <div className={styles.headerLeft}>
          <div className={styles.headerGrip}>
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className={styles.headerTitle}>DEVELOPER TOOLS</span>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.headerButton}
            onClick={() => setIsExpanded(false)}
            title="Minimize (` or Esc)"
          >
            −
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Navigation Links */}
        {(Object.keys(linksByCategory) as DevNavCategory[]).map(category => (
          <Section key={category} title={CATEGORY_LABELS[category]}>
            <div className={styles.linksList}>
              {linksByCategory[category].map(link => (
                <a
                  key={link.id}
                  href={link.href}
                  className={`${styles.linkItem} ${
                    router.asPath === link.href ? styles.linkItemActive : ''
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </Section>
        ))}

        <div className={styles.divider} />

        {/* Auth Toggle */}
        <Section title="AUTH STATE">
          <div className={styles.authSection}>
            <div className={styles.authRow}>
              <span
                className={`${styles.authLabel} ${
                  devAuthOverride === 'logged-in'
                    ? styles.authLabelLoggedIn
                    : styles.authLabelLoggedOut
                }`}
              >
                {isLoading
                  ? 'Loading...'
                  : devAuthOverride === 'logged-in'
                    ? 'Logged In'
                    : 'Logged Out'}
              </span>
              <button
                className={`${styles.authToggle} ${
                  devAuthOverride === 'logged-in' ? styles.authToggleOn : ''
                }`}
                onClick={handleAuthToggle}
                aria-label="Toggle auth state"
              >
                <div className={styles.authToggleKnob} />
              </button>
            </div>
          </div>
        </Section>

        {/* Draft Controls - only on draft page */}
        {isOnDraftPage && (
          <>
            <div className={styles.divider} />
            <Section title="DRAFT CONTROLS">
              <DraftControls state={draftState} onAction={handleDraftAction} />
            </Section>
          </>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.browserNav}>
          <button className={styles.navButton} onClick={() => router.back()} title="Go back">
            ‹
          </button>
          <button
            className={styles.navButton}
            onClick={() => window.history.forward()}
            title="Go forward"
          >
            ›
          </button>
        </div>
        <div className={styles.keyboardHint}>
          Press <span className={styles.keyboardHintKey}>`</span> to toggle
        </div>
      </div>
    </div>
  );
}
