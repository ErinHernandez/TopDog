/**
 * VX2 Draft Logic - Autodraft Hook
 * 
 * Manages autodraft configuration and player selection.
 * All new implementation - no code reuse.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { DEFAULT_POSITION_LIMITS, STORAGE_KEYS } from '../constants';
import type { 
  DraftPlayer, 
  AutodraftConfig, 
  PositionLimits,
  AutodraftResult,
} from '../types';
// Direct imports to avoid barrel export issues with Turbopack
import { selectAutodraftPlayer, canDraftPlayer } from '../utils/autodraft';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAutodraftOptions {
  /** User ID for storage namespacing */
  userId?: string;
  /** Initial position limits */
  initialLimits?: PositionLimits;
  /** Persist config to localStorage */
  persist?: boolean;
}

export interface UseAutodraftResult {
  /** Current configuration */
  config: AutodraftConfig;
  /** Whether autodraft is enabled */
  isEnabled: boolean;
  /** Current position limits */
  positionLimits: PositionLimits;
  /** Custom rankings (player IDs) */
  customRankings: string[];
  /** Toggle autodraft on/off */
  setEnabled: (enabled: boolean) => void;
  /** Set all position limits */
  setPositionLimits: (limits: PositionLimits) => void;
  /** Set single position limit */
  setPositionLimit: (position: keyof PositionLimits, limit: number) => void;
  /** Set custom rankings */
  setCustomRankings: (rankings: string[]) => void;
  /** Add player to rankings */
  addToRankings: (playerId: string) => void;
  /** Remove player from rankings */
  removeFromRankings: (playerId: string) => void;
  /** Check if player can be drafted */
  canDraft: (player: DraftPlayer, currentRoster: DraftPlayer[]) => boolean;
  /** Select best player for autopick */
  selectPlayer: (
    availablePlayers: DraftPlayer[],
    currentRoster: DraftPlayer[],
    queue: string[]
  ) => AutodraftResult | null;
  /** Reset to defaults */
  resetToDefaults: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getStorageKey(userId?: string): string {
  return userId 
    ? `${STORAGE_KEYS.autodraftConfig}_${userId}` 
    : STORAGE_KEYS.autodraftConfig;
}

function loadConfig(userId?: string): AutodraftConfig | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveConfig(config: AutodraftConfig, userId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

function createDefaultConfig(): AutodraftConfig {
  return {
    isEnabled: true,
    positionLimits: { ...DEFAULT_POSITION_LIMITS },
    customRankings: [],
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useAutodraft({
  userId,
  initialLimits,
  persist = true,
}: UseAutodraftOptions = {}): UseAutodraftResult {
  // Initialize state from storage or defaults
  const [config, setConfig] = useState<AutodraftConfig>(() => {
    if (persist) {
      const stored = loadConfig(userId);
      if (stored) return stored;
    }
    
    return {
      ...createDefaultConfig(),
      positionLimits: initialLimits ?? { ...DEFAULT_POSITION_LIMITS },
    };
  });
  
  // Persist config changes
  useEffect(() => {
    if (persist) {
      saveConfig(config, userId);
    }
  }, [config, userId, persist]);
  
  // Destructure for convenience
  const { isEnabled, positionLimits, customRankings } = config;
  
  // Actions
  const setEnabled = useCallback((enabled: boolean) => {
    setConfig(prev => ({ ...prev, isEnabled: enabled }));
  }, []);
  
  const setPositionLimits = useCallback((limits: PositionLimits) => {
    setConfig(prev => ({ ...prev, positionLimits: limits }));
  }, []);
  
  const setPositionLimit = useCallback((
    position: keyof PositionLimits, 
    limit: number
  ) => {
    setConfig(prev => ({
      ...prev,
      positionLimits: {
        ...prev.positionLimits,
        [position]: Math.max(0, limit),
      },
    }));
  }, []);
  
  const setCustomRankings = useCallback((rankings: string[]) => {
    setConfig(prev => ({ ...prev, customRankings: rankings }));
  }, []);
  
  const addToRankings = useCallback((playerId: string) => {
    setConfig(prev => {
      if (prev.customRankings.includes(playerId)) {
        return prev;
      }
      return {
        ...prev,
        customRankings: [...prev.customRankings, playerId],
      };
    });
  }, []);
  
  const removeFromRankings = useCallback((playerId: string) => {
    setConfig(prev => ({
      ...prev,
      customRankings: prev.customRankings.filter(id => id !== playerId),
    }));
  }, []);
  
  const resetToDefaults = useCallback(() => {
    setConfig(createDefaultConfig());
  }, []);
  
  // Memoized check function
  const canDraft = useCallback(
    (player: DraftPlayer, currentRoster: DraftPlayer[]): boolean => {
      return canDraftPlayer(player, currentRoster, positionLimits);
    },
    [positionLimits]
  );
  
  // Memoized selection function
  const selectPlayer = useCallback(
    (
      availablePlayers: DraftPlayer[],
      currentRoster: DraftPlayer[],
      queue: string[]
    ): AutodraftResult | null => {
      return selectAutodraftPlayer(
        availablePlayers,
        currentRoster,
        queue,
        customRankings,
        positionLimits
      );
    },
    [customRankings, positionLimits]
  );
  
  return {
    config,
    isEnabled,
    positionLimits,
    customRankings,
    setEnabled,
    setPositionLimits,
    setPositionLimit,
    setCustomRankings,
    addToRankings,
    removeFromRankings,
    canDraft,
    selectPlayer,
    resetToDefaults,
  };
}

export default useAutodraft;

