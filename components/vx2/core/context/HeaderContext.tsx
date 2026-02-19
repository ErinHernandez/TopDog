/**
 * VX2 Header Context
 * 
 * Allows child components to control the app header state,
 * such as showing/hiding the back button when in detail views.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface HeaderState {
  /** Whether to show the back button */
  showBackButton: boolean;
  /** Callback when back button is clicked */
  onBackClick: (() => void) | null;
}

interface HeaderContextValue {
  state: HeaderState;
  /** Set whether to show back button */
  setShowBackButton: (show: boolean, onBack?: () => void) => void;
  /** Clear back button state */
  clearBackButton: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const HeaderContext = createContext<HeaderContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface HeaderProviderProps {
  children: React.ReactNode;
}

export function HeaderProvider({ children }: HeaderProviderProps): React.ReactElement {
  const [state, setState] = useState<HeaderState>({
    showBackButton: false,
    onBackClick: null,
  });

  const setShowBackButton = useCallback((show: boolean, onBack?: () => void) => {
    setState({
      showBackButton: show,
      onBackClick: onBack || null,
    });
  }, []);

  const clearBackButton = useCallback(() => {
    setState({
      showBackButton: false,
      onBackClick: null,
    });
  }, []);

  const value = useMemo<HeaderContextValue>(() => ({
    state,
    setShowBackButton,
    clearBackButton,
  }), [state, setShowBackButton, clearBackButton]);

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useHeader(): HeaderContextValue {
  const context = useContext(HeaderContext);
  
  if (!context) {
    throw new Error(
      'useHeader must be used within a HeaderProvider. ' +
      'Make sure your component is wrapped in <HeaderProvider>.'
    );
  }
  
  return context;
}

export { HeaderContext };

