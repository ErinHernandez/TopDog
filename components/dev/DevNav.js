/**
 * DevNav - Shared navigation component for testing grounds
 * 
 * Provides consistent navigation across all dev/testing pages:
 * - Compare with links
 * - Back/Forward browser navigation
 * - Draggable position (persisted to localStorage)
 * - Resizable panel (persisted to localStorage)
 * - Reorderable links (drag to reorder, persisted to localStorage)
 * - Dev login/logout controls (for testing auth states)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// ============================================================================
// AUTH HOOK (safe to use outside AuthProvider)
// ============================================================================

/**
 * Safe auth hook that works even outside AuthProvider
 * Returns null values if AuthProvider is not present
 */
function useSafeAuth() {
  const [authState, setAuthState] = useState({
    user: null,
    isAuthenticated: false,
    isAnonymous: false,
    isLoading: true,
  });
  
  useEffect(() => {
    // Dynamically import Firebase to avoid issues if not configured
    let unsubscribe = () => {};
    
    async function setupAuthListener() {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth');
        const auth = getAuth();
        
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setAuthState({
            user: user ? {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              isAnonymous: user.isAnonymous,
            } : null,
            isAuthenticated: !!user && !user.isAnonymous,
            isAnonymous: user?.isAnonymous ?? false,
            isLoading: false,
          });
        });
      } catch (error) {
        // Firebase not configured
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    }
    
    setupAuthListener();
    return () => unsubscribe();
  }, []);
  
  const signIn = useCallback(async (email, password) => {
    try {
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);
  
  const signOut = useCallback(async () => {
    try {
      const { getAuth, signOut: firebaseSignOut } = await import('firebase/auth');
      const auth = getAuth();
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);
  
  return { ...authState, signIn, signOut };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'devnav-position';
const MINIMIZED_KEY = 'devnav-minimized';
const SIZE_KEY = 'devnav-size';
const LINK_ORDER_KEY = 'devnav-link-order';
const DEV_AUTH_OVERRIDE_KEY = 'devnav-auth-override'; // 'logged-in' | 'logged-out' | null

// Default links configuration
// VX2 components are the current/active development - put them first
const DEFAULT_LINKS = [
  { id: 'vx2-shell', href: '/testing-grounds/vx2-mobile-app-demo', label: 'Mobile App (VX2)', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' },
  { id: 'vx2-lobby', href: '/testing-grounds/vx2-mobile-app-demo?tab=lobby', label: 'Lobby Tab (VX2)', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' },
  { id: 'vx2-draft', href: '/testing-grounds/vx2-draft-room', label: 'Draft Room (VX2)', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' },
  { id: 'slow-draft-sandbox', href: '/testing-grounds/slow-draft-sandbox', label: 'Slow Draft Sandbox', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' },
  { id: 'dynamic-island-sandbox', href: '/testing-grounds/dynamic-island-sandbox', label: 'Dynamic Island Sandbox', bgColor: '#D97706', bgColorActive: '#B45309', textColor: '#FDE68A' },
  { id: 'navbar-sandbox', href: '/testing-grounds/navbar-sandbox', label: 'Navbar Sandbox', bgColor: '#5B21B6', bgColorActive: '#4C1D95', textColor: '#C4B5FD' },
  { id: 'device-compare', href: '/testing-grounds/device-comparison', label: 'Device Comparison', bgColor: '#14B8A6', bgColorActive: '#0F766E', textColor: '#CCFBF1' },
  { id: 'join-modal-mobile', href: '/testing-grounds/join-tournament-modal-mobile', label: 'Join Modal (Mobile)', bgColor: '#14532D', bgColorActive: '#1F4D3A', textColor: '#86EFAC' },
  { id: 'auth-test', href: '/testing-grounds/vx2-auth-test', label: 'Auth Components Test', bgColor: '#065F46', bgColorActive: '#064E3B', textColor: '#A7F3D0' },
];

const MIN_WIDTH = 180;
const MIN_HEIGHT = 200;
const MAX_WIDTH = 500;
const MAX_HEIGHT = 800;

const DRAFT_CONTROLS_STORAGE_KEY = 'devnav-draft-controls';

// ============================================================================
// DRAFT CONTROLS SECTION
// ============================================================================

function DraftControlsSection() {
  const [draftState, setDraftState] = useState({
    status: 'waiting',
    isPaused: false,
    fastMode: false,
  });

  useEffect(() => {
    // Listen for draft state updates from the draft room page
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem(DRAFT_CONTROLS_STORAGE_KEY);
        if (stored) {
          setDraftState(JSON.parse(stored));
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Check initial state
    handleStorageChange();

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes (since same-tab updates don't trigger storage event)
    const interval = setInterval(handleStorageChange, 200);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleAction = (action) => {
    // Dispatch custom event that the draft room page listens to
    window.dispatchEvent(new CustomEvent('devnav-draft-action', { detail: action }));
  };

  const statusColor = 
    draftState.status === 'active' && !draftState.isPaused ? '#22C55E' :
    draftState.status === 'active' && draftState.isPaused ? '#F59E0B' :
    '#6B7280';

  const statusText = 
    draftState.status === 'active' && !draftState.isPaused ? 'Running' :
    draftState.status === 'active' && draftState.isPaused ? 'Paused' :
    draftState.status === 'waiting' ? 'Ready' :
    'Loading...';

  return (
    <div 
      style={{ 
        marginBottom: 12,
        paddingTop: 8,
        borderTop: '1px solid #374151',
        flexShrink: 0,
      }}
    >
      <div style={{ 
        fontSize: 10, 
        color: '#6B7280', 
        marginBottom: 6,
        fontWeight: 600,
      }}>
        DRAFT CONTROLS
      </div>

      {/* Status */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '6px 8px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        marginBottom: 8,
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColor,
        }} />
        <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 500 }}>
          {statusText}
        </span>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={() => handleAction(draftState.status !== 'active' ? 'start' : draftState.isPaused ? 'resume' : 'pause')}
          disabled={draftState.status === 'loading'}
          style={{
            width: '100%',
            padding: '8px 10px',
            backgroundColor: draftState.status !== 'active' ? '#10B981' : draftState.isPaused ? '#10B981' : '#4B5563',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 600,
            border: 'none',
            borderRadius: 6,
            cursor: draftState.status === 'loading' ? 'not-allowed' : 'pointer',
            opacity: draftState.status === 'loading' ? 0.5 : 1,
          }}
        >
          {draftState.status !== 'active' ? '▶ Start' : draftState.isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button
          onClick={() => handleAction('forcePick')}
          disabled={draftState.status !== 'active'}
          style={{
            width: '100%',
            padding: '8px 10px',
            backgroundColor: draftState.status === 'active' ? '#F97316' : '#374151',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 600,
            border: 'none',
            borderRadius: 6,
            cursor: draftState.status === 'active' ? 'pointer' : 'not-allowed',
            opacity: draftState.status === 'active' ? 1 : 0.4,
          }}
        >
          ⚡ Force Pick
        </button>

        <button
          onClick={() => handleAction('toggleSpeed')}
          style={{
            width: '100%',
            padding: '8px 10px',
            backgroundColor: draftState.fastMode ? '#8B5CF6' : '#1F2937',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 600,
            border: draftState.fastMode ? 'none' : '1px solid #374151',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {draftState.fastMode ? '⚡ Fast' : '🐢 Normal'}
        </button>

        <button
          onClick={() => handleAction('restart')}
          style={{
            width: '100%',
            padding: '8px 10px',
            backgroundColor: 'transparent',
            color: '#EF4444',
            fontSize: 11,
            fontWeight: 600,
            border: '1px solid #EF4444',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          🔄 Restart
        </button>
      </div>
    </div>
  );
}

export default function DevNav() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [position, setPosition] = useState({ x: null, y: null });
  const [size, setSize] = useState({ width: 200, height: null });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [devAuthOverride, setDevAuthOverride] = useState(null); // 'logged-in' | 'logged-out' | null
  const [linkOrder, setLinkOrder] = useState(DEFAULT_LINKS.map(l => l.id));
  const [draggedLinkId, setDraggedLinkId] = useState(null);
  const [dragOverLinkId, setDragOverLinkId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Safe auth hook (still used for display purposes)
  const { isLoading } = useSafeAuth();
  
  // Handle dev auth override toggle
  const handleDevAuthToggle = useCallback(() => {
    setDevAuthOverride(prev => {
      const newValue = prev === 'logged-in' ? 'logged-out' : 'logged-in';
      try {
        localStorage.setItem(DEV_AUTH_OVERRIDE_KEY, newValue);
        // Dispatch event for AuthGateVX2 to listen to
        window.dispatchEvent(new CustomEvent('devAuthOverrideChange', { detail: newValue }));
      } catch (e) {
        // Ignore localStorage errors
      }
      return newValue;
    });
  }, []);
  
  // Load saved state on mount
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem(STORAGE_KEY);
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      }
      const savedMinimized = localStorage.getItem(MINIMIZED_KEY);
      if (savedMinimized) {
        setIsMinimized(JSON.parse(savedMinimized));
      }
      const savedSize = localStorage.getItem(SIZE_KEY);
      if (savedSize) {
        setSize(JSON.parse(savedSize));
      }
      const savedLinkOrder = localStorage.getItem(LINK_ORDER_KEY);
      if (savedLinkOrder) {
        const parsed = JSON.parse(savedLinkOrder);
        // Merge with any new links that may have been added
        const existingIds = new Set(parsed);
        const newLinks = DEFAULT_LINKS.map(l => l.id).filter(id => !existingIds.has(id));
        setLinkOrder([...parsed, ...newLinks]);
      }
      // Load dev auth override
      const savedAuthOverride = localStorage.getItem(DEV_AUTH_OVERRIDE_KEY);
      if (savedAuthOverride) {
        setDevAuthOverride(savedAuthOverride);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);
  
  // Save position when it changes
  useEffect(() => {
    if (position.x !== null && position.y !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [position]);
  
  // Save minimized state when it changes
  useEffect(() => {
    try {
      localStorage.setItem(MINIMIZED_KEY, JSON.stringify(isMinimized));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [isMinimized]);
  
  // Save size when it changes
  useEffect(() => {
    if (size.width || size.height) {
      try {
        localStorage.setItem(SIZE_KEY, JSON.stringify(size));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [size]);
  
  // Save link order when it changes
  useEffect(() => {
    try {
      localStorage.setItem(LINK_ORDER_KEY, JSON.stringify(linkOrder));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [linkOrder]);
  
  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);
  
  // ============================================================================
  // DRAG HANDLING (for moving the panel)
  // ============================================================================
  
  const handleMouseDown = useCallback((e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
    e.preventDefault();
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 200);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 200);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
    
    if (isResizing && resizeDirection) {
      const deltaX = e.pageX - resizeStart.current.x;
      const deltaY = e.pageY - resizeStart.current.y;
      
      let newWidth = resizeStart.current.width;
      let newHeight = resizeStart.current.height;
      let newX = position.x;
      let newY = position.y;
      
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.current.width + deltaX));
      }
      if (resizeDirection.includes('w')) {
        const widthChange = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.current.width - deltaX)) - resizeStart.current.width;
        newWidth = resizeStart.current.width + widthChange;
        if (position.x !== null) {
          newX = resizeStart.current.posX - widthChange;
        }
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStart.current.height + deltaY));
      }
      if (resizeDirection.includes('n')) {
        const heightChange = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStart.current.height - deltaY)) - resizeStart.current.height;
        newHeight = resizeStart.current.height + heightChange;
        if (position.y !== null) {
          newY = resizeStart.current.posY - heightChange;
        }
      }
      
      setSize({ width: newWidth, height: newHeight });
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    }
  }, [isDragging, isResizing, resizeDirection, position]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  }, []);
  
  // ============================================================================
  // RESIZE HANDLING
  // ============================================================================
  
  const handleResizeStart = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    resizeStart.current = {
      x: e.pageX,
      y: e.pageY,
      width: rect?.width || 200,
      height: rect?.height || 400,
      posX: position.x,
      posY: position.y,
      scrollX,
      scrollY,
    };
    setIsResizing(true);
    setResizeDirection(direction);
  }, [position]);
  
  // Add/remove global mouse listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  // Reset position to default (bottom-right)
  const handleReset = useCallback(() => {
    setPosition({ x: null, y: null });
    setSize({ width: 200, height: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SIZE_KEY);
    } catch (e) {
      // Ignore
    }
  }, []);
  
  // Reset link order to default
  const handleResetOrder = useCallback(() => {
    setLinkOrder(DEFAULT_LINKS.map(l => l.id));
    try {
      localStorage.removeItem(LINK_ORDER_KEY);
    } catch (e) {
      // Ignore
    }
  }, []);
  
  // ============================================================================
  // LINK REORDERING (drag and drop)
  // ============================================================================
  
  const handleLinkDragStart = useCallback((e, linkId) => {
    setDraggedLinkId(linkId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', linkId);
  }, []);
  
  const handleLinkDragOver = useCallback((e, linkId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLinkId(linkId);
  }, []);
  
  const handleLinkDragLeave = useCallback(() => {
    setDragOverLinkId(null);
  }, []);
  
  const handleLinkDrop = useCallback((e, targetLinkId) => {
    e.preventDefault();
    
    if (!draggedLinkId || draggedLinkId === targetLinkId) {
      setDraggedLinkId(null);
      setDragOverLinkId(null);
      return;
    }
    
    setLinkOrder(prev => {
      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(draggedLinkId);
      const targetIndex = newOrder.indexOf(targetLinkId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedLinkId);
      
      return newOrder;
    });
    
    setDraggedLinkId(null);
    setDragOverLinkId(null);
  }, [draggedLinkId]);
  
  const handleLinkDragEnd = useCallback(() => {
    setDraggedLinkId(null);
    setDragOverLinkId(null);
  }, []);

  // Calculate style based on position
  // Use absolute positioning so it scrolls with the page
  const positionStyle = position.x !== null && position.y !== null
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : { bottom: '20px', right: '20px' };

  // Get ordered links
  const orderedLinks = linkOrder
    .map(id => DEFAULT_LINKS.find(l => l.id === id))
    .filter(Boolean);

  // Resize handle style
  const resizeHandleStyle = {
    position: 'absolute',
    background: 'transparent',
    zIndex: 10,
  };

  // Calculate actual dimensions for CSS variables (using document coordinates)
  const actualWidth = isMinimized ? 0 : (size.width || 200);
  const actualHeight = isMinimized ? 0 : (size.height || 400);

  // Update CSS variables for page padding calculation (using document coordinates)
  useEffect(() => {
    if (typeof document !== 'undefined' && containerRef.current) {
      const updateCSSVars = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          
          const navWidth = isMinimized ? 0 : rect.width;
          const navHeight = isMinimized ? 0 : rect.height;
          // Convert viewport coordinates to document coordinates
          const navX = rect.left + scrollX;
          const navY = rect.top + scrollY;
          const navRight = navX + navWidth;
          const navBottom = navY + navHeight;
          
          const docWidth = Math.max(
            document.body.scrollWidth,
            document.body.offsetWidth,
            document.documentElement.clientWidth,
            document.documentElement.scrollWidth,
            document.documentElement.offsetWidth
          );
          const docHeight = Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
          
          // Calculate which edges DevNav is near (within 50px threshold)
          const nearRight = navRight > docWidth - 50;
          const nearBottom = navBottom > docHeight - 50;
          const nearLeft = navX < 50;
          const nearTop = navY < 50;
          
          document.documentElement.style.setProperty('--devnav-width', `${navWidth}px`);
          document.documentElement.style.setProperty('--devnav-height', `${navHeight}px`);
          document.documentElement.style.setProperty('--devnav-x', `${navX}px`);
          document.documentElement.style.setProperty('--devnav-y', `${navY}px`);
          document.documentElement.style.setProperty('--devnav-right', `${navRight}px`);
          document.documentElement.style.setProperty('--devnav-bottom', `${navBottom}px`);
          document.documentElement.style.setProperty('--devnav-visible', isMinimized ? '0' : '1');
          document.documentElement.style.setProperty('--devnav-padding-right', nearRight ? `${navWidth + 20}px` : '0px');
          document.documentElement.style.setProperty('--devnav-padding-bottom', nearBottom ? `${navHeight + 20}px` : '0px');
          document.documentElement.style.setProperty('--devnav-padding-left', nearLeft ? `${navWidth + 20}px` : '0px');
          document.documentElement.style.setProperty('--devnav-padding-top', nearTop ? `${navHeight + 20}px` : '0px');
        }
      };
      
      // Update immediately
      updateCSSVars();
      
      // Update on resize and scroll
      window.addEventListener('resize', updateCSSVars);
      window.addEventListener('scroll', updateCSSVars, true);
      
      // Use ResizeObserver to track DevNav size changes
      const resizeObserver = new ResizeObserver(updateCSSVars);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      
      return () => {
        window.removeEventListener('resize', updateCSSVars);
        window.removeEventListener('scroll', updateCSSVars, true);
        resizeObserver.disconnect();
      };
    }
  }, [position, size, isMinimized, isDragging, isResizing]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        ...positionStyle,
        backgroundColor: '#1F2937',
        borderRadius: isMinimized ? 8 : 12,
        padding: isMinimized ? 8 : 16,
        paddingTop: 8,
        paddingBottom: isMinimized ? 8 : 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        zIndex: 9999,
        width: isMinimized ? 'auto' : (size.width || 200),
        minWidth: isMinimized ? 'auto' : MIN_WIDTH,
        maxWidth: MAX_WIDTH,
        height: isMinimized ? 'auto' : (size.height || 'auto'),
        minHeight: isMinimized ? 'auto' : MIN_HEIGHT,
        maxHeight: MAX_HEIGHT,
        userSelect: (isDragging || isResizing) ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Resize handles - only show when not minimized */}
      {!isMinimized && (
        <>
          {/* Corner handles */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            style={{ ...resizeHandleStyle, top: 0, left: 0, width: 12, height: 12, cursor: 'nw-resize' }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            style={{ ...resizeHandleStyle, top: 0, right: 0, width: 12, height: 12, cursor: 'ne-resize' }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            style={{ ...resizeHandleStyle, bottom: 0, left: 0, width: 12, height: 12, cursor: 'sw-resize' }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            style={{ ...resizeHandleStyle, bottom: 0, right: 0, width: 12, height: 12, cursor: 'se-resize' }}
          />
          {/* Edge handles */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            style={{ ...resizeHandleStyle, top: 0, left: 12, right: 12, height: 6, cursor: 'n-resize' }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 's')}
            style={{ ...resizeHandleStyle, bottom: 0, left: 12, right: 12, height: 6, cursor: 's-resize' }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            style={{ ...resizeHandleStyle, left: 0, top: 12, bottom: 12, width: 6, cursor: 'w-resize' }}
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            style={{ ...resizeHandleStyle, right: 0, top: 12, bottom: 12, width: 6, cursor: 'e-resize' }}
          />
          {/* Visual resize indicator at bottom-right */}
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 8,
              height: 8,
              opacity: 0.4,
              pointerEvents: 'none',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="#6B7280">
              <path d="M8 0v8H0L8 0z" />
            </svg>
          </div>
        </>
      )}
      
      {/* Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMinimized ? 0 : 8,
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '4px 0',
          flexShrink: 0,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {/* Grip icon */}
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="#6B7280"
            style={{ flexShrink: 0 }}
          >
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="9" r="1.5" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
          <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
            DEV NAV
          </span>
        </div>
        {/* Header buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Edit mode toggle */}
          {!isMinimized && (
            <button
              onClick={() => setIsEditMode(prev => !prev)}
              style={{
                background: isEditMode ? '#3B82F6' : 'none',
                border: 'none',
                color: isEditMode ? '#FFFFFF' : '#6B7280',
                fontSize: 10,
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: 4,
              }}
              title={isEditMode ? 'Done editing' : 'Reorder links'}
            >
              {isEditMode ? 'done' : 'edit'}
            </button>
          )}
          {/* Reset position button */}
          {position.x !== null && !isMinimized && (
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                fontSize: 10,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
              title="Reset to default position"
            >
              reset
            </button>
          )}
          {/* Minimize/Expand button */}
          <button
            onClick={toggleMinimized}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              fontSize: 14,
              cursor: 'pointer',
              padding: '2px 6px',
              lineHeight: 1,
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '+' : '-'}
          </button>
        </div>
      </div>
      
      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <>
          {/* Hide scrollbar styles */}
          <style>{`
            .devnav-links-scroll::-webkit-scrollbar {
              width: 0px !important;
              height: 0px !important;
              display: none !important;
            }
          `}</style>
          {/* Edit mode instructions */}
          {isEditMode && (
            <div style={{
              fontSize: 10,
              color: '#9CA3AF',
              marginBottom: 8,
              padding: '6px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 6,
              border: '1px dashed #3B82F6',
            }}>
              Drag links to reorder.
              <button
                onClick={handleResetOrder}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60A5FA',
                  fontSize: 10,
                  cursor: 'pointer',
                  marginLeft: 8,
                  textDecoration: 'underline',
                }}
              >
                Reset order
              </button>
            </div>
          )}
          
          {/* Compare with Links */}
          <div 
            style={{ 
              marginBottom: 12,
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE/Edge */
            }}
            className="devnav-links-scroll"
          >
            {orderedLinks.map((link) => (
              <div
                key={link.id}
                draggable={isEditMode}
                {...(isEditMode ? {
                  onDragStart: (e) => handleLinkDragStart(e, link.id),
                  onDragOver: (e) => handleLinkDragOver(e, link.id),
                  onDragLeave: handleLinkDragLeave,
                  onDrop: (e) => handleLinkDrop(e, link.id),
                  onDragEnd: handleLinkDragEnd,
                } : {})}
                style={{
                  marginBottom: 4,
                  opacity: draggedLinkId === link.id ? 0.5 : 1,
                  transform: dragOverLinkId === link.id ? 'translateY(2px)' : 'none',
                  transition: 'transform 0.1s ease',
                }}
              >
                <Link 
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 10px',
                    backgroundColor: router.pathname === link.href ? link.bgColorActive : link.bgColor,
                    color: link.textColor,
                    borderRadius: 6,
                    fontSize: 12,
                    textDecoration: 'none',
                    cursor: isEditMode ? 'grab' : 'pointer',
                    border: dragOverLinkId === link.id ? '2px dashed #3B82F6' : '2px solid transparent',
                  }}
                  onClick={(e) => {
                    if (isEditMode) {
                      e.preventDefault();
                    }
                  }}
                >
                  {isEditMode && (
                    <svg 
                      width="10" 
                      height="10" 
                      viewBox="0 0 10 10" 
                      fill="currentColor"
                      style={{ marginRight: 6, flexShrink: 0, opacity: 0.5 }}
                    >
                      <circle cx="2" cy="2" r="1" />
                      <circle cx="8" cy="2" r="1" />
                      <circle cx="2" cy="5" r="1" />
                      <circle cx="8" cy="5" r="1" />
                      <circle cx="2" cy="8" r="1" />
                      <circle cx="8" cy="8" r="1" />
                    </svg>
                  )}
                  {link.label}
                </Link>
              </div>
            ))}
          </div>
          
          {/* Draft Controls - Only show on draft room page */}
          {router.pathname === '/testing-grounds/vx2-draft-room' && (
            <DraftControlsSection />
          )}
          
          {/* Dev Auth Controls */}
          <div 
            style={{ 
              marginBottom: 12,
              paddingTop: 8,
              borderTop: '1px solid #374151',
              flexShrink: 0,
            }}
          >
            <div style={{ 
              fontSize: 10, 
              color: '#6B7280', 
              marginBottom: 6,
              fontWeight: 600,
            }}>
              AUTH (DEV)
            </div>
            
            {/* Dev Auth Toggle */}
            <button 
              onClick={handleDevAuthToggle}
              aria-label={devAuthOverride === 'logged-in' ? 'Toggle to logged out' : 'Toggle to logged in'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 6,
                cursor: 'pointer',
                userSelect: 'none',
                width: '100%',
                border: 'none',
              }}
            >
              <span style={{ 
                fontSize: 11, 
                color: devAuthOverride === 'logged-in' ? '#10B981' : '#EF4444',
                fontWeight: 500,
              }}>
                {isLoading ? 'Loading...' : devAuthOverride === 'logged-in' ? 'Logged In' : 'Logged Out'}
              </span>
              
              {/* Toggle Switch */}
              <div style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                backgroundColor: devAuthOverride === 'logged-in' ? '#065F46' : '#374151',
                position: 'relative',
                transition: 'background-color 0.2s ease',
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: devAuthOverride === 'logged-in' ? '#10B981' : '#6B7280',
                  position: 'absolute',
                  top: 2,
                  left: devAuthOverride === 'logged-in' ? 18 : 2,
                  transition: 'left 0.2s ease, background-color 0.2s ease',
                }} />
              </div>
            </button>
          </div>
          
          {/* Browser Navigation */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 24,
              paddingTop: 4,
              paddingBottom: 0,
              borderTop: '1px solid #374151',
              flexShrink: 0,
            }}
          >
            <button 
              onClick={() => router.back()}
              style={{
                backgroundColor: 'transparent',
                color: '#D1D5DB',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              title="Go back"
            >
              &lt;
            </button>
            <button 
              onClick={() => window.history.forward()}
              style={{
                backgroundColor: 'transparent',
                color: '#D1D5DB',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              title="Go forward"
            >
              &gt;
            </button>
          </div>
        </>
      )}
    </div>
  );
}
