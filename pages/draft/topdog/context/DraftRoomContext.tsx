/**
 * DraftRoomContext
 * 
 * Context and reducer for managing draft room state.
 * All draft room state lives here, hooks dispatch actions to update it.
 * 
 * Part of Phase 1: Types and Context
 */

import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { DraftState, DraftAction, DraftRoom, DraftPick, Player } from '../types/draft';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: DraftState = {
  isConnected: false,
  isLoading: true,
  error: null,
  room: null,
  picks: [],
  availablePlayers: [],
  currentUser: '',
  isMyTurn: false,
  myPicks: [],
  timer: 30,
  isInGracePeriod: false,
  queue: [],
  selectedPlayer: null,
  filters: {
    search: '',
    positions: [],
    sortBy: 'adp',
    sortDirection: 'asc',
  },
  rankings: [],
  customRankings: [],
};

// ============================================================================
// REDUCER
// ============================================================================

function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'SET_ROOM':
      return {
        ...state,
        room: action.payload,
        isLoading: false,
        isConnected: true,
      };

    case 'SET_PICKS':
      // Update picks and remove picked players from available
      const pickedPlayerNames = new Set(action.payload.map((p) => p.player));
      return {
        ...state,
        picks: action.payload,
        availablePlayers: state.availablePlayers.filter(
          (p) => !pickedPlayerNames.has(p.name)
        ),
        // Update myPicks
        myPicks: action.payload.filter((p) => p.user === state.currentUser),
      };

    case 'ADD_PICK':
      return {
        ...state,
        picks: [...state.picks, action.payload],
        availablePlayers: state.availablePlayers.filter(
          (p) => p.name !== action.payload.player
        ),
        // Auto-remove from queue if picked
        queue: state.queue.filter((p) => p.name !== action.payload.player),
        // Update myPicks if it's user's pick
        myPicks:
          action.payload.user === state.currentUser
            ? [...state.myPicks, action.payload]
            : state.myPicks,
      };

    case 'TICK_TIMER':
      return {
        ...state,
        timer: Math.max(0, state.timer - 1),
      };

    case 'SET_TIMER':
      return {
        ...state,
        timer: action.payload,
        isInGracePeriod: false,
      };

    case 'SET_IS_IN_GRACE_PERIOD':
      return {
        ...state,
        isInGracePeriod: action.payload,
      };

    case 'ADD_TO_QUEUE':
      if (state.queue.some((p) => p.name === action.payload.name)) {
        return state; // Already in queue
      }
      return {
        ...state,
        queue: [...state.queue, action.payload],
      };

    case 'REMOVE_FROM_QUEUE':
      return {
        ...state,
        queue: state.queue.filter((p) => p.name !== action.payload),
      };

    case 'SET_QUEUE':
      return {
        ...state,
        queue: action.payload,
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'SELECT_PLAYER':
      return {
        ...state,
        selectedPlayer: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_AVAILABLE_PLAYERS':
      return {
        ...state,
        availablePlayers: action.payload,
      };

    case 'SET_RANKINGS':
      return {
        ...state,
        rankings: action.payload,
      };

    case 'SET_CUSTOM_RANKINGS':
      return {
        ...state,
        customRankings: action.payload,
      };

    case 'SET_IS_MY_TURN':
      return {
        ...state,
        isMyTurn: action.payload,
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface DraftRoomContextValue {
  state: DraftState;
  dispatch: React.Dispatch<DraftAction>;
}

const DraftRoomContext = createContext<DraftRoomContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface DraftRoomProviderProps {
  children: ReactNode;
  initialUser: string;
  initialRoom?: DraftRoom;
  initialPicks?: DraftPick[];
  initialAvailablePlayers?: Player[];
}

export function DraftRoomProvider({
  children,
  initialUser,
  initialRoom,
  initialPicks,
  initialAvailablePlayers,
}: DraftRoomProviderProps) {
  const [state, dispatch] = useReducer(draftReducer, {
    ...initialState,
    currentUser: initialUser,
    room: initialRoom || null,
    picks: initialPicks || [],
    availablePlayers: initialAvailablePlayers || [],
    isLoading: !initialRoom,
  });

  const value = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state, dispatch]
  );

  return (
    <DraftRoomContext.Provider value={value}>
      {children}
    </DraftRoomContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Main hook to access draft room context
 */
export function useDraftRoom(): DraftRoomContextValue {
  const context = useContext(DraftRoomContext);
  if (!context) {
    throw new Error('useDraftRoom must be used within DraftRoomProvider');
  }
  return context;
}

/**
 * Hook to access draft state
 */
export function useDraftState(): DraftState {
  return useDraftRoom().state;
}

/**
 * Hook to access draft dispatch function
 */
export function useDraftDispatch(): React.Dispatch<DraftAction> {
  return useDraftRoom().dispatch;
}
