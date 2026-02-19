/**
 * Working lobby config – persisted when user clicks "Save" in the lobby tab sandbox.
 * The VX2 app (and future VX iterations) read this and use it as the live lobby layout.
 *
 * Save in sandbox → write here → LobbyTabVX2 (in phone frame) reads and applies.
 */

import { useCallback, useEffect, useState } from 'react';

export const WORKING_LOBBY_CONFIG_KEY = 'lobby-tab-working-config';

/** Persisted shape; matches the subset the app uses from the sandbox. */
export type WorkingLobbyConfig = {
  outlineOn?: boolean;
  outlineThickness?: number;
  outlineInset?: number;
  outlineRadius?: number;
  globeSizePx?: number;
  /** Y offset per lobby object + outline (height movement). */
  positionYOffsets?: Record<string, number>;
  /** Which lobby objects to show; keys e.g. logoTitle, progressBar, joinButton, stats, globe. */
  objectsInPhone?: Record<string, boolean>;
};

function getStored(): WorkingLobbyConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WORKING_LOBBY_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkingLobbyConfig;
  } catch {
    return null;
  }
}

/** Persist config as the working lobby (called by sandbox Save). */
export function saveWorkingLobbyConfig(config: WorkingLobbyConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WORKING_LOBBY_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/** Hook: returns the current working lobby config, or null if none saved. Uses lazy init so first client render already has it; updates when another tab writes (e.g. sandbox Save). */
export function useWorkingLobbyConfig(): WorkingLobbyConfig | null {
  const [config, setConfig] = useState<WorkingLobbyConfig | null>(() => getStored());

  const refresh = useCallback(() => {
    setConfig(getStored());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setting state from event listener
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === WORKING_LOBBY_CONFIG_KEY) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  return config;
}
