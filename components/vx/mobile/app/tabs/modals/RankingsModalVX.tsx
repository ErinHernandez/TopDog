/**
 * RankingsModalVX - Custom Player Rankings Modal for VX Profile
 * 
 * Allows users to create and manage custom player rankings.
 * Opens as modal overlay within Profile tab (no navigation).
 * Uses contained Modal to stay within phone frame bounds.
 * 
 * Design: Tabbed single-panel (Build Rankings / My Rankings)
 * - Differentiates from competitor&apos;s side-by-side layout
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { POSITION_COLORS, TEXT_COLORS, BG_COLORS } from '../../../../constants/colors';

// Use blue-400 to match navbar active state (instead of teal)
const ACCENT_COLOR = '#60A5FA';

// ============================================================================
// TYPES
// ============================================================================

export interface RankingsModalVXProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback when unsaved changes state changes */
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
  /** Trigger to attempt close from external source (e.g., logo click) */
  externalCloseAttempt?: boolean;
  /** Callback after external close attempt is handled */
  onExternalCloseHandled?: () => void;
}

interface Player {
  name: string;
  position: string;
  team: string;
  adp: number | string;
  proj: number | string;
  bye?: number;
}

type TabType = 'build' | 'rankings';
type Position = 'QB' | 'RB' | 'WR' | 'TE';

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE'];

// ============================================================================
// TAB BAR COMPONENT
// ============================================================================

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  rankedCount: number;
}

