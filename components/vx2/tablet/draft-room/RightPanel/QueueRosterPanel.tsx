/**
 * QueueRosterPanel - Right Panel Content
 * 
 * Split view showing user's queue (top) and roster (bottom).
 * Optimized for tablet width.
 */

import React, { type ReactElement } from 'react';
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS, BORDER_COLORS } from '../../../core/constants/colors';
import { TABLET_DRAFT, TABLET_SPACING, TABLET_TYPOGRAPHY } from '../../../core/constants/tablet';
import type { DraftPlayer, Position } from '../../../draft-room/types';

// ============================================================================
// TYPES
// ============================================================================

// QueuePlayer is just an alias for DraftPlayer in this context
type QueuePlayer = DraftPlayer;

export interface QueueRosterPanelProps {
  /** Queue items */
  queue: QueuePlayer[];
  /** Remove from queue */
  onRemoveFromQueue: (playerId: string) => void;
  /** Clear queue */
  onClearQueue: () => void;
  /** User's roster picks */
  roster: Array<{
    position: string;
    player?: { name: string; team: string; position: Position };
  }>;
  /** Only show queue section (for tab view) */
  showQueueOnly?: boolean;
  /** Only show roster section (for tab view) */
  showRosterOnly?: boolean;
}

// ============================================================================
// SECTION HEADER
// ============================================================================

interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: React.ReactNode;
}

function SectionHeader({ title, count, action }: SectionHeaderProps): ReactElement {
  return (
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: TABLET_SPACING.md,
        paddingRight: TABLET_SPACING.sm,
        borderBottom: `1px solid ${BORDER_COLORS.default}`,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
            fontWeight: 600,
            color: TEXT_COLORS.primary,
          }}
        >
          {title}
        </span>
        {count !== undefined && (
          <span
            style={{
              fontSize: TABLET_TYPOGRAPHY.fontSize.xs,
              color: TEXT_COLORS.secondary,
            }}
          >
            ({count})
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

// ============================================================================
// QUEUE ITEM
// ============================================================================

interface QueueItemProps {
  player: QueuePlayer;
  index: number;
  onRemove: () => void;
}

function QueueItem({ player, index, onRemove }: QueueItemProps): ReactElement {
  const positionColor = POSITION_COLORS[player.position];
  
  return (
    <div
      style={{
        height: TABLET_DRAFT.queueItemHeight,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: TABLET_SPACING.md,
        paddingRight: TABLET_SPACING.sm,
        backgroundColor: BG_COLORS.card,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Index */}
      <span
        style={{
          width: 24,
          fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
          color: TEXT_COLORS.muted,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {index + 1}
      </span>
      
      {/* Player Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
            fontWeight: 500,
            color: TEXT_COLORS.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {player.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: positionColor,
            }}
          >
            {player.position}
          </span>
          <span style={{ fontSize: 10, color: TEXT_COLORS.secondary }}>
            {player.team}
          </span>
        </div>
      </div>
      
      {/* Remove Button */}
      <button
        onClick={onRemove}
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: TEXT_COLORS.muted,
          borderRadius: 4,
        }}
        aria-label={`Remove ${player.name} from queue`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// POSITION BADGE (VX2 Style)
// ============================================================================

interface PositionBadgeProps {
  position: string;
  size?: 'sm' | 'md' | 'lg';
  isEmpty?: boolean;
}

function PositionBadge({ position, size = 'md', isEmpty = false }: PositionBadgeProps): ReactElement {
  const color = POSITION_COLORS[position as Position] || '#6B7280';
  
  const dimensions = {
    sm: { width: 28, height: 18, fontSize: 9, borderRadius: 4 },
    md: { width: 36, height: 22, fontSize: 10, borderRadius: 5 },
    lg: { width: 44, height: 28, fontSize: 12, borderRadius: 6 },
  };
  
  const dim = dimensions[size];
  
  // Special three-color gradient for FLEX
  if (position === 'FLEX') {
    return (
      <div
        style={{
          width: dim.width,
          height: dim.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: dim.borderRadius,
          position: 'relative',
          overflow: 'hidden',
          opacity: isEmpty ? 0.5 : 1,
        }}
      >
        {/* Three-color background stripes */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.RB }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.WR }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.TE }} />
        </div>
        {/* Text overlay */}
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            color: '#000000',
            fontSize: dim.fontSize,
            fontWeight: 700,
          }}
        >
          FLX
        </span>
      </div>
    );
  }
  
  // BN (Bench) badge - gray
  if (position === 'BN') {
    return (
      <div
        style={{
          width: dim.width,
          height: dim.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: dim.borderRadius,
          backgroundColor: '#4B5563',
          color: '#FFFFFF',
          fontSize: dim.fontSize,
          fontWeight: 700,
          opacity: isEmpty ? 0.5 : 1,
        }}
      >
        BN
      </div>
    );
  }
  
  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: dim.borderRadius,
        backgroundColor: color,
        color: '#000000',
        fontSize: dim.fontSize,
        fontWeight: 700,
        opacity: isEmpty ? 0.5 : 1,
      }}
    >
      {position}
    </div>
  );
}

