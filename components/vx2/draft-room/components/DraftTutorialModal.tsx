/**
 * DraftTutorialModal - Multi-page tutorial carousel for snake draft
 * 
 * Shows when user taps "Tutorial" in the info modal.
 * VX2-styled pages with position-colored illustrations.
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Accessibility: ARIA labels, keyboard navigation
 */

import React, { useState, useCallback } from 'react';
import { POSITION_COLORS } from '../../core/constants/colors';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  background: '#0F172A',
  cardBg: '#1E293B',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  accent: '#3B82F6',
  userBlue: '#1E3A5F', // Matches navbar/user card color
  dotActive: '#3B82F6',
  dotInactive: '#374151',
  exitButton: '#64748B',
  border: '#334155',
  success: '#22C55E',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface DraftTutorialModalProps {
  /** Whether modal is visible */
  isOpen: boolean;
  /** Called when modal closes */
  onClose: () => void;
  /** Called when Rules button is tapped */
  onRules?: () => void;
  /** Draft format for title */
  format?: string;
  /** Whether to show the "don&apos;t show again" checkbox */
  showDontShowAgain?: boolean;
  /** Callback when "don&apos;t show again" is changed */
  onDontShowAgainChange?: (checked: boolean) => void;
}

interface TutorialPage {
  illustration: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
}

// ============================================================================
// ILLUSTRATIONS - VX2 Style
// ============================================================================

