/**
 * Modal Context Hook
 *
 * Extracted to separate module to avoid circular dependencies with tab components
 * that need to open modals from the app shell.
 */

import { createContext, useContext } from 'react';

/**
 * Interface for modal control methods
 */
export interface ModalContextType {
  openAutodraftLimits: () => void;
  openDeposit: () => void;
  openDepositHistory: () => void;
  openWithdraw: () => void;
  openRankings: () => void;
}

/**
 * Context for modal management in the app shell
 */
export const ModalContext = createContext<ModalContextType | null>(null);

/**
 * Hook to access modal control methods from the app shell
 */
export function useModals(): ModalContextType | null {
  return useContext(ModalContext);
}
