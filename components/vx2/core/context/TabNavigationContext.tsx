/**
 * VX2 Tab Navigation Context
 * 
 * Enterprise-grade tab navigation system with:
 * - Centralized state management
 * - History tracking with back/forward
 * - State preservation across tab switches
 * - Deep linking support
 * - Analytics hooks
 */

import React, { 
  createContext, 
  useReducer, 
  useCallback, 
  useMemo, 
  useEffect,
  useRef,
} from 'react';
import type { 
  TabId,
  TabConfig,
  TabNavigationState, 
  TabNavigationAction,
  TabNavigationContextValue,
  TabPersistedState,
} from '../types';
import { 
  TAB_REGISTRY, 
  TAB_ORDER, 
  DEFAULT_TAB,
  getTabFromPath,
} from '../constants';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: TabNavigationState = {
  activeTab: DEFAULT_TAB,
  previousTab: null,
  history: [{
    tabId: DEFAULT_TAB,
    timestamp: Date.now(),
  }],
  historyIndex: 0,
  tabStates: {},
  isTransitioning: false,
  deepLinkParams: null,
  preloadedTabs: new Set([DEFAULT_TAB]),
};

// ============================================================================
// REDUCER
// ============================================================================

function tabNavigationReducer(
  state: TabNavigationState,
  action: TabNavigationAction
): TabNavigationState {
  switch (action.type) {
    case 'NAVIGATE_TO_TAB': {
      const { tabId, params, addToHistory = true } = action.payload;
      
      // Don't navigate to same tab without params change
      if (tabId === state.activeTab && !params) {
        return state;
      }
      
      // Create new history entry
      const newHistoryEntry = {
        tabId,
        timestamp: Date.now(),
        params,
        scrollPosition: state.tabStates[state.activeTab]?.scrollPosition,
      };
      
      // If navigating normally, truncate forward history and add new entry
      let newHistory = state.history;
      let newHistoryIndex = state.historyIndex;
      
      if (addToHistory) {
        // Truncate any forward history
        newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(newHistoryEntry);
        newHistoryIndex = newHistory.length - 1;
        
        // Keep history manageable (last 50 entries)
        if (newHistory.length > 50) {
          newHistory = newHistory.slice(-50);
          newHistoryIndex = newHistory.length - 1;
        }
      }
      
      return {
        ...state,
        previousTab: state.activeTab,
        activeTab: tabId,
        history: newHistory,
        historyIndex: newHistoryIndex,
        deepLinkParams: params || null,
        isTransitioning: true,
      };
    }
    
    case 'REPLACE_TAB': {
      const { tabId, params } = action.payload;
      
      // Replace current history entry instead of adding new one
      const newHistory = [...state.history];
      newHistory[state.historyIndex] = {
        tabId,
        timestamp: Date.now(),
        params,
      };
      
      return {
        ...state,
        previousTab: state.activeTab,
        activeTab: tabId,
        history: newHistory,
        deepLinkParams: params || null,
        isTransitioning: true,
      };
    }
    
    case 'GO_BACK': {
      if (state.historyIndex <= 0) {
        return state;
      }
      
      const newIndex = state.historyIndex - 1;
      const previousEntry = state.history[newIndex];
      
      return {
        ...state,
        previousTab: state.activeTab,
        activeTab: previousEntry.tabId,
        historyIndex: newIndex,
        deepLinkParams: previousEntry.params || null,
        isTransitioning: true,
      };
    }
    
    case 'GO_FORWARD': {
      if (state.historyIndex >= state.history.length - 1) {
        return state;
      }
      
      const newIndex = state.historyIndex + 1;
      const nextEntry = state.history[newIndex];
      
      return {
        ...state,
        previousTab: state.activeTab,
        activeTab: nextEntry.tabId,
        historyIndex: newIndex,
        deepLinkParams: nextEntry.params || null,
        isTransitioning: true,
      };
    }
    
    case 'SET_DEEP_LINK_PARAMS':
      return {
        ...state,
        deepLinkParams: action.payload,
      };
    
    case 'CLEAR_DEEP_LINK_PARAMS':
      return {
        ...state,
        deepLinkParams: null,
      };
    
    case 'SAVE_TAB_STATE': {
      const { tabId, state: tabState } = action.payload;
      
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [tabId]: {
            ...state.tabStates[tabId],
            ...tabState,
            lastVisited: Date.now(),
          } as TabPersistedState,
        },
      };
    }
    
    case 'CLEAR_TAB_STATE': {
      const newTabStates = { ...state.tabStates };
      delete newTabStates[action.payload];
      
      return {
        ...state,
        tabStates: newTabStates,
      };
    }
    
    case 'SET_TRANSITIONING':
      return {
        ...state,
        isTransitioning: action.payload,
      };
    
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [{
          tabId: state.activeTab,
          timestamp: Date.now(),
        }],
        historyIndex: 0,
      };
    
    case 'MARK_TAB_PRELOADED': {
      const newPreloaded = new Set(state.preloadedTabs);
      newPreloaded.add(action.payload);
      
      return {
        ...state,
        preloadedTabs: newPreloaded,
      };
    }
    
    case 'RESET_NAVIGATION':
      return initialState;
    
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