// ============================================================================
// ROSTER SLOT
// ============================================================================

interface RosterSlotProps {
  label: string;
  player?: { name: string; team: string; position: Position };
}

function RosterSlot({ label, player }: RosterSlotProps): ReactElement {
  const isEmpty = !player;
  // Use player's actual position for badge if filled, otherwise use slot position
  const displayPosition = player?.position || label;
  
  return (
    <div
      style={{
        height: TABLET_DRAFT.rosterCellHeight,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: TABLET_SPACING.sm,
        paddingRight: TABLET_SPACING.md,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Position Badge */}
      <div
        style={{
          width: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <PositionBadge 
          position={displayPosition} 
          size="md" 
          isEmpty={isEmpty}
        />
      </div>
      
      {/* Player Info or Empty */}
      {player ? (
        <div style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
          <div
            style={{
              fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
              fontWeight: 500,
              color: TEXT_COLORS.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {player.name}
          </div>
          <div
            style={{
              fontSize: 10,
              color: TEXT_COLORS.secondary,
              marginTop: 1,
            }}
          >
            {player.team}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, paddingLeft: 8 }}>
          <span
            style={{
              fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
              color: TEXT_COLORS.muted,
            }}
          >
            --
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QueueRosterPanel({
  queue,
  onRemoveFromQueue,
  onClearQueue,
  roster,
  showQueueOnly = false,
  showRosterOnly = false,
}: QueueRosterPanelProps): ReactElement {
  const showQueue = !showRosterOnly;
  const showRoster = !showQueueOnly;
  
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Queue Section */}
      {showQueue && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: showQueueOnly ? 0 : 200,
            borderBottom: showRoster ? `1px solid ${BORDER_COLORS.default}` : 'none',
          }}
        >
          <SectionHeader
            title="Queue"
            count={queue.length}
            action={
              queue.length > 0 ? (
                <button
                  onClick={onClearQueue}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    color: TEXT_COLORS.secondary,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              ) : undefined
            }
          />
          
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            className="tablet-scroll-hidden"
          >
            {queue.length === 0 ? (
              <div
                style={{
                  padding: TABLET_SPACING.lg,
                  textAlign: 'center',
                  color: TEXT_COLORS.muted,
                  fontSize: TABLET_TYPOGRAPHY.fontSize.sm,
                }}
              >
                No players queued
              </div>
            ) : (
              queue.map((player, index) => (
                <QueueItem
                  key={player.id}
                  player={player}
                  index={index}
                  onRemove={() => onRemoveFromQueue(player.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Roster Section */}
      {showRoster && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: showRosterOnly ? 0 : 200,
          }}
        >
          <SectionHeader title="Your Roster" />
          
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            className="tablet-scroll-hidden"
          >
            {roster.map((slot, index) => (
              <RosterSlot
                key={`${slot.position}-${index}`}
                label={slot.position}
                player={slot.player}
              />
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        .tablet-scroll-hidden::-webkit-scrollbar {
          display: none !important;
        }
        .tablet-scroll-hidden {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>
    </div>
  );
}