function TabBar({ activeTab, onTabChange, rankedCount }: TabBarProps): React.ReactElement {
  return (
    <div 
      className="flex gap-2 mb-4"
      style={{ 
        backgroundColor: BG_COLORS.tertiary,
        borderRadius: '12px',
        padding: '4px',
        marginRight: '36px', // Space for close button
      }}
    >
      <button
        onClick={() => onTabChange('build')}
        className="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all"
        style={{
          backgroundColor: activeTab === 'build' ? ACCENT_COLOR : 'transparent',
          color: activeTab === 'build' ? '#000000' : TEXT_COLORS.secondary,
        }}
      >
        Players
      </button>
      <button
        onClick={() => onTabChange('rankings')}
        className="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
        style={{
          backgroundColor: activeTab === 'rankings' ? ACCENT_COLOR : 'transparent',
          color: activeTab === 'rankings' ? '#000000' : TEXT_COLORS.secondary,
        }}
      >
        Rankings
        {rankedCount > 0 && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: activeTab === 'rankings' ? 'rgba(0,0,0,0.2)' : ACCENT_COLOR,
              color: activeTab === 'rankings' ? '#000000' : '#000000',
            }}
          >
            {rankedCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// POSITION FILTER PILLS
// ============================================================================

interface PositionFilterPillsProps {
  activePosition: Position | null;
  onPositionChange: (position: Position | null) => void;
}

function PositionFilterPills({ activePosition, onPositionChange }: PositionFilterPillsProps): React.ReactElement {
  return (
    <div 
      className="flex mb-3 rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: 'rgba(255,255,255,0.05)',
      }}
    >
      <button
        onClick={() => onPositionChange(null)}
        className="flex-1 py-2.5 px-3 text-xs font-bold transition-all"
        style={{
          backgroundColor: activePosition === null ? 'rgba(255,255,255,0.1)' : 'transparent',
          color: activePosition === null ? TEXT_COLORS.primary : TEXT_COLORS.muted,
          borderBottom: activePosition === null ? `2px solid ${TEXT_COLORS.primary}` : '2px solid transparent',
        }}
      >
        ALL
      </button>
      {POSITIONS.map(pos => {
        const isActive = activePosition === pos;
        const color = POSITION_COLORS[pos];
        return (
          <button
            key={pos}
            onClick={() => onPositionChange(isActive ? null : pos)}
            className="flex-1 py-2.5 px-3 text-xs font-bold transition-all"
            style={{
              backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: isActive ? color : TEXT_COLORS.muted,
              borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
            }}
          >
            {pos}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// PLAYER LIST ITEM (Build Tab)
// ============================================================================

interface PlayerListItemProps {
  player: Player;
  isRanked: boolean;
  rankNumber?: number;
  onToggle: () => void;
}

function PlayerListItem({ player, isRanked, rankNumber, onToggle }: PlayerListItemProps): React.ReactElement {
  const posColor = POSITION_COLORS[player.position as Position] || '#6B7280';
  const adp = typeof player.adp === 'number' ? player.adp.toFixed(1) : player.adp || '-';
  const proj = typeof player.proj === 'number' ? player.proj.toFixed(1) : player.proj || '-';

  return (
    <div 
      className="flex items-center gap-3 py-3 px-3 rounded-xl transition-all"
      style={{
        backgroundColor: isRanked ? 'rgba(96, 165, 250, 0.08)' : 'rgba(255, 255, 255, 0.03)',
        borderLeft: `3px solid ${posColor}`,
      }}
    >
      {/* ADP badge */}
      <div 
        className="w-10 text-center flex-shrink-0"
      >
        <div 
          className="text-sm font-bold"
          style={{ color: TEXT_COLORS.secondary }}
        >
          {adp}
        </div>
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className="font-semibold text-sm truncate"
            style={{ color: TEXT_COLORS.primary }}
          >
            {player.name}
          </span>
        </div>
        <div 
          className="flex items-center gap-2 text-xs mt-0.5"
          style={{ color: TEXT_COLORS.muted }}
        >
          <span 
            className="font-bold"
            style={{ color: posColor }}
          >
            {player.position}
          </span>
          <span>•</span>
          <span>{player.team}</span>
        </div>
      </div>

      {/* Stats - only Proj now */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <div className="text-xs font-semibold" style={{ color: TEXT_COLORS.primary }}>
            {proj}
          </div>
          <div className="text-xs" style={{ color: TEXT_COLORS.muted }}>Proj</div>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
        style={{
          backgroundColor: isRanked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(96, 165, 250, 0.15)',
          color: isRanked ? '#EF4444' : ACCENT_COLOR,
        }}
        aria-label={isRanked ? `Remove ${player.name} from rankings` : `Add ${player.name} to rankings`}
      >
        {isRanked ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// MOVE POPUP COMPONENT
// ============================================================================

interface MovePopupProps {
  direction: 'up' | 'down';
  maxSpots: number;
  onMove: (spots: number) => void;
  onClose: () => void;
  playerName: string;
}

function MovePopup({ direction, maxSpots, onMove, onClose, playerName }: MovePopupProps): React.ReactElement {
  const [spots, setSpots] = useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const num = parseInt(spots) || 1;
    const validNum = Math.min(Math.max(1, num), maxSpots);
    onMove(validNum);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Quick select buttons
  const quickOptions = [1, 5, 10, 25, maxSpots].filter((n, i, arr) => 
    n <= maxSpots && arr.indexOf(n) === i
  ).slice(0, 4);

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200 }}
      onClick={onClose}
    >
      <div 
        className="rounded-xl p-4 w-64"
        style={{ backgroundColor: BG_COLORS.secondary }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 
          className="text-sm font-bold mb-1"
          style={{ color: TEXT_COLORS.primary }}
        >
          Move {direction === 'up' ? 'Up' : 'Down'}
        </h3>
        <p 
          className="text-xs mb-3 truncate"
          style={{ color: TEXT_COLORS.muted }}
        >
          {playerName} • Max: {maxSpots} spot{maxSpots !== 1 ? 's' : ''}
        </p>

        {/* Quick select buttons */}
        <div className="flex gap-2 mb-3">
          {quickOptions.map(n => (
            <button
              key={n}
              onClick={() => { onMove(n); onClose(); }}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: TEXT_COLORS.primary,
              }}
            >
              {n === maxSpots && n > 25 ? 'Max' : n}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={maxSpots}
            value={spots}
            onChange={(e) => setSpots(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Custom #"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: TEXT_COLORS.primary,
              border: `1px solid rgba(255,255,255,0.2)`,
            }}
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              backgroundColor: ACCENT_COLOR,
              color: '#000000',
            }}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RANKED PLAYER ROW (Rankings Tab)
// ============================================================================

interface RankedPlayerRowProps {
  player: Player;
  rank: number;
  totalRanked: number;
  onRemove: () => void;
  onMoveUp: (spots?: number) => void;
  onMoveDown: (spots?: number) => void;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
}

function RankedPlayerRow({ 
  player, 
  rank, 
  totalRanked,
  onRemove, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast,
  disabled 
}: RankedPlayerRowProps): React.ReactElement {
  const posColor = POSITION_COLORS[player.position as Position] || '#6B7280';
  const [showMovePopup, setShowMovePopup] = useState<'up' | 'down' | null>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const LONG_PRESS_DURATION = 400; // ms

  // Long press handlers
  const handlePressStart = (direction: 'up' | 'down') => {
    longPressTimer.current = setTimeout(() => {
      setShowMovePopup(direction);
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = (direction: 'up' | 'down') => {
    // Only trigger single move if not showing popup
    if (!showMovePopup) {
      if (direction === 'up') onMoveUp(1);
      else onMoveDown(1);
    }
  };

  // Calculate max spots can move
  const maxUp = rank - 1;
  const maxDown = totalRanked - rank;

  return (
    <div 
      className="flex items-center gap-2 py-2.5 px-3 rounded-xl relative"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderLeft: `3px solid ${posColor}`,
      }}
    >
      {/* Rank number */}
      <div 
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{
          backgroundColor: ACCENT_COLOR,
          color: '#000000',
        }}
      >
        {rank}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div 
          className="font-semibold text-sm truncate"
          style={{ color: TEXT_COLORS.primary }}
        >
          {player.name}
        </div>
        <div 
          className="flex items-center gap-1.5 text-xs"
          style={{ color: TEXT_COLORS.muted }}
        >
          <span style={{ color: posColor, fontWeight: 'bold' }}>{player.position}</span>
          <span>•</span>
          <span>{player.team}</span>
        </div>
      </div>

      {/* Move buttons - tap to move 1, hold for bulk move */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={() => handleClick('up')}
          onMouseDown={() => !isFirst && !disabled && handlePressStart('up')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={() => !isFirst && !disabled && handlePressStart('up')}
          onTouchEnd={handlePressEnd}
          disabled={isFirst || disabled}
          className="w-6 h-6 rounded flex items-center justify-center transition-all select-none"
          style={{
            backgroundColor: isFirst ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
            color: isFirst ? TEXT_COLORS.disabled : TEXT_COLORS.secondary,
            cursor: isFirst || disabled ? 'not-allowed' : 'pointer',
          }}
          aria-label={`Move ${player.name} up (hold for bulk move)`}
          title="Tap to move 1, hold for bulk move"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => handleClick('down')}
          onMouseDown={() => !isLast && !disabled && handlePressStart('down')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={() => !isLast && !disabled && handlePressStart('down')}
          onTouchEnd={handlePressEnd}
          disabled={isLast || disabled}
          className="w-6 h-6 rounded flex items-center justify-center transition-all select-none"
          style={{
            backgroundColor: isLast ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
            color: isLast ? TEXT_COLORS.disabled : TEXT_COLORS.secondary,
            cursor: isLast || disabled ? 'not-allowed' : 'pointer',
          }}
          aria-label={`Move ${player.name} down (hold for bulk move)`}
          title="Tap to move 1, hold for bulk move"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        disabled={disabled}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-label={`Remove ${player.name}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Bulk move popup */}
      {showMovePopup && (
        <MovePopup
          direction={showMovePopup}
          maxSpots={showMovePopup === 'up' ? maxUp : maxDown}
          onMove={(spots) => {
            if (showMovePopup === 'up') onMoveUp(spots);
            else onMoveDown(spots);
          }}
          onClose={() => setShowMovePopup(null)}
          playerName={player.name}
        />
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RankingsModalVX({ 
  isOpen, 
  onClose,
  onUnsavedChangesChange,
  externalCloseAttempt,
  onExternalCloseHandled
}: RankingsModalVXProps): React.ReactElement | null {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('build');
  const [customRankings, setCustomRankings] = useState<string[]>([]);
  const [originalRankings, setOriginalRankings] = useState<string[]>([]);
  const [playerPool, setPlayerPool] = useState<Player[]>([]);
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Derived state
  const hasChanges = JSON.stringify(customRankings) !== JSON.stringify(originalRankings);
  const rankedCount = customRankings.length;

  // Report unsaved changes to parent
  useEffect(() => {
    onUnsavedChangesChange?.(hasChanges);
  }, [hasChanges, onUnsavedChangesChange]);

  // Handle external close attempt (e.g., from logo click)
  useEffect(() => {
    if (externalCloseAttempt && isOpen) {
      if (hasChanges) {
        setShowUnsavedWarning(true);
      } else {
        onClose();
      }
      onExternalCloseHandled?.();
    }
  }, [externalCloseAttempt, isOpen, hasChanges, onClose, onExternalCloseHandled]);

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Discard changes and close
  const handleDiscardAndClose = useCallback(() => {
    setShowUnsavedWarning(false);
    setCustomRankings(originalRankings);
    onClose();
  }, [originalRankings, onClose]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Reset tab when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('build');
      setSearchQuery('');
      setPositionFilter(null);
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Dynamic imports to avoid SSR issues
      const [rankingsModule, poolModule] = await Promise.all([
        import('../../../../../../lib/customRankings'),
        import('../../../../../../lib/playerPool'),
      ]);
      
      const savedRankings = rankingsModule.loadCustomRankings() || [];
      setCustomRankings(savedRankings);
      setOriginalRankings(savedRankings);
      setPlayerPool(poolModule.PLAYER_POOL || []);
    } catch (e) {
      console.error('Error loading rankings data:', e);
      setError('Failed to load data. Please try again.');
      setCustomRankings([]);
      setOriginalRankings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get rank for a player
  const getRank = useCallback((playerName: string): number | undefined => {
    const index = customRankings.indexOf(playerName);
    return index >= 0 ? index + 1 : undefined;
  }, [customRankings]);

  // Check if player is ranked
  const isPlayerRanked = useCallback((playerName: string): boolean => {
    return customRankings.includes(playerName);
  }, [customRankings]);

  // Toggle player ranking
  const togglePlayerRanking = useCallback((playerName: string) => {
    setCustomRankings(prev => {
      if (prev.includes(playerName)) {
        return prev.filter(name => name !== playerName);
      } else {
        return [...prev, playerName];
      }
    });
  }, []);

  // Remove player from rankings
  const removeFromRankings = useCallback((playerName: string) => {
    setCustomRankings(prev => prev.filter(name => name !== playerName));
  }, []);

  // Move player up in rankings (supports bulk moves)
  const moveUp = useCallback((playerName: string, spots: number = 1) => {
    setCustomRankings(prev => {
      const index = prev.indexOf(playerName);
      if (index <= 0) return prev;
      const newRankings = [...prev];
      // Calculate target position (can&apos;t go below 0)
      const targetIndex = Math.max(0, index - spots);
      // Remove player from current position
      const [player] = newRankings.splice(index, 1);
      // Insert at new position
      newRankings.splice(targetIndex, 0, player);
      return newRankings;
    });
  }, []);

  // Move player down in rankings (supports bulk moves)
  const moveDown = useCallback((playerName: string, spots: number = 1) => {
    setCustomRankings(prev => {
      const index = prev.indexOf(playerName);
      if (index < 0 || index >= prev.length - 1) return prev;
      const newRankings = [...prev];
      // Calculate target position (can&apos;t go beyond end)
      const targetIndex = Math.min(prev.length - 1, index + spots);
      // Remove player from current position
      const [player] = newRankings.splice(index, 1);
      // Insert at new position
      newRankings.splice(targetIndex, 0, player);
      return newRankings;
    });
  }, []);

  // Filter and sort players for Build tab
  const filteredPlayers = useMemo(() => {
    let players = [...playerPool];

    // Position filter
    if (positionFilter) {
      players = players.filter(p => p.position === positionFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      players = players.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.team.toLowerCase().includes(query)
      );
    }

    // Sort: ranked first (by rank), then by ADP
    players.sort((a, b) => {
      const aRank = getRank(a.name);
      const bRank = getRank(b.name);
      
      // Both ranked: sort by rank
      if (aRank !== undefined && bRank !== undefined) {
        return aRank - bRank;
      }
      // Only a is ranked: a comes first
      if (aRank !== undefined) return -1;
      // Only b is ranked: b comes first
      if (bRank !== undefined) return 1;
      // Neither ranked: sort by ADP
      const aAdp = typeof a.adp === 'number' ? a.adp : parseFloat(String(a.adp)) || 999;
      const bAdp = typeof b.adp === 'number' ? b.adp : parseFloat(String(b.adp)) || 999;
      return aAdp - bAdp;
    });

    return players;
  }, [playerPool, positionFilter, searchQuery, getRank]);

  // Get ranked players for Rankings tab
  const rankedPlayers = useMemo(() => {
    return customRankings
      .map(name => playerPool.find(p => p.name === name))
      .filter((p): p is Player => p !== undefined);
  }, [customRankings, playerPool]);

  // Filter ranked players by search query
  const filteredRankedPlayers = useMemo(() => {
    if (!searchQuery.trim()) return rankedPlayers;
    const query = searchQuery.toLowerCase();
    return rankedPlayers.filter(player => 
      player.name.toLowerCase().includes(query) ||
      player.team.toLowerCase().includes(query) ||
      player.position.toLowerCase().includes(query)
    );
  }, [rankedPlayers, searchQuery]);

  // Save rankings
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const { saveCustomRankings } = await import('../../../../../../lib/customRankings');
      saveCustomRankings(customRankings);
      setOriginalRankings(customRankings);
      onClose();
    } catch (e) {
      console.error('Error saving rankings:', e);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear all rankings
  const handleClear = useCallback(() => {
    setCustomRankings([]);
  }, []);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    // Full-screen overlay positioned below header (60px header height)
    <div
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{
        top: '60px', // Below the header
        backgroundColor: BG_COLORS.secondary,
        zIndex: 100, // Above footer navigation (50)
      }}
    >
      {/* Close button - positioned outside content flow, sized to match tab bar */}
      <button
        onClick={handleClose}
        className="absolute flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        style={{ 
          color: TEXT_COLORS.secondary, 
          zIndex: 110,
          top: '16px',
          right: '8px',
          width: '36px',
          height: '36px',
        }}
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-3 overflow-hidden">
        {/* Loading state */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-2"
              style={{ 
                borderColor: `${ACCENT_COLOR} transparent transparent transparent` 
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
          {/* Tab Bar */}
          <TabBar 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            rankedCount={rankedCount}
          />

          {/* Tab Content */}
          {/* Search - always visible */}
          <div className="mb-3">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke={TEXT_COLORS.muted}
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: TEXT_COLORS.primary,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {activeTab === 'build' ? (
              <>
                {/* Position Filters */}
                <PositionFilterPills 
                  activePosition={positionFilter}
                  onPositionChange={setPositionFilter}
                />

                {/* Player List */}
                <div 
                  className="flex-1 overflow-y-auto space-y-2 pr-1"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {filteredPlayers.length === 0 ? (
                    <div 
                      className="flex flex-col items-center justify-center py-12 text-center"
                      style={{ color: TEXT_COLORS.muted }}
                    >
                      <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-sm">No players found</p>
                    </div>
                  ) : (
                    filteredPlayers.slice(0, 50).map(player => (
                      <PlayerListItem
                        key={player.name}
                        player={player}
                        isRanked={isPlayerRanked(player.name)}
                        rankNumber={getRank(player.name)}
                        onToggle={() => togglePlayerRanking(player.name)}
                      />
                    ))
                  )}
                  {filteredPlayers.length > 50 && (
                    <p 
                      className="text-center py-3 text-xs"
                      style={{ color: TEXT_COLORS.muted }}
                    >
                      Showing 50 of {filteredPlayers.length} players. Use search to find more.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Rankings List */}
                {rankedPlayers.length === 0 ? (
                  <div 
                    className="flex-1 flex flex-col items-center justify-center text-center px-4"
                    style={{ color: TEXT_COLORS.muted }}
                  >
                    <svg className="w-16 h-16 mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm font-medium mb-2" style={{ color: TEXT_COLORS.secondary }}>
                      No rankings yet
                    </p>
                    <p className="text-xs">
                      Switch to "Players" tab to add players to your rankings
                    </p>
                  </div>
                ) : filteredRankedPlayers.length === 0 ? (
                  <div 
                    className="flex-1 flex flex-col items-center justify-center text-center px-4"
                    style={{ color: TEXT_COLORS.muted }}
                  >
                    <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-sm">No matching players in rankings</p>
                  </div>
                ) : (
                  <>
                    <p 
                      className="text-xs mb-3"
                      style={{ color: TEXT_COLORS.muted }}
                    >
                      {searchQuery.trim() 
                        ? `Showing ${filteredRankedPlayers.length} of ${rankedPlayers.length} ranked players`
                        : 'Use arrows to reorder your rankings'
                      }
                    </p>
                    <div 
                      className="flex-1 overflow-y-auto space-y-2 pr-1"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {filteredRankedPlayers.map((player) => {
                        const actualRank = customRankings.indexOf(player.name) + 1;
                        return (
                          <RankedPlayerRow
                            key={player.name}
                            player={player}
                            rank={actualRank}
                            totalRanked={rankedPlayers.length}
                            onRemove={() => removeFromRankings(player.name)}
                            onMoveUp={(spots) => moveUp(player.name, spots)}
                            onMoveDown={(spots) => moveDown(player.name, spots)}
                            isFirst={actualRank === 1}
                            isLast={actualRank === rankedPlayers.length}
                            disabled={isSaving}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div 
              className="mt-3 p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
              }}
            >
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={handleClear}
              disabled={rankedCount === 0 || isSaving}
              className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all"
              style={{
                backgroundColor: rankedCount === 0 ? BG_COLORS.tertiary : 'rgba(255, 255, 255, 0.1)',
                color: rankedCount === 0 ? TEXT_COLORS.disabled : TEXT_COLORS.primary,
                border: 'none',
                cursor: rankedCount === 0 || isSaving ? 'not-allowed' : 'pointer',
                opacity: rankedCount === 0 ? 0.5 : 1,
              }}
            >
              Clear
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: (!hasChanges || isSaving) ? BG_COLORS.tertiary : ACCENT_COLOR,
                color: (!hasChanges || isSaving) ? TEXT_COLORS.disabled : '#000000',
                border: 'none',
                cursor: (!hasChanges || isSaving) ? 'not-allowed' : 'pointer',
                opacity: (!hasChanges || isSaving) ? 0.5 : 1,
              }}
            >
              {isSaving ? (
                <>
                  <div 
                    className="animate-spin rounded-full h-4 w-4 border-2"
                    style={{ 
                      borderColor: 'currentColor transparent transparent transparent' 
                    }}
                  />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Unsaved Changes Warning */}
      {showUnsavedWarning && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 300 }}
        >
          <div 
            className="rounded-xl p-5 w-72 mx-4"
            style={{ backgroundColor: BG_COLORS.secondary }}
          >
            <h3 
              className="text-base font-bold mb-2"
              style={{ color: TEXT_COLORS.primary }}
            >
              Unsaved Changes
            </h3>
            <p 
              className="text-sm mb-5"
              style={{ color: TEXT_COLORS.muted }}
            >
              You have unsaved changes to your rankings. Are you sure you want to leave?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: TEXT_COLORS.primary,
                }}
              >
                Go Back
              </button>
              <button
                onClick={handleDiscardAndClose}
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all"
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