export const TabNavigationContext = createContext<TabNavigationContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface TabNavigationProviderProps {
  children: React.ReactNode;
  /** Initial tab override (for testing or deep links) */
  initialTab?: TabId;
  /** Callback when tab changes (for analytics, URL sync, etc.) */
  onTabChange?: (fromTab: TabId | null, toTab: TabId) => void;
}

export function TabNavigationProvider({
  children,
  initialTab,
  onTabChange,
}: TabNavigationProviderProps): React.ReactElement {
  const logData = {location:'TabNavigationContext.tsx:253',message:'TabNavigationProvider initializing',data:{initialTab,hasOnTabChange:!!onTabChange},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'};
  console.warn('[VX2 DEBUG] TabNavigationProvider initializing', logData);
  // Initialize state with optional override
  const [state, dispatch] = useReducer(
    tabNavigationReducer,
    initialTab ? { ...initialState, activeTab: initialTab } : initialState
  );
  
  const logData2 = {location:'TabNavigationContext.tsx:261',message:'TabNavigationProvider state initialized',data:{activeTab:state.activeTab,historyLength:state.history.length,tabStatesCount:Object.keys(state.tabStates).length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'};
  console.log('[DEBUG]', logData2);
  
  // Track previous tab for change callbacks
  const prevTabRef = useRef<TabId | null>(null);
  
  // Call onTabChange when tab changes
  useEffect(() => {
    if (prevTabRef.current !== state.activeTab) {
      const logData3 = {location:'TabNavigationContext.tsx:269',message:'Tab change detected',data:{fromTab:prevTabRef.current,toTab:state.activeTab,isTransitioning:state.isTransitioning},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'};
      console.log('[DEBUG]', logData3);
      onTabChange?.(prevTabRef.current, state.activeTab);
      prevTabRef.current = state.activeTab;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- state.isTransitioning check handled inside effect
  }, [state.activeTab, onTabChange]);
  
  // Clear transitioning state after animation
  useEffect(() => {
    if (state.isTransitioning) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_TRANSITIONING', payload: false });
      }, 150); // Match transition duration
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.isTransitioning]);
  
  // ========== Navigation Actions ==========
  
  const navigateToTab = useCallback((tabId: TabId, params?: Record<string, string>) => {
    dispatch({ 
      type: 'NAVIGATE_TO_TAB', 
      payload: { tabId, params, addToHistory: true } 
    });
  }, [state.activeTab]);
  
  const replaceTab = useCallback((tabId: TabId, params?: Record<string, string>) => {
    dispatch({ 
      type: 'REPLACE_TAB', 
      payload: { tabId, params } 
    });
  }, []);
  
  const goBack = useCallback((): boolean => {
    if (state.historyIndex > 0) {
      dispatch({ type: 'GO_BACK' });
      return true;
    }
    return false;
  }, [state.historyIndex]);
  
  const goForward = useCallback((): boolean => {
    if (state.historyIndex < state.history.length - 1) {
      dispatch({ type: 'GO_FORWARD' });
      return true;
    }
    return false;
  }, [state.historyIndex, state.history.length]);
  
  // ========== Tab State Management ==========
  
  const saveTabState = useCallback((tabId: TabId, tabState: Partial<TabPersistedState>) => {
    dispatch({ 
      type: 'SAVE_TAB_STATE', 
      payload: { tabId, state: tabState } 
    });
  }, []);
  
  const getTabState = useCallback((tabId: TabId): TabPersistedState | undefined => {
    return state.tabStates[tabId];
  }, [state.tabStates]);
  
  const clearTabState = useCallback((tabId: TabId) => {
    dispatch({ type: 'CLEAR_TAB_STATE', payload: tabId });
  }, []);
  
  // ========== Deep Linking ==========
  
  const setDeepLinkParams = useCallback((params: Record<string, string> | null) => {
    dispatch({ type: 'SET_DEEP_LINK_PARAMS', payload: params });
  }, []);
  
  const clearDeepLinkParams = useCallback(() => {
    dispatch({ type: 'CLEAR_DEEP_LINK_PARAMS' });
  }, []);
  
  // ========== Registry Access ==========
  
  const getTabConfig = useCallback((tabId: TabId): TabConfig => {
    return TAB_REGISTRY[tabId];
  }, []);
  
  const getAllTabs = useCallback((): TabConfig[] => {
    return TAB_ORDER.map(id => TAB_REGISTRY[id]);
  }, []);
  
  const getTabByPath = useCallback((path: string): TabConfig | undefined => {
    const tabId = getTabFromPath(path);
    return tabId ? TAB_REGISTRY[tabId] : undefined;
  }, []);
  
  // ========== Utilities ==========
  
  const isActiveTab = useCallback((tabId: TabId): boolean => {
    return state.activeTab === tabId;
  }, [state.activeTab]);
  
  const canGoBack = useCallback((): boolean => {
    return state.historyIndex > 0;
  }, [state.historyIndex]);
  
  const canGoForward = useCallback((): boolean => {
    return state.historyIndex < state.history.length - 1;
  }, [state.historyIndex, state.history.length]);
  
  // ========== Preloading ==========
  
  const preloadTab = useCallback((tabId: TabId) => {
    if (!state.preloadedTabs.has(tabId)) {
      // Trigger lazy load
      TAB_REGISTRY[tabId].lazyComponent();
      dispatch({ type: 'MARK_TAB_PRELOADED', payload: tabId });
    }
  }, [state.preloadedTabs]);
  
  const isTabPreloaded = useCallback((tabId: TabId): boolean => {
    return state.preloadedTabs.has(tabId);
  }, [state.preloadedTabs]);
  
  // ========== Context Value ==========
  
  const value = useMemo<TabNavigationContextValue>(() => ({
    state,
    navigateToTab,
    replaceTab,
    goBack,
    goForward,
    saveTabState,
    getTabState,
    clearTabState,
    setDeepLinkParams,
    clearDeepLinkParams,
    getTabConfig,
    getAllTabs,
    getTabByPath,
    isActiveTab,
    canGoBack,
    canGoForward,
    preloadTab,
    isTabPreloaded,
  }), [
    state,
    navigateToTab,
    replaceTab,
    goBack,
    goForward,
    saveTabState,
    getTabState,
    clearTabState,
    setDeepLinkParams,
    clearDeepLinkParams,
    getTabConfig,
    getAllTabs,
    getTabByPath,
    isActiveTab,
    canGoBack,
    canGoForward,
    preloadTab,
    isTabPreloaded,
  ]);
  
  return (
    <TabNavigationContext.Provider value={value}>
      {children}
    </TabNavigationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access tab navigation context
 * @throws Error if used outside of TabNavigationProvider
 */
export function useTabNavigation(): TabNavigationContextValue {
  const context = React.useContext(TabNavigationContext);
  
  
  if (!context) {
    throw new Error(
      'useTabNavigation must be used within a TabNavigationProvider. ' +
      'Make sure your component is wrapped in <TabNavigationProvider>.'
    );
  }
  
  return context;
}