function DraftCardsIllustration(): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '0 20px' }}>
      {/* User card - highlighted with blue */}
      <div
        style={{
          width: 72,
          height: 88,
          backgroundColor: COLORS.cardBg,
          borderRadius: 6,
          border: `3px solid ${COLORS.userBlue}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ 
          backgroundColor: COLORS.userBlue, 
          padding: '4px 6px',
          textAlign: 'center',
        }}>
          <span style={{ color: '#FFF', fontSize: 8, fontWeight: 600 }}>YOUR TURN</span>
        </div>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: COLORS.text,
          fontSize: 20,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}>
          28
        </div>
        <div style={{ display: 'flex', height: 4, gap: 1, margin: 4 }}>
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.QB, borderRadius: 1 }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.RB, borderRadius: 1 }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.WR, borderRadius: 1 }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.TE, borderRadius: 1 }} />
          </div>
        </div>
      
      {/* Picked cards with players */}
      {[
        { pos: 'WR', name: 'Chase', color: POSITION_COLORS.WR },
        { pos: 'RB', name: 'Robinson', color: POSITION_COLORS.RB },
        { pos: 'QB', name: 'Allen', color: POSITION_COLORS.QB },
      ].map((player, i) => (
        <div
          key={i}
          style={{
            width: 64,
            height: 80,
            backgroundColor: COLORS.cardBg,
            borderRadius: 6,
            border: `2px solid ${player.color}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ 
            backgroundColor: player.color, 
            padding: '2px 4px',
          }}>
            <span style={{ color: '#000', fontSize: 7, fontWeight: 600 }}>{player.pos}</span>
          </div>
          <div style={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: 12, 
              backgroundColor: '#475569',
              marginBottom: 2,
            }} />
            <span style={{ color: COLORS.text, fontSize: 8, fontWeight: 500 }}>{player.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SnakeOrderIllustration(): React.ReactElement {
  const teams = [
    { name: 'YOU', isUser: true, tracker: [POSITION_COLORS.QB, POSITION_COLORS.RB, POSITION_COLORS.WR] },
    { name: 'TEAM 2', isUser: false, tracker: [POSITION_COLORS.RB, POSITION_COLORS.WR, POSITION_COLORS.TE] },
    { name: 'TEAM 3', isUser: false, tracker: [POSITION_COLORS.WR, POSITION_COLORS.RB, POSITION_COLORS.QB] },
    { name: 'TEAM 4', isUser: false, tracker: [POSITION_COLORS.RB, POSITION_COLORS.WR, POSITION_COLORS.WR] },
  ];
  
  const cellWidth = 76;
  const cellGap = 2;
  
  // Pick data matching actual board style
  const picks = [
    // Round 1
    [
      { pick: '1.01', first: 'Ja\'Marr', last: 'Chase', pos: 'WR', team: 'CIN', color: POSITION_COLORS.WR },
      { pick: '1.02', first: 'Bijan', last: 'Robinson', pos: 'RB', team: 'ATL', color: POSITION_COLORS.RB },
      { pick: '1.03', first: 'Jahmyr', last: 'Gibbs', pos: 'RB', team: 'DET', color: POSITION_COLORS.RB },
      { pick: '1.04', first: 'CeeDee', last: 'Lamb', pos: 'WR', team: 'DAL', color: POSITION_COLORS.WR },
    ],
    // Round 2 - reversed
    [
      { pick: '2.04', first: 'Josh', last: 'Allen', pos: 'QB', team: 'BUF', color: POSITION_COLORS.QB },
      { pick: '2.03', first: 'Malik', last: 'Nabers', pos: 'WR', team: 'NYG', color: POSITION_COLORS.WR },
      { pick: '2.02', first: 'Sam', last: 'LaPorta', pos: 'TE', team: 'DET', color: POSITION_COLORS.TE },
      { pick: '2.01', first: 'Breece', last: 'Hall', pos: 'RB', team: 'NYJ', color: POSITION_COLORS.RB },
    ],
  ];
  
  return (
    <div style={{ padding: '0 12px', overflowX: 'auto' }}>
      <div style={{ 
        display: 'inline-flex',
        flexDirection: 'column',
        backgroundColor: '#101927',
        borderRadius: 6,
        padding: 4,
      }}>
        {/* Team Headers */}
        <div style={{ display: 'flex', gap: cellGap, marginBottom: cellGap }}>
          {teams.map((team, i) => (
            <div
              key={i}
        style={{
                width: cellWidth,
                backgroundColor: '#374151',
                borderRadius: 4,
                border: `2px solid ${team.isUser ? COLORS.accent : '#6B7280'}`,
                overflow: 'hidden',
              }}
            >
              {/* Name header */}
              <div style={{
                height: 18,
                backgroundColor: team.isUser ? COLORS.accent : '#6B7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ 
                  color: team.isUser ? '#000' : '#FFF', 
                  fontSize: 8, 
                  fontWeight: 600,
                }}>
                  {team.name}
                </span>
              </div>
              {/* Position tracker */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                padding: '6px 4px',
              }}>
                <div style={{ display: 'flex', height: 6, width: 54, borderRadius: 2, overflow: 'hidden' }}>
                  {team.tracker.map((color, j) => (
                    <div key={j} style={{ flex: 1, backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pick Rows */}
        {picks.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: cellGap, marginBottom: cellGap }}>
            {row.map((cell, colIndex) => {
              const isUserCol = colIndex === 0;
              return (
                <div
                  key={colIndex}
          style={{
                    width: cellWidth,
                    height: 56,
                    backgroundColor: `${cell.color}20`,
                    borderRadius: 4,
                    border: `2px solid ${cell.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '2px 3px',
                  }}
                >
                  {/* Pick number */}
                  <span style={{ 
                    color: '#FFF', 
                    fontSize: 7,
                    fontWeight: 500,
                  }}>
                    {cell.pick}
                  </span>
                  {/* Player name */}
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ color: '#FFF', fontSize: 8, fontWeight: 500 }}>{cell.first}</span>
                    <span style={{ color: '#FFF', fontSize: 9, fontWeight: 700 }}>{cell.last}</span>
                  </div>
                  {/* Position-Team */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#9CA3AF', fontSize: 7 }}>{cell.pos}-{cell.team}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Snake direction indicators */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '4px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 9 }}>R1</span>
            <span style={{ color: COLORS.success, fontSize: 12 }}>→</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: COLORS.success, fontSize: 12 }}>←</span>
            <span style={{ color: COLORS.textMuted, fontSize: 9 }}>R2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueIllustration(): React.ReactElement {
  const players = [
    { name: 'Ja\'Marr Chase', pos: 'WR', team: 'CIN', color: POSITION_COLORS.WR },
    { name: 'Bijan Robinson', pos: 'RB', team: 'ATL', color: POSITION_COLORS.RB },
    { name: 'Sam LaPorta', pos: 'TE', team: 'DET', color: POSITION_COLORS.TE },
  ];
  
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 12, 
        overflow: 'hidden',
        border: `1px solid ${COLORS.border}`,
      }}>
        {/* Header */}
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: COLORS.text, fontSize: 12, fontWeight: 600 }}>MY QUEUE</span>
          <span style={{ color: COLORS.accent, fontSize: 11 }}>3 players</span>
        </div>
        
        {/* Queue items */}
        {players.map((player, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderBottom: i < players.length - 1 ? `1px solid ${COLORS.border}` : 'none',
          }}
        >
            {/* Drag handle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.4 }}>
              <div style={{ width: 12, height: 2, backgroundColor: COLORS.textMuted, borderRadius: 1 }} />
              <div style={{ width: 12, height: 2, backgroundColor: COLORS.textMuted, borderRadius: 1 }} />
            </div>
            
            {/* Position badge */}
            <div style={{
              padding: '3px 6px',
              backgroundColor: player.color,
              borderRadius: 4,
            }}>
              <span style={{ color: '#000', fontSize: 10, fontWeight: 700 }}>{player.pos}</span>
            </div>
            
            {/* Player info */}
          <div style={{ flex: 1 }}>
              <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 500 }}>{player.name}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 10 }}>{player.team}</div>
            </div>
            
            {/* Remove button */}
            <div style={{ 
              width: 20, 
              height: 20, 
              borderRadius: 10, 
              backgroundColor: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: COLORS.textMuted, fontSize: 12, lineHeight: 1 }}>×</span>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

function BestBallIllustration(): React.ReactElement {
  const starters = [
    { pos: 'QB', pts: 28.4, color: POSITION_COLORS.QB },
    { pos: 'RB', pts: 22.1, color: POSITION_COLORS.RB },
    { pos: 'WR', pts: 31.2, color: POSITION_COLORS.WR },
    { pos: 'TE', pts: 18.6, color: POSITION_COLORS.TE },
  ];
  
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 12, 
        padding: 16,
        border: `1px solid ${COLORS.border}`,
      }}>
        {/* Week label */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <span style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: 600 }}>WEEK 1 LINEUP</span>
          <span style={{ color: COLORS.success, fontSize: 11, fontWeight: 600 }}>✓ Auto-set</span>
        </div>
        
        {/* Starters grid */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {starters.map((s, i) => (
            <div key={i} style={{ 
              flex: 1, 
              backgroundColor: `${s.color}15`,
              borderRadius: 6,
              padding: 8,
              textAlign: 'center',
              border: `1px solid ${s.color}40`,
            }}>
              <div style={{ 
                fontSize: 9, 
                fontWeight: 700, 
                color: s.color,
                marginBottom: 4,
              }}>{s.pos}</div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 700, 
                color: COLORS.text,
              }}>{s.pts}</div>
        </div>
          ))}
      </div>
      
        {/* Total */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          borderTop: `1px solid ${COLORS.border}`,
        }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>Week Total</span>
          <span style={{ color: COLORS.success, fontSize: 18, fontWeight: 700 }}>100.3 pts</span>
        </div>
      </div>
      
      {/* No work badge */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginTop: 12,
      }}>
        <div style={{ 
          backgroundColor: '#22C55E20',
          borderRadius: 20,
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ color: COLORS.success, fontSize: 12, fontWeight: 500 }}>No lineup changes needed!</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TUTORIAL PAGES DATA
// ============================================================================

const TUTORIAL_PAGES: TutorialPage[] = [
  {
    illustration: <DraftCardsIllustration />,
    title: 'Pick Your Players',
    description: 'When the timer shows, it\&apos;s your turn. Tap any available player to add them to your roster.',
    tips: [
      'Filter by position using the tabs at top',
      'Blue border = your cards',
      'Timer auto-picks if you run out of time',
    ],
  },
  {
    illustration: <SnakeOrderIllustration />,
    title: 'Snake Draft Format',
    description: 'Pick order flips each round so everyone gets fair value.',
    tips: [
      'Pick 1st in Round 1? You pick last in Round 2',
      'Your highlighted picks show when you\'re up',
      'Use the Board tab to plan ahead',
    ],
  },
  {
    illustration: <QueueIllustration />,
    title: 'Queue Up Players',
    description: 'Add players to your queue before your turn. Drag to set priority.',
    tips: [
      'Tap + on any player to add to queue',
      'First available queued player auto-drafts',
      'Queue saves if you disconnect',
    ],
  },
  {
    illustration: <BestBallIllustration />,
    title: 'Set It & Forget It',
    description: 'Best Ball means your best players automatically start each week. Zero maintenance.',
    tips: [
      'Top scorers slide into your lineup',
      'No trades, adds, or drops',
      'Just draft smart and enjoy the season',
    ],
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PageIndicator({ 
  total, 
  current,
  onSelect,
}: { 
  total: number; 
  current: number; 
  onSelect: (index: number) => void;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Go to step ${i + 1}`}
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i === current ? COLORS.accent : COLORS.dotInactive,
            border: 'none',
            cursor: 'pointer',
            transition: 'width 0.2s ease, background-color 0.2s ease',
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftTutorialModal({
  isOpen,
  onClose,
  onRules,
  format = 'Snake',
  showDontShowAgain = false,
  onDontShowAgainChange,
}: DraftTutorialModalProps): React.ReactElement | null {
  const [currentPage, setCurrentPage] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const isLastPage = currentPage === TUTORIAL_PAGES.length - 1;
  
  const handleDontShowAgainChange = useCallback((checked: boolean) => {
    setDontShowAgain(checked);
    onDontShowAgainChange?.(checked);
  }, [onDontShowAgainChange]);
  
  const handleNext = useCallback(() => {
    if (isLastPage) {
      onClose();
    } else {
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLastPage, onClose]);
  
  // Reset to first page when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const page = TUTORIAL_PAGES[currentPage];
  
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.background,
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 60 }} />
          <h1
            id="tutorial-modal-title"
            style={{
              margin: 0,
            fontSize: 15,
              fontWeight: 600,
            color: COLORS.textMuted,
            }}
          >
          {currentPage + 1} of {TUTORIAL_PAGES.length}
          </h1>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.accent,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            padding: '8px 0',
            width: 60,
            textAlign: 'right',
          }}
        >
          Skip
        </button>
      </div>
      
      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0 24px',
          overflowY: 'auto',
        }}
      >
        {/* Title */}
        <h2
          style={{
            margin: '0 24px 6px',
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.text,
            textAlign: 'center',
          }}
        >
          {page.title}
        </h2>
        
        {/* Description */}
        <p
          style={{
            margin: '0 24px 24px',
            fontSize: 14,
            color: COLORS.textMuted,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {page.description}
        </p>
        
        {/* Illustration */}
        <div
          style={{
            marginBottom: 24,
            minHeight: 160,
          }}
        >
          {page.illustration}
        </div>
        
        {/* Tips */}
        <div style={{ 
          margin: '0 20px',
        }}>
          {page.tips.map((tip, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                gap: 12, 
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: i === 0 ? `${COLORS.accent}10` : 'transparent',
                borderRadius: 8,
                marginBottom: 4,
              }}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: i === 0 ? COLORS.accent : COLORS.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: i === 0 ? '#FFF' : COLORS.textMuted, fontSize: 11, fontWeight: 600 }}>
                  {i + 1}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: i === 0 ? COLORS.text : COLORS.textMuted,
                  fontWeight: i === 0 ? 500 : 400,
                }}
              >
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div
        style={{
          padding: '12px 20px 28px',
          flexShrink: 0,
        }}
      >
        {/* Page Indicator */}
        <div style={{ marginBottom: 16 }}>
          <PageIndicator 
            total={TUTORIAL_PAGES.length} 
            current={currentPage} 
            onSelect={setCurrentPage}
          />
        </div>
        
        {/* Don't show again checkbox - only on last page when enabled */}
        {showDontShowAgain && isLastPage && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 16,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => handleDontShowAgainChange(e.target.checked)}
              style={{
                width: 20,
                height: 20,
                accentColor: COLORS.accent,
                cursor: 'pointer',
              }}
            />
            <span style={{ color: COLORS.textMuted, fontSize: 14 }}>
              Don't show this tutorial again
            </span>
          </label>
        )}
        
        {/* Next Button */}
          <button
            onClick={handleNext}
            style={{
            width: '100%',
            height: 50,
            backgroundColor: isLastPage ? COLORS.success : COLORS.accent,
              border: 'none',
            borderRadius: 25,
            color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            }}
          >
          {isLastPage ? 'Let\&apos;s Draft!' : 'Continue'}
          </button>
      </div>
    </div>
  );
}
